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


# ─────────────────────────────────────────────
#  USER REGISTRATION/LOGIN
# ─────────────────────────────────────────────
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
                    SELECT Email 
                    FROM User
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
                    SELECT UserID, Email, Password 
                    FROM User 
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
    
@app.route('/dashboard', methods=['PUT'])
@token_required
def dashboard(current_user):
    return f"Welcome {current_user.name}! You are logged in."


# ─────────────────────────────────────────────
#  CREATE/REGISTER FOR COURSES
# ─────────────────────────────────────────────
# CREATE COURSE  (Admin only)
@app.route('/courses/create', methods=['POST'])
@token_required
def create_course(current_user):
    """
    Only admins can create a course.
    current_user tuple indexes (from SELECT * FROM User):
      0=UserID, 1=FirstName, 2=LastName, 3=Email, 4=Role, 5=Password, 6=DateCreated
    """
    try:
        user_role = current_user[4]
 
        if user_role.lower() != 'admin':
            return jsonify({"error": "Access denied. Only admins can create courses."}), 403
 
        course_data = request.get_json()
        if not course_data:
            return jsonify({"error": "No data provided."}), 400
 
        course_name = course_data.get('CourseName', '').strip()
        course_code = course_data.get('CourseCode', '').strip()
        lecturer_id = course_data.get('LecturerID', '').strip()   # optional at creation time
 
        if not course_name or not course_code:
            return jsonify({"error": "Missing required fields: CourseName, CourseCode."}), 400
 
        conn = get_db_connection()
        cursor = conn.cursor()
 
        # CourseCode must be unique
        cursor.execute("SELECT CourseID FROM Course WHERE CourseCode = %s", (course_code,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": f"A course with code '{course_code}' already exists."}), 409
 
        # If a lecturer is supplied up-front, validate them
        if lecturer_id:
            cursor.execute("SELECT LecturerID FROM Lecturer WHERE LecturerID = %s", (lecturer_id,))
            if not cursor.fetchone():
                cursor.close()
                conn.close()
                return jsonify({"error": "Lecturer not found."}), 404
 
            # Enforce max 5 courses per lecturer
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
    
#  REGISTER FOR COURSE – Student enrolment
@app.route('/courses/<string:course_id>/enroll', methods=['POST'])
@token_required
def register_for_course(current_user, course_id):
    """
    Enrol a student in the given course.
    - Student must exist in the Student table.
    - Cannot enrol in the same course twice.
    - A student may not exceed 6 courses in total.
    """
    try:
        enroll_data = request.get_json()
        if not enroll_data:
            return jsonify({"error": "No data provided."}), 400
 
        student_id = enroll_data.get('StudentID', '').strip()
        if not student_id:
            return jsonify({"error": "Missing required field: StudentID."}), 400
 
        conn = get_db_connection()
        cursor = conn.cursor()
 
        # Verify the course exists
        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404
 
        # Verify the student exists
        cursor.execute("SELECT StudentID FROM Student WHERE StudentID = %s", (student_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Student not found."}), 404
 
        # Prevent duplicate enrolment
        cursor.execute(
            "SELECT StudentID FROM Enrollment WHERE StudentID = %s AND CourseID = %s",
            (student_id, course_id)
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Student is already enrolled in this course."}), 409
 
        # Enforce max 6 courses per student
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
 
        return jsonify({
            "message": "Student enrolled successfully.",
            "StudentID": student_id,
            "CourseID": course_id
        }), 201
 
    except mysql.connector.Error as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Enrolment failed: {str(e)}"}), 500
    
#  ASSIGN LECTURER TO COURSE  (Admin only)
@app.route('/courses/<string:course_id>/lecturer', methods=['PUT'])
@token_required
def assign_lecturer(current_user, course_id):
    """
    Assign (or reassign) the single lecturer for a course.
    Only admins may do this.
    """
    try:
        user_role = current_user[4]
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
 
        # Verify course exists
        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404
 
        # Verify lecturer exists
        cursor.execute("SELECT LecturerID FROM Lecturer WHERE LecturerID = %s", (lecturer_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Lecturer not found."}), 404
 
        # Enforce max 5 courses per lecturer (exclude this course in case of reassignment)
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
#  RETRIEVE MEMBERS
# ─────────────────────────────────────────────
@app.route('/courses/retrieve', methods=['GET'])
def retrieve_courses():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT CourseID, CourseName, CourseCode 
                    FROM Course
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
                    SELECT CourseID, CourseName, CourseCode 
                    FROM Course 
                    WHERE LecturerID = %s
                    """, (lecturer_id,))
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": "No courses found for this lecturer."}), 404


# ─────────────────────────────────────────────
#  RETRIEVE MEMBERS
# ─────────────────────────────────────────────
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
    

# ─────────────────────────────────────────────
#  RETRIEVE CALENDAR EVENTS
# ─────────────────────────────────────────────
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
        return jsonify({"error": "No calendar events for this course."}), 404

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


# ─────────────────────────────────────────────
#  CREATE CALENDAR EVENTS
# ─────────────────────────────────────────────
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

        """ Need an Event ID """
        
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
        
        return jsonify({"message": "Calendar event created successfully."}), 201
    except mysql.connector.Error as e:
        if e.errno == 1452:
            return jsonify({"error": "Course not found."}), 404
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    

# ─────────────────────────────────────────────
#  FORUMS
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

        """ Need a Forum ID """
        
        cursor.execute("""
            INSERT INTO Discussion_Forum (CourseID, ForumTitle)
            VALUES (%s, %s)
        """, (course_id, forum_title))
        
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Forum created successfully."}), 201
    
    except mysql.connector.Error as e:
        if e.errno == 1452:
            return jsonify({"error": "Course not found."}), 404
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/forums/<string:course_code>', methods=['GET'])
def retrieve_forums(course_code):
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
            return jsonify(forums), 200
        else:
            return jsonify({"error": "No forums found for this course."}), 404
    
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve forums: {str(e)}"}), 500
    

# ─────────────────────────────────────────────
#  DISCUSSION THREAD
# ─────────────────────────────────────────────
#@app.route('', methods=[''])
#def discussion_thread():
#    pass

#@app.route('', methods=[''])
#def course_container():
#    pass

#@app.route('', methods=[''])
#def assignments():
#    pass
    

# ─────────────────────────────────────────────
#  COURSE CONTENT
# ─────────────────────────────────────────────

@app.route('/content/<string:course_id>', methods=['GET'])
def retrieve_course_content(course_id):
    """Retrieve all course content for a particular course, grouped by section."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Verify course exists
        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404

        cursor.execute("""
            SELECT ContentID, SectionTitle, ContentType, ContentURL, UploadedBy, DateUploaded
            FROM Course_Content
            WHERE CourseID = %s
            ORDER BY SectionTitle, DateUploaded
        """, (course_id,))

        content = cursor.fetchall()
        cursor.close()
        conn.close()

        if content:
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
    """
    Lecturer adds content to a course.
    Content types: link, file, slide
    Content is organised by section.
    """
    try:
        user_role = current_user[4]
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

        # Verify course exists
        cursor.execute("SELECT CourseID FROM Course WHERE CourseID = %s", (course_id,))
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Course not found."}), 404

        # Verify lecturer is assigned to this course
        lecturer_id = current_user[0]   # UserID == LecturerID in your schema
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
#  ASSIGNMENTS
# ─────────────────────────────────────────────

@app.route('/courses/assignments/<string:course_id>', methods=['GET'])
def retrieve_assignments(course_id):
    """Retrieve all assignments for a course."""
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
            return jsonify(assignments), 200
        else:
            return jsonify({"error": "No assignments found for this course."}), 404

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve assignments: {str(e)}"}), 500


@app.route('/courses/assignments/<string:course_id>', methods=['POST'])
@token_required
def create_assignment(current_user, course_id):
    """Lecturer creates an assignment for a course."""
    try:
        user_role = current_user[4]
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
    """Student submits an assignment."""
    try:
        user_role = current_user[4]
        if user_role.lower() != 'student':
            return jsonify({"error": "Access denied. Only students can submit assignments."}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided."}), 400

        student_id = data.get('StudentID', '').strip()
        file_path  = data.get('FilePath', '').strip()  
        
        if not all([student_id, file_path]):
            return jsonify({"error": "Missing required fields: StudentID, FilePath."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Verify assignment exists
        cursor.execute("SELECT AssignmentID, CourseID FROM Assignment WHERE AssignmentID = %s", (assignment_id,))
        assignment = cursor.fetchone()
        if not assignment:
            cursor.close()
            conn.close()
            return jsonify({"error": "Assignment not found."}), 404

        course_id = assignment[1]

        # Verify student is enrolled in the course
        cursor.execute(
            "SELECT StudentID FROM Enrollment WHERE StudentID = %s AND CourseID = %s",
            (student_id, course_id)
        )
        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "Student is not enrolled in this course."}), 403

        # Prevent duplicate submission
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
            INSERT INTO Submission (SubmissionID, AssignmentID, StudentID, FilePath, SubmittedAt)
            VALUES (%s, %s, %s, %s, %s)
        """, (submission_id, assignment_id, student_id, file_path, submitted_at))

        conn.commit()
        cursor.close()
        conn.close()

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
    """
    Lecturer grades a student's submission.
    The grade is also factored into the student's overall average.
    """
    try:
        user_role = current_user[4]
        if user_role.lower() != 'lecturer':
            return jsonify({"error": "Access denied. Only lecturers can submit grades."}), 403

        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided."}), 400

        student_id = data.get('StudentID', '').strip()
        grade      = data.get('Grade')   # numeric, e.g. 85.5

        if not student_id or grade is None:
            return jsonify({"error": "Missing required fields: StudentID, Grade."}), 400

        if not (0 <= float(grade) <= 100):
            return jsonify({"error": "Grade must be between 0 and 100."}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Verify submission exists for this student & assignment
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

        # Prevent duplicate grading
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
#  REPORTS
# ─────────────────────────────────────────────
@app.route('/reports/fifty_or_more', methods=['GET'])
def fifty_or_more_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT C.CourseName, C.CourseCode  
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
def five_or_more_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT S.FirstName, S.LastName, S.Major  
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
def three_or_more_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT L.Name, L.Department  
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
def top_ten_enrolled_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
                    SELECT CourseName, CourseCode  
                    FROM Course C
                    INNER JOIN Enrollment E
                    ON C.CourseID = E.CourseID
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
    """Returns a student's overall grade average across all graded submissions."""
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

        return jsonify({
            "StudentID": student_id,
            "OverallAverage": result['OverallAverage'] if result['OverallAverage'] is not None else 0
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve average: {str(e)}"}), 500
    
"""   
@app.route('/reports/', methods=['GET'])
def report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(""" """)
    courses = cursor.fetchall()
    cursor.close()
    conn.close()
    if courses:
        return jsonify(courses)
    else:
        return jsonify({"error": ""}), 404"""


if __name__ == '__main__':
    app.run(debug=True) 