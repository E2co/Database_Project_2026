from flask import Flask, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from functools import wraps
import os

app = Flask(__name__)

load_dotenv()

app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
DB_USER = os.getenv("DB_ROOT")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")

def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database="OURVLECloneDatabase"
    )

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('jwt_token')

        if not token:
            return jsonify({'message': 'Token is missing!!!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                        SELECT * FROM User
                        WHERE UserID = %s
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


@app.route('/register', methods=['POST'])
def register_user():
    try:
        user_info = request.get_json()

        if not user_info:
            return jsonify({"error": "No data provided."}), 400
        
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
                    SELECT Email FROM User
                    WHERE Email = %s
                    """, (user_email,))
        
        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({"error": "Email already registered."}), 400
        
        user_id = str(uuid.uuid4())[:8]
        hashed_password = generate_password_hash(user_password)
        date_created = datetime.now(timezone.utc).date()

        cursor.execute("""
                    INSERT INTO User (UserID, FirstName, LastName, Email, Role, Password, DateCreated)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (user_id, user_fname, user_lname, user_email, user_role, hashed_password, date_created))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "User registered successfully.", "UserID": user_id}), 201
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
                    SELECT UserID, Email, Password FROM User 
                    WHERE Email = %s
                    """, (user_email,))
        existing_user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not existing_user or not check_password_hash(existing_user[2], user_password):
            return jsonify({"error": "Invalid username or password."}), 401
        
        token = jwt.encode({
            'user_id': existing_user[0], 
            'exp': datetime.now(timezone.utc) + timedelta(hours=1)
            }, app.config['SECRET_KEY'], algorithm="HS256")
        
        # Ensure token is a string
        if isinstance(token, bytes):
            token = token.decode('utf-8')

        response = jsonify({
            "message": "User logged in successfully.", 
            "token": token,
            "UserID": existing_user[0]  
        })

        response.set_cookie('jwt_token', token, httponly=True, secure=False, samesite='Lax', max_age=3600)

        return response, 200
    
    except Exception as e:
        return jsonify({"message": f"Login failed: {str(e)}"}), 500
    
#@app.route('/dashboard')
#@token_required
#def dashboard(current_user):
#    return f"Welcome {current_user.name}! You are logged in."

#@app.route('', methods=[''])
#def create_course():
#    pass

@app.route('/courses', methods=['GET'])
def retrieve_courses():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT C.CourseID, C.CourseName, C.CourseCode 
                    FROM Course C
                    """)
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No courses found."}), 404

@app.route('/courses/<int:student_id>', methods=['GET'])
def retrieve_std_courses(student_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT C.CourseID, C.CourseName, C.CourseCode 
                    FROM Course C
                    INNER JOIN Enrollment E ON C.CourseID = E.CourseID
                    WHERE E.StudentID = %s
                    """, (student_id,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No courses found for this student."}), 404

@app.route('/courses/<string:lecturer_id>', methods=['GET'])
def retrieve_lec_courses(lecturer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT C.CourseID, C.CourseName, C.CourseCode 
                    FROM Course C
                    WHERE C.LecturerID = %s
                    """, (lecturer_id,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No courses found for this lecturer."}), 404
    
#@app.route('', methods=[''])
#def register_for_course():
#    pass

@app.route('/course_members/<string:course_code>', methods=['GET'])
def retrieve_participants(course_code):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT S.FirstName, S.LastName, S.Major 
                    FROM Student S 
                    INNER JOIN Enrollment E 
                    INNER JOIN Course C
                    ON C.CourseID = E.CourseID AND S.StudentID = E.StudentID
                    WHERE C.CourseCode = %s
                    """, (course_code,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No students enrolled for this course."}), 404

@app.route('/calendar_events/<string:course_code>', methods=['GET'])
def retrieve_calender_events(course_code):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT CE.EventTitle, CE.Description, CE.EventType, CE.EventDate 
                    FROM Calendar_Event CE  
                    INNER JOIN Course C
                    ON C.CourseID = CE.CourseID
                    WHERE C.CourseCode = %s
                    """, (course_code,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No students enrolled for this course."}), 404

#@app.route('/calendar_events/<string:course_code>', methods=['GET'])
#def retrieve_calender_events_date():
#    pass

@app.route('/calendar_events/<int:student_id>/<string:event_date>', methods=['GET'])
def retrieve_cal_events_dateandstudent(student_id, event_date):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT CE.EventTitle, CE.Description, CE.EventType, CE.EventDate 
                    FROM Calendar_Event CE  
                    INNER JOIN Course C
                    INNER JOIN Enrollment E
                    ON C.CourseID = CE.CourseID AND C.CourseID = E.CourseID
                    WHERE E.StudentID = %s AND CE.EventDate = %s
                    """, (student_id,event_date,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No calendar events for this student at the specified date."}), 404

#@app.route('', methods=[''])
#def create_calender_events():
#    pass

#@app.route('', methods=[''])
#def forum():
#    pass

#@app.route('', methods=[''])
#def discussion_thread():
#    pass

#@app.route('', methods=[''])
#def course_container():
#    pass

#@app.route('', methods=[''])
#def assignments():
#    pass

#@app.route('', methods=[''])
#def reports():
#    pass

if __name__ == '__main__':
    app.run(debug=True) 