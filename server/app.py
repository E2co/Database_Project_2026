from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from functools import wraps
import os
from flask_cors import CORS
from flask_caching import Cache
import valkey
import json

app = Flask(__name__)
load_dotenv()

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
DB_USER = os.getenv("DB_ROOT")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL")
app.config['CACHE_TYPE'] = 'RedisCache'
app.config['CACHE_REDIS_URL'] = REDIS_URL
app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # 5 minutes default cache timeout

cache = Cache(app)

# Initialize Redis client for more advanced operations
try:
    redis_client = valkey.from_url(REDIS_URL, decode_responses=True)
    # Test connection
    redis_client.ping()
    print("Redis connected successfully!")
except Exception as e:
    print(f"Redis connection failed: {e}")
    redis_client = None

# Cache TTL configurations (in seconds)
CACHE_TTL = {
    'courses': 300,      # 5 minutes
    'reports': 600,      # 10 minutes
    'student_data': 300, # 5 minutes
    'lecturer_data': 300,# 5 minutes
    'calendar': 600,     # 10 minutes
    'forums': 300,       # 5 minutes
    'assignments': 300,  # 5 minutes
    'content': 600,      # 10 minutes
}

# ─────────────────────────────────────────────
#  CORS CONFIGURATION (FIXED)
# ─────────────────────────────────────────────
# Get frontend URL from environment and strip trailing slashes
FRONTEND_URL = os.getenv("FRONTEND_URL", "").rstrip('/')

# Build the list of allowed origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

print(f"DEBUG: CORS allowed origins: {ALLOWED_ORIGINS}")

CORS(app,
     supports_credentials=True,
     origins=ALLOWED_ORIGINS)

# ─────────────────────────────────────────────
#  CACHE HELPER FUNCTIONS
# ─────────────────────────────────────────────
def invalidate_course_cache(course_id=None, course_code=None):
    """Invalidate cache for courses when data changes."""
    cache.delete('courses_all')
    cache.delete('courses_top_ten')
    if course_id:
        cache.delete(f'course_content_{course_id}')
    if course_code:
        cache.delete(f'course_members_{course_code}')
        cache.delete(f'calendar_events_{course_code}')
        cache.delete(f'forums_{course_code}')

def invalidate_student_cache(student_id):
    """Invalidate cache for student data."""
    cache.delete(f'student_courses_{student_id}')
    cache.delete(f'student_calendar_{student_id}')
    cache.delete(f'student_average_{student_id}')

def invalidate_lecturer_cache(lecturer_id):
    """Invalidate cache for lecturer data."""
    cache.delete(f'lecturer_courses_{lecturer_id}')

def invalidate_assignment_cache(course_id, assignment_id=None):
    """Invalidate cache for assignments."""
    cache.delete(f'assignments_{course_id}')
    if assignment_id:
        cache.delete(f'submissions_{assignment_id}')

def get_cached_or_query(cache_key, query_func, ttl=CACHE_TTL['courses']):
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200
    result = query_func()
    if result:
        if redis_client:
            redis_client.setex(cache_key, ttl, json.dumps(result))
        return jsonify(result), 200
    return jsonify({"error": "No data found."}), 404    

# Belt-and-suspenders: manually handle every OPTIONS preflight
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "")
        allowed = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            os.getenv("FRONTEND_URL", "")
        ]
        res = app.make_default_options_response()
        if origin in allowed:
            res.headers["Access-Control-Allow-Origin"] = origin
            res.headers["Access-Control-Allow-Credentials"] = "true"
            res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            res.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return res

@app.after_request
def inject_cors_headers(response):
    """Ensure every response carries the correct CORS headers."""
    origin = request.headers.get("Origin", "")
    allowed = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        os.getenv("FRONTEND_URL", "")
    ]
    if origin in allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database="defaultdb",
        port=int(os.getenv("DB_PORT", 3306)),
        ssl_disabled=False,
        connect_timeout=10
    )

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        if not token:
            token = request.cookies.get('jwt_token')

        if not token:
            return jsonify({'message': 'Token is missing!!!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                        SELECT * FROM User
                        WHERE ID = %s
                        """, (data['user_id'],))
            current_user = cursor.fetchone()
            cursor.close()
            conn.close()

            if not current_user:
                return jsonify({'message': 'User not found!!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except Exception as e:
            return jsonify({'message': f'Token is invalid! {str(e)}'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# ─────────────────────────────────────────────
#  USER REGISTRATION/LOGIN
# ─────────────────────────────────────────────
@app.route('/register', methods=['POST'])
def register_user():
    try:
        user_info = request.get_json()

        if not user_info:
            return jsonify({"error": "No data provided."}), 400
        
        user_id = user_info.get('UserID', '').strip()
        user_fname = user_info.get('FirstName', '').strip()
        user_lname = user_info.get('LastName', '').strip()
        user_email = user_info.get('Email', '').strip()
        user_role = user_info.get('Role', '').strip()
        user_password = user_info.get('Password', '').strip()

        if not all([user_fname, user_lname, user_email, user_role, user_password]):
            return jsonify({"error": "Missing required fields."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
                    SELECT Email 
                    FROM User
                    WHERE Email = %s
                    """, (user_email,))
        
        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({"error": "Email already registered."}), 400
        
        id = str(uuid.uuid4())[:8]
        hashed_password = generate_password_hash(user_password)

        # If UserID not provided, generate one
        if not user_id:
            user_id = str(uuid.uuid4())[:8]

        cursor.execute("""
                    INSERT INTO User (ID, UserID, FirstName, LastName, Email, Role, Password, DateCreated)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (id, user_id, user_fname, user_lname, user_email, user_role, hashed_password, datetime.now(timezone.utc)))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "User registered successfully.", "ID": id}), 201
    
    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route('/login', methods=["POST"])
def login():
    try:
        login_info = request.get_json()

        if not login_info:
            return jsonify({"error": "No data provided."}), 400
        
        user_email = login_info.get('Email', '').strip()
        user_password = login_info.get('Password', '').strip()

        if not user_email or not user_password:
            return jsonify({"error": "Missing Email or Password."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
                    SELECT * FROM User 
                    WHERE Email = %s
                    """, (user_email,))
        
        existing_user = cursor.fetchone()
        cursor.close()
        conn.close()

        if not existing_user or not check_password_hash(existing_user[6], user_password):
            return jsonify({"error": "Invalid username or password."}), 401
        
        token = jwt.encode(
            {
                'user_id': existing_user[0],
                'user_email': existing_user[3],
                'exp': datetime.now(timezone.utc) + timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm="HS256")
        
        # Set httpOnly jwt_token cookie
        response = jsonify({"message": "Login successful!", "token": token, "ID": existing_user[0]})
        response.set_cookie('jwt_token', token, httponly=True, secure=True, samesite='Lax')

        return response, 200

    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route('/logout', methods=["POST"])
def logout():
    response = jsonify({"message": "User logged out successfully."})
    response.set_cookie('jwt_token', '', expires=0)
    return response, 200
    
@app.route('/dashboard', methods=['PUT'])
@token_required
def dashboard(current_user):
    return f"Welcome {current_user[2]} {current_user[3]}! You are logged in."

@app.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    try:
        return jsonify({
            "ID":        current_user[0],
            "UserID":    current_user[1],
            "FirstName": current_user[2],
            "LastName":  current_user[3],
            "Email":     current_user[4],
            "Role":      current_user[5],
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve user: {str(e)}"}), 500

# ─────────────────────────────────────────────
#  CREATE/REGISTER FOR COURSES (with cache invalidation)
# ─────────────────────────────────────────────
@app.route('/courses/create', methods=['POST'])
@token_required
def create_course(current_user):
    try:
        user_role = current_user[5]
 
        if user_role.lower() != 'admin':
            return jsonify({"error": "Access denied. Only admins can create courses."}), 403
 
        course_data = request.get_json()
        if not course_data:
            return jsonify({"error": "No data provided."}), 400
 
        course_name = course_data.get('CourseName', '').strip()
        course_code = course_data.get('CourseCode', '').strip()
        lecturer_id = course_data.get('LecturerID', '').strip()
 
        if not course_name or not course_code:
            return jsonify({"error": "Missing required fields: CourseName, CourseCode."}), 400
 
        conn = get_db_connection()
        cursor = conn.cursor()
 
        cursor.execute("SELECT CourseID FROM Course WHERE CourseCode = %s", (course_code,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": f"A course with code '{course_code}' already exists."}), 409
 
        if lecturer_id:
            cursor.execute("SELECT LecturerID FROM Lecturer WHERE LecturerID = %s", (lecturer_id,))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": "Lecturer not found."}), 404
 
            cursor.execute("SELECT COUNT(*) FROM Course WHERE LecturerID = %s", (lecturer_id,))
            lec_count = cursor.fetchone()[0]
            if lec_count >= 5:
                cursor.close()
                conn.close()
                return jsonify({"error": "Lecturer already teaches 5 courses (maximum allowed)."}), 400
 
        course_id = str(uuid.uuid4())[:8]
 
        cursor.execute(
            "INSERT INTO Course (CourseID, CourseName, CourseCode, LecturerID) VALUES (%s, %s, %s, %s)",
            (course_id, course_name, course_code, lecturer_id if lecturer_id else None)
        )
        conn.commit()
        cursor.close()
        conn.close()
 
        # Invalidate cache
        invalidate_course_cache()
 
        return jsonify({
            "message": "Course created successfully.",
            "CourseID": course_id,
            "CourseName": course_name,
            "CourseCode": course_code,
            "LecturerID": lecturer_id if lecturer_id else None
        }), 201
 
    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Course creation failed: {str(e)}"}), 500
    
@app.route('/courses/enroll/<string:course_id>', methods=['POST'])
@token_required
def register_for_course(current_user, course_id):
    try:
        enroll_data = request.get_json()
        if not enroll_data:
            return jsonify({"error": "No data provided."}), 400
 
        student_id = enroll_data.get('StudentID', '').strip()
        if not student_id:
            return jsonify({"error": "Missing required field: StudentID."}), 400
 
        conn = get_db_connection()
        cursor = conn.cursor()
 
        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404
 
        cursor.execute("SELECT StudentID FROM Student WHERE StudentID = %s", (student_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Student not found."}), 404
 
        cursor.execute(
            "SELECT StudentID FROM Enrollment WHERE StudentID = %s AND CourseID = %s",
            (student_id, course_id)
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Student is already enrolled in this course."}), 409
 
        cursor.execute("SELECT COUNT(*) FROM Enrollment WHERE StudentID = %s", (student_id,))
        current_count = cursor.fetchone()[0]
        if current_count >= 6:
            cursor.close()
            conn.close()
            return jsonify({"error": "Student is already enrolled in 6 courses (maximum allowed)."}), 400
 
        cursor.execute(
            "INSERT INTO Enrollment (StudentID, CourseID) VALUES (%s, %s)",
            (student_id, course_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
 
        # Invalidate student and course cache
        invalidate_student_cache(student_id)
        invalidate_course_cache(course_id)
 
        return jsonify({
            "message": "Student enrolled successfully.",
            "StudentID": student_id,
            "CourseID": course_id
        }), 201
 
    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Enrolment failed: {str(e)}"}), 500
    
@app.route('/courses/lecturer/<string:course_id>', methods=['PUT'])
@token_required
def assign_lecturer(current_user, course_id):
    try:
        user_role = current_user[5]
        if user_role.lower() != 'admin':
            return jsonify({"error": "Access denied. Only admins can assign lecturers."}), 403
 
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided."}), 400
 
        lecturer_id = data.get('LecturerID', '').strip()
        if not lecturer_id:
            return jsonify({"error": "Missing required field: LecturerID."}), 400
 
        conn = get_db_connection()
        cursor = conn.cursor()
 
        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404
 
        cursor.execute("SELECT LecturerID FROM Lecturer WHERE LecturerID = %s", (lecturer_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Lecturer not found."}), 404
 
        cursor.execute(
            "SELECT COUNT(*) FROM Course WHERE LecturerID = %s AND CourseID != %s",
            (lecturer_id, course_id)
        )
        lec_count = cursor.fetchone()[0]
        if lec_count >= 5:
            cursor.close()
            conn.close()
            return jsonify({"error": "Lecturer already teaches 5 courses (maximum allowed)."}), 400
 
        cursor.execute(
            "UPDATE Course SET LecturerID = %s WHERE CourseID = %s",
            (lecturer_id, course_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
 
        # Invalidate cache
        invalidate_course_cache(course_id)
        invalidate_lecturer_cache(lecturer_id)
 
        return jsonify({
            "message": "Lecturer assigned to course successfully.",
            "CourseID": course_id,
            "LecturerID": lecturer_id
        }), 200
 
    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Lecturer assignment failed: {str(e)}"}), 500

# ─────────────────────────────────────────────
#  RETRIEVE COURSES (with caching)
# ─────────────────────────────────────────────
@app.route('/courses/retrieve', methods=['GET'])
@cache.cached(timeout=CACHE_TTL['courses'], key_prefix='courses_all')
def retrieve_courses():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT C.CourseID, C.CourseName, C.CourseCode,
                        C.LecturerID, L.Name AS LecturerName
                    FROM Course C
                    LEFT JOIN Lecturer L ON C.LecturerID = L.LecturerID
                    """)
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No courses found."}), 404

@app.route('/courses/std/<string:student_id>', methods=['GET'])
def retrieve_std_courses(student_id):
    cache_key = f'student_courses_{student_id}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT C.CourseID, C.CourseName, C.CourseCode,
                        C.LecturerID, L.Name AS LecturerName
                    FROM Course C
                    LEFT JOIN Lecturer L ON C.LecturerID = L.LecturerID
                    INNER JOIN Enrollment E ON C.CourseID = E.CourseID
                    WHERE E.StudentID = %s
                    """, (student_id,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if courses:
        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL['courses'], json.dumps(courses))
        return jsonify(courses)
    else:
        return jsonify({"error": "No courses found for this student."}), 404

@app.route('/courses/lecturer/<string:lecturer_id>', methods=['GET'])
def retrieve_lec_courses(lecturer_id):
    cache_key = f'lecturer_courses_{lecturer_id}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT C.CourseID, C.CourseName, C.CourseCode,
                        C.LecturerID, L.Name AS LecturerName
                    FROM Course C
                    LEFT JOIN Lecturer L ON C.LecturerID = L.LecturerID
                    WHERE C.LecturerID = %s
                    """, (lecturer_id,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if courses:
        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL['courses'], json.dumps(courses))
        return jsonify(courses)
    else:
        return jsonify({"error": "No courses found for this lecturer."}), 404

@app.route('/course_members/<string:course_code>', methods=['GET'])
def retrieve_participants(course_code):
    cache_key = f'course_members_{course_code}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT S.FirstName, S.LastName, S.Major 
                    FROM Student S 
                    INNER JOIN Enrollment E ON S.StudentID = E.StudentID
                    INNER JOIN Course C ON C.CourseID = E.CourseID
                    WHERE C.CourseCode = %s
                    """, (course_code,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if courses:
        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL['courses'], json.dumps(courses))
        return jsonify(courses)
    else:
        return jsonify({"error": "No students enrolled for this course."}), 404

# ─────────────────────────────────────────────
#  RETRIEVE CALENDAR EVENTS (with caching)
# ─────────────────────────────────────────────
@app.route('/calendar_events/<string:course_code>', methods=['GET'])
def retrieve_calender_events(course_code):
    cache_key = f'calendar_events_{course_code}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT CE.EventTitle, CE.Description, CE.EventType, CE.EventDate 
                    FROM Calendar_Event CE  
                    INNER JOIN Course C ON C.CourseID = CE.CourseID
                    WHERE C.CourseCode = %s
                    """, (course_code,))
    events = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if events:
        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL['calendar'], json.dumps(events))
        return jsonify(events)
    else:
        return jsonify({"error": "No calendar events for this course."}), 404

@app.route('/calendar_events/<string:student_id>', methods=['GET'])
def retrieve_cal_events_student(student_id):
    cache_key = f'student_calendar_{student_id}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT CE.EventTitle, CE.Description, CE.EventType, CE.EventDate 
                    FROM Calendar_Event CE  
                    INNER JOIN Course C ON C.CourseID = CE.CourseID
                    INNER JOIN Enrollment E ON C.CourseID = E.CourseID
                    WHERE E.StudentID = %s
                    """, (student_id,))
    events = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if events:
        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL['calendar'], json.dumps(events))
        return jsonify(events)
    else:
        return jsonify({"error": "No calendar events for this student."}), 404

@app.route('/calendar_events/<string:student_id>/<string:event_date>', methods=['GET'])
def retrieve_cal_events_dateandstudent(student_id, event_date):
    cache_key = f'student_calendar_{student_id}_{event_date}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT CE.EventTitle, CE.Description, CE.EventType, CE.EventDate 
                    FROM Calendar_Event CE  
                    INNER JOIN Course C ON C.CourseID = CE.CourseID
                    INNER JOIN Enrollment E ON C.CourseID = E.CourseID
                    WHERE E.StudentID = %s AND CE.EventDate = %s
                    """, (student_id, event_date,))
    events = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if events:
        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL['calendar'], json.dumps(events))
        return jsonify(events)
    else:
        return jsonify({"error": "No calendar events for this student at the specified date."}), 404

@app.route('/calendar_events', methods=['POST'])
def create_calender_events():
    try:
        event_data = request.get_json()
        if not event_data:
            return jsonify({"error": "No data provided."}), 400
        
        course_id = event_data.get('CourseID', '').strip()
        event_title = event_data.get('EventTitle', '').strip()
        description = event_data.get('Description', '').strip()
        event_type = event_data.get('EventType', '').strip()
        event_date = event_data.get('EventDate', '').strip()
        
        if not all([course_id, event_title, description, event_type, event_date]):
            return jsonify({"error": "Missing required fields ."}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Calendar_Event (CourseID, EventTitle, Description, EventType, EventDate)
            VALUES (%s, %s, %s, %s, %s)
        """, (course_id, event_title, description, event_type, event_date))
        conn.commit()
        conn.close()
        
        # Invalidate calendar cache
        cache.delete(f'calendar_events_{course_id}')
        
        return jsonify({"message": "Calendar event created successfully."}), 201
    except mysql.connector.Error as e:
        if e.errno == 1452:
            return jsonify({"error": "Course not found."}), 404
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# ─────────────────────────────────────────────
#  FORUMS (with caching)
# ─────────────────────────────────────────────
@app.route('/forums', methods=['POST'])
def create_forum():
    try:
        forum_data = request.get_json()
        
        if not forum_data:
            return jsonify({"error": "No data provided."}), 400
        
        course_id = forum_data.get('CourseID', '').strip()
        forum_title = forum_data.get('ForumTitle', '').strip()
        
        if not all([course_id, forum_title]):
            return jsonify({"error": "Missing required fields (CourseID, ForumTitle)."}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO Discussion_Forum (CourseID, ForumTitle)
            VALUES (%s, %s)
        """, (course_id, forum_title))
        
        conn.commit()
        conn.close()
        
        # Invalidate forums cache
        cache.delete(f'forums_{course_id}')
        
        return jsonify({"message": "Forum created successfully."}), 201
    
    except mysql.connector.Error as e:
        if e.errno == 1452:
            return jsonify({"error": "Course not found."}), 404
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/forums/<string:course_code>', methods=['GET'])
def retrieve_forums(course_code):
    cache_key = f'forums_{course_code}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT DF.ForumID, DF.ForumTitle, DF.CourseID
            FROM Discussion_Forum DF
            INNER JOIN Course C ON C.CourseID = DF.CourseID
            WHERE C.CourseCode = %s
        """, (course_code,))
        
        forums = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if forums:
            if redis_client:
                redis_client.setex(cache_key, CACHE_TTL['forums'], json.dumps(forums))
            return jsonify(forums), 200
        else:
            return jsonify({"error": "No forums found for this course."}), 404
    
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve forums: {str(e)}"}), 500

@app.route('/forums/<int:forum_id>/threads', methods=['GET'])
def discussion_thread(forum_id):
    cache_key = f'forum_threads_{forum_id}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT ThreadID, ForumID, Title, Content, CreatedDate, Author, Parent_ThreadID
            FROM Discussion_Thread
            WHERE ForumID = %s
            ORDER BY CreatedDate ASC
        """, (forum_id,))

        threads = cursor.fetchall()
        cursor.close()
        conn.close()

        if threads:
            if redis_client:
                redis_client.setex(cache_key, CACHE_TTL['forums'], json.dumps(threads))
            return jsonify(threads), 200
        else:
            return jsonify({"error": "No threads found for this forum."}), 404
            
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve threads: {str(e)}"}), 500

@app.route('/forums/<string:forum_id>/threads', methods=['POST'])
@token_required
def create_thread(current_user, forum_id):
    try:
        data = request.get_json()
        title = data.get('Title', '').strip()
        content = data.get('Content', '').strip()
        author_id = current_user[0]

        if not title or not content:
            return jsonify({"error": "Title and Content are required for a new thread."}), 400

        created_date = datetime.now(timezone.utc).date()

        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO Discussion_Thread (ForumID, Title, Content, CreatedDate, Author, Parent_ThreadID)
            VALUES (%s, %s, %s, %s, %s, NULL)
        """, (forum_id, title, content, created_date, author_id))
        
        conn.commit()
        new_id = cursor.lastrowid 
        cursor.close()
        conn.close()

        # Invalidate forum threads cache
        cache.delete(f'forum_threads_{forum_id}')
        cache.delete(f'forums_*')

        return jsonify({"message": "Thread created successfully.", "ThreadID": new_id}), 201

    except Exception as e:
        return jsonify({"error": f"Failed to create thread: {str(e)}"}), 500

@app.route('/threads/<string:thread_id>/replies', methods=['POST'])
@token_required
def reply_to_thread(current_user, thread_id):
    try:
        data = request.get_json()
        content = data.get('Content', '').strip()
        author_id = current_user[0]

        if not content:
            return jsonify({"error": "Content is required for a reply."}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT ForumID FROM Discussion_Thread WHERE ThreadID = %s", (thread_id,))
        parent = cursor.fetchone()
        
        if not parent:
            cursor.close()
            conn.close()
            return jsonify({"error": "The thread or post you are replying to does not exist."}), 404

        created_date = datetime.now(timezone.utc).date()

        cursor.execute("""
            INSERT INTO Discussion_Thread (ForumID, Title, Content, CreatedDate, Author, Parent_ThreadID)
            VALUES (%s, NULL, %s, %s, %s, %s)
        """, (parent['ForumID'], content, created_date, author_id, thread_id))
        
        conn.commit()
        new_reply_id = cursor.lastrowid
        cursor.close()
        conn.close()

        # Invalidate forum threads cache
        cache.delete(f'forum_threads_{parent["ForumID"]}')

        return jsonify({"message": "Reply posted successfully.", "ReplyID": new_reply_id}), 201

    except Exception as e:
        return jsonify({"error": f"Failed to post reply: {str(e)}"}), 500

# ─────────────────────────────────────────────
#  COURSE CONTENT (with caching)
# ─────────────────────────────────────────────
@app.route('/dashboard/content/<string:course_id>', methods=['GET'])
def retrieve_course_content(course_id):
    cache_key = f'course_content_{course_id}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404

        cursor.execute("""
            SELECT CC.ContentID, CC.SectionTitle, CC.ContentType, CC.URL, CC.LecturerID, CC.UploadDate
            FROM Course_Content CC
            WHERE CC.CourseID = %s
            ORDER BY SectionTitle, UploadDate
        """, (course_id,))

        content = cursor.fetchall()
        cursor.close()
        conn.close()

        if content:
            if redis_client:
                redis_client.setex(cache_key, CACHE_TTL['content'], json.dumps(content))
            return jsonify(content), 200
        else:
            return jsonify({"error": "No content found for this course."}), 404

    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve content: {str(e)}"}), 500

@app.route('/courses/content/<string:course_id>', methods=['POST'])
@token_required
def add_course_content(current_user, course_id):
    try:
        user_role = current_user[5]
        if user_role.lower() != 'lecturer':
            return jsonify({"error": "Access denied. Only lecturers can add course content."}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided."}), 400

        section_title  = data.get('SectionTitle', '').strip()
        content_type   = data.get('ContentType', '').strip().lower()
        content_url    = data.get('ContentURL', '').strip()

        if not all([section_title, content_type, content_url]):
            return jsonify({"error": "Missing required fields: SectionTitle, ContentType, ContentURL."}), 400

        if content_type not in ('link', 'file', 'slide'):
            return jsonify({"error": "ContentType must be one of: link, file, slide."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404

        lecturer_id = current_user[0]
        cursor.execute(
            "SELECT CourseID FROM Course WHERE CourseID = %s AND LecturerID = %s",
            (course_id, lecturer_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "You are not the lecturer for this course."}), 403

        content_id   = str(uuid.uuid4())[:8]
        date_uploaded = datetime.now(timezone.utc).date()

        cursor.execute("""
            INSERT INTO Course_Content (ContentID, CourseID, SectionTitle, ContentType, ContentURL, UploadedBy, DateUploaded)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (content_id, course_id, section_title, content_type, content_url, lecturer_id, date_uploaded))

        conn.commit()
        cursor.close()
        conn.close()

        # Invalidate course content cache
        cache.delete(f'course_content_{course_id}')

        return jsonify({
            "message": "Course content added successfully.",
            "ContentID": content_id,
            "CourseID": course_id,
            "SectionTitle": section_title,
            "ContentType": content_type
        }), 201

    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to add content: {str(e)}"}), 500

# ─────────────────────────────────────────────
#  ASSIGNMENTS (with caching)
# ─────────────────────────────────────────────
@app.route('/courses/assignments/<string:course_id>', methods=['GET'])
def retrieve_assignments(course_id):
    cache_key = f'assignments_{course_id}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404

        cursor.execute("""
            SELECT AssignmentID, Title, Description, DueDate
            FROM Assignment
            WHERE CourseID = %s
            ORDER BY DueDate
        """, (course_id,))

        assignments = cursor.fetchall()
        cursor.close()
        conn.close()

        if assignments:
            if redis_client:
                redis_client.setex(cache_key, CACHE_TTL['assignments'], json.dumps(assignments))
            return jsonify(assignments), 200
        else:
            return jsonify({"error": "No assignments found for this course."}), 404

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve assignments: {str(e)}"}), 500

@app.route('/courses/assignments/<string:course_id>', methods=['POST'])
@token_required
def create_assignment(current_user, course_id):
    try:
        user_role = current_user[5]
        if user_role.lower() != 'lecturer':
            return jsonify({"error": "Access denied. Only lecturers can create assignments."}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided."}), 400

        title       = data.get('Title', '').strip()
        description = data.get('Description', '').strip()
        due_date    = data.get('DueDate', '').strip() 

        if not all([title, description, due_date]):
            return jsonify({"error": "Missing required fields: Title, Description, DueDate."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404

        lecturer_id = current_user[0]
        cursor.execute(
            "SELECT CourseID FROM Course WHERE CourseID = %s AND LecturerID = %s",
            (course_id, lecturer_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "You are not the lecturer for this course."}), 403

        assignment_id = str(uuid.uuid4())[:8]

        cursor.execute("""
            INSERT INTO Assignment (AssignmentID, CourseID, Title, Description, DueDate)
            VALUES (%s, %s, %s, %s, %s)
        """, (assignment_id, course_id, title, description, due_date))

        conn.commit()
        cursor.close()
        conn.close()

        # Invalidate assignments cache
        invalidate_assignment_cache(course_id)

        return jsonify({
            "message": "Assignment created successfully.",
            "AssignmentID": assignment_id,
            "CourseID": course_id,
            "Title": title,
            "DueDate": due_date
        }), 201

    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to create assignment: {str(e)}"}), 500

@app.route('/assignments/submit/<string:assignment_id>', methods=['POST'])
@token_required
def submit_assignment(current_user, assignment_id):
    try:
        user_role = current_user[5]
        if user_role.lower() != 'student':
            return jsonify({"error": "Access denied. Only students can submit assignments."}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided."}), 400

        student_id = data.get('StudentID', '').strip()
        file_path  = data.get('SubmissionURL', '').strip()  
        
        if not all([student_id, file_path]):
            return jsonify({"error": "Missing required fields: StudentID, SubmissionURL."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT AssignmentID, CourseID FROM Assignment WHERE AssignmentID = %s", (assignment_id,))
        assignment = cursor.fetchone()
        if not assignment:
            cursor.close()
            conn.close()
            return jsonify({"error": "Assignment not found."}), 404

        course_id = assignment[1]

        cursor.execute(
            "SELECT StudentID FROM Enrollment WHERE StudentID = %s AND CourseID = %s",
            (student_id, course_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Student is not enrolled in this course."}), 403

        cursor.execute(
            "SELECT SubmissionID FROM Submission WHERE AssignmentID = %s AND StudentID = %s",
            (assignment_id, student_id)
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Assignment already submitted."}), 409

        submission_id  = str(uuid.uuid4())[:8]
        submitted_at   = datetime.now(timezone.utc)

        cursor.execute("""
            INSERT INTO Submission (SubmissionID, AssignmentID, StudentID, SubmissionURL, SubmittedAt)
            VALUES (%s, %s, %s, %s, %s)
        """, (submission_id, assignment_id, student_id, file_path, submitted_at))

        conn.commit()
        cursor.close()
        conn.close()

        # Invalidate submissions cache
        cache.delete(f'submissions_{assignment_id}')

        return jsonify({
            "message": "Assignment submitted successfully.",
            "SubmissionID": submission_id,
            "AssignmentID": assignment_id,
            "StudentID": student_id
        }), 201

    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Submission failed: {str(e)}"}), 500

@app.route('/assignments/grade/<string:assignment_id>', methods=['POST'])
@token_required
def grade_submission(current_user, assignment_id):
    try:
        user_role = current_user[5]
        if user_role.lower() != 'lecturer':
            return jsonify({"error": "Access denied. Only lecturers can submit grades."}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided."}), 400

        student_id = data.get('StudentID', '').strip()
        grade      = data.get('Grade')

        if not student_id or grade is None:
            return jsonify({"error": "Missing required fields: StudentID, Grade."}), 400

        if not (0 <= float(grade) <= 100):
            return jsonify({"error": "Grade must be between 0 and 100."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT SubmissionID FROM Submission
            WHERE AssignmentID = %s AND StudentID = %s
        """, (assignment_id, student_id))
        submission = cursor.fetchone()
        if not submission:
            cursor.close()
            conn.close()
            return jsonify({"error": "Submission not found for this student."}), 404

        submission_id = submission[0]
        lecturer_id   = current_user[0]

        cursor.execute(
            "SELECT GradeID FROM Grade WHERE SubmissionID = %s", (submission_id,)
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "This submission has already been graded."}), 409

        grade_id = str(uuid.uuid4())[:8]

        cursor.execute("""
            INSERT INTO Grade (GradeID, SubmissionID, Grade, GradedBy)
            VALUES (%s, %s, %s, %s)
        """, (grade_id, submission_id, float(grade), lecturer_id))

        conn.commit()
        cursor.close()
        conn.close()

        # Invalidate student average cache
        invalidate_student_cache(student_id)
        cache.delete(f'submissions_{assignment_id}')

        return jsonify({
            "message": "Grade submitted successfully.",
            "GradeID": grade_id,
            "SubmissionID": submission_id,
            "StudentID": student_id,
            "Grade": float(grade)
        }), 201

    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Grading failed: {str(e)}"}), 500

# ─────────────────────────────────────────────
#  REPORTS (with caching)
# ─────────────────────────────────────────────
@app.route('/reports/fifty_or_more', methods=['GET'])
@cache.cached(timeout=CACHE_TTL['reports'], key_prefix='report_fifty_or_more')
def fifty_or_more_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT C.CourseName, C.CourseCode, COUNT(E.StudentID) AS EnrolledStudents
                    FROM Course C
                    INNER JOIN Enrollment E ON C.CourseID = E.CourseID
                    GROUP BY C.CourseID, C.CourseName, C.CourseCode
                    HAVING COUNT(E.StudentID) >= 50
                    """)
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No course has 50 or more students enrolled."}), 404

@app.route('/reports/five_or_more', methods=['GET'])
@cache.cached(timeout=CACHE_TTL['reports'], key_prefix='report_five_or_more')
def five_or_more_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT S.FirstName, S.LastName, S.Major, COUNT(E.CourseID) AS EnrolledCourses
                    FROM Student S
                    INNER JOIN Enrollment E ON S.StudentID = E.StudentID
                    GROUP BY S.StudentID, S.FirstName, S.LastName, S.Major
                    HAVING COUNT(E.CourseID) >= 5
                    """)
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No student is enrolled in 5 or more courses."}), 404

@app.route('/reports/three_or_more', methods=['GET'])
@cache.cached(timeout=CACHE_TTL['reports'], key_prefix='report_three_or_more')
def three_or_more_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT L.Name, L.Department, COUNT(C.CourseID) AS CoursesTaught
                    FROM Lecturer L
                    INNER JOIN Course C ON L.LecturerID = C.LecturerID
                    GROUP BY L.LecturerID, L.Name, L.Department
                    HAVING COUNT(C.CourseID) >= 3
                    """)
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No lecturer teaches 3 or more courses."}), 404

@app.route('/reports/top_ten_enrolled', methods=['GET'])
@cache.cached(timeout=CACHE_TTL['reports'], key_prefix='report_top_ten_enrolled')
def top_ten_enrolled_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT CourseName, CourseCode, COUNT(E.StudentID) AS EnrolledStudents
                    FROM Course C
                    INNER JOIN Enrollment E ON C.CourseID = E.CourseID
                    GROUP BY C.CourseID, C.CourseName, C.CourseCode
                    ORDER BY COUNT(E.StudentID) DESC
                    LIMIT 10
                    """)
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No courses found."}), 404

@app.route('/students/average/<string:student_id>', methods=['GET'])
def get_student_average(student_id):
    cache_key = f'student_average_{student_id}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT StudentID FROM Student WHERE StudentID = %s", (student_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Student not found."}), 404

        cursor.execute("""
            SELECT ROUND(AVG(G.Grade), 2) AS OverallAverage
            FROM Grade G
            INNER JOIN Submission S ON G.SubmissionID = S.SubmissionID
            WHERE S.StudentID = %s
        """, (student_id,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        response_data = {
            "StudentID": student_id,
            "OverallAverage": result['OverallAverage'] if result['OverallAverage'] is not None else 0
        }
        
        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL['reports'], json.dumps(response_data))
        
        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve average: {str(e)}"}), 500

@app.route('/reports/top_ten_students', methods=['GET'])
@cache.cached(timeout=CACHE_TTL['reports'], key_prefix='report_top_ten_students')
def top_ten_students_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT 
                        St.StudentID, St.FirstName, St.LastName, St.Major, ROUND(avg_grade, 2) AS AverageGrade
                    FROM Student St
                    INNER JOIN (
                        SELECT 
                            S.StudentID,
                            AVG(G.Grade) as avg_grade
                        FROM Submission S
                        INNER JOIN Grade G ON G.SubmissionID = S.SubmissionID
                        WHERE G.Grade > 0
                        GROUP BY S.StudentID
                    ) StudentGrades ON St.StudentID = StudentGrades.StudentID
                    ORDER BY AverageGrade DESC
                    LIMIT 10;
                    """)
    students = cursor.fetchall()
    cursor.close()
    conn.close()
    if students:
        return jsonify(students)
    else:
        return jsonify({"error": "No students found."}), 404

# ─────────────────────────────────────────────
#  GET SUBMISSIONS FOR AN ASSIGNMENT (Lecturer)
# ─────────────────────────────────────────────
@app.route('/assignments/submissions/<string:assignment_id>', methods=['GET'])
@token_required
def get_submissions(current_user, assignment_id):
    cache_key = f'submissions_{assignment_id}'
    
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return jsonify(json.loads(cached_data)), 200

    try:
        user_role = current_user[5]
        if user_role.lower() != 'lecturer':
            return jsonify({"error": "Access denied. Only lecturers can view submissions."}), 403

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT A.AssignmentID, A.CourseID
            FROM Assignment A
            INNER JOIN Course C ON A.CourseID = C.CourseID
            WHERE A.AssignmentID = %s AND C.LecturerID = %s
        """, (assignment_id, current_user[1]))

        assignment = cursor.fetchone()
        if not assignment:
            cursor.close()
            conn.close()
            return jsonify({"error": "Assignment not found or you are not the lecturer for this course."}), 404

        cursor.execute("""
            SELECT
                S.SubmissionID,
                S.StudentID,
                U.FirstName,
                U.LastName,
                U.Email,
                S.FilePath,
                S.SubmittedAt,
                G.Grade,
                G.GradeID
            FROM Submission S
            INNER JOIN User U ON S.StudentID = U.UserID
            LEFT JOIN Grade G ON S.SubmissionID = G.SubmissionID
            WHERE S.AssignmentID = %s
            ORDER BY S.SubmittedAt ASC
        """, (assignment_id,))

        submissions = cursor.fetchall()
        cursor.close()
        conn.close()

        if redis_client:
            redis_client.setex(cache_key, CACHE_TTL['assignments'], json.dumps(submissions))
        
        return jsonify(submissions), 200

    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve submissions: {str(e)}"}), 500

# ─────────────────────────────────────────────
#  DEBUG ENDPOINT (Remove in production)
# ─────────────────────────────────────────────
@app.route('/debug/cors', methods=['GET', 'OPTIONS'])
def debug_cors():
    """Debug endpoint to check CORS configuration."""
    return jsonify({
        "frontend_url_env": os.getenv("FRONTEND_URL", "NOT SET"),
        "request_origin": request.headers.get("Origin", "NOT SET"),
        "allowed_origins": ALLOWED_ORIGINS,
        "request_method": request.method
    }), 200

# ─────────────────────────────────────────────
#  HEALTH CHECK ENDPOINT
# ─────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render and monitoring."""
    status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {}
    }
    
    # Check database connection
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        conn.close()
        status["services"]["database"] = "connected"
    except Exception as e:
        status["services"]["database"] = f"error: {str(e)}"
        status["status"] = "unhealthy"
    
    # Check Redis connection
    if redis_client:
        try:
            redis_client.ping()
            status["services"]["redis"] = "connected"
        except Exception as e:
            status["services"]["redis"] = f"error: {str(e)}"
            status["status"] = "degraded"
    else:
        status["services"]["redis"] = "not configured"
    
    return jsonify(status), 200 if status["status"] == "healthy" else 503

# ─────────────────────────────────────────────
#  CLEAR CACHE ENDPOINT (Admin only)
# ─────────────────────────────────────────────
@app.route('/admin/cache/clear', methods=['POST'])
@token_required
def clear_cache(current_user):
    """Clear all cache - Admin only."""
    user_role = current_user[5]
    if user_role.lower() != 'admin':
        return jsonify({"error": "Access denied. Only admins can clear cache."}), 403
    
    try:
        if redis_client:
            redis_client.flushall()
        cache.clear()
        return jsonify({"message": "Cache cleared successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to clear cache: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)