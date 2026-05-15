# OURVLE Server

The backend REST API for the OURVLE (Our Virtual Learning Environment) system. Built with **Flask** and **MySQL**, providing authentication, data management, and RESTful endpoints for the educational platform.

## 📋 Project Overview

This is the backend service for the OURVLE educational platform, handling:
- **User Authentication** - JWT-based registration and login
- **Course Management** - Course catalog, enrollments, and content
- **Student Records** - 150,000+ student profiles with enrollment data
- **Assignments** - Assignment creation, submission tracking, and grading
- **Calendar Events** - Academic calendar with lectures, labs, and exams
- **Discussion Forums** - Course-based forums with threads and replies
- **Grades** - Student grades and academic performance tracking

## 🛠️ Tech Stack

- **Python 3.8+** - Backend programming language
- **Flask** - Lightweight web framework
- **MySQL** - Relational database
- **Flask-CORS** - Cross-Origin Resource Sharing support
- **PyJWT** - JSON Web Token authentication
- **python-dotenv** - Environment variable management
- **mysql-connector-python** - MySQL database connector
- **Werkzeug** - Password hashing and utilities

## 📁 Project Structure

```
server/
├── app.py                          # Main Flask application & route handlers
├── fake_data_gen.py                # Data generator for testing
├── requirements.txt                # Python dependencies
├── .env                            # Environment configuration (credentials)
├── .gitignore                      # Git ignore rules
├── COMP3161_Project.postman_collection.json  # API test collection
└── Database_Files/
    ├── OURVLE_Clone_Database.sql       # Schema: 7 tables with relationships
    ├── OURVLE_Clone_Lecturers.sql      # Lecturer data (~750 records)
    ├── OURVLE_Clone_Courses.sql        # Course catalog (~3,400 courses)
    ├── OURVLE_Clone_Students.sql       # Student records (~150,000 students)
    ├── OURVLE_Clone_Grades.sql         # Grade records
    ├── OURVLE_Clone_Assignments.sql    # Assignment records
    ├── OURVLE_Clone_Calendar_Events.sql # Academic calendar events
    ├── OURVLE_Clone_Forums.sql         # Discussion forums
    ├── OURVLE_Clone_Course_Content.sql # Course materials
    ├── Enrollments/                    # Student course enrollments
    ├── Students/                       # Additional student data files
    ├── Submissions/                    # Student assignment submissions
    └── Discussion_Threads/             # Forum discussion threads
```

## 🗄️ Database Schema

### 7 Core Tables

| Table | Purpose | Records |
|-------|---------|---------|
| **User** | Students, lecturers, admins | 150,750+ |
| **Lecturer** | Faculty members | 750 |
| **Course** | Academic courses | 3,400 |
| **Student** | Student profiles | 150,000 |
| **Enrollment** | Course registrations | ~450,000 |
| **Calendar_Event** | Academic events (lectures, exams) | ~34,000 |
| **Discussion_Forum** | Course discussion spaces | ~11,000 |
| **Discussion_Thread** | Forum posts and replies | ~250,000+ |
| **Assignment** | Course assignments | Variable |
| **Submission** | Student submissions | Variable |
| **Grades** | Student grades | Variable |

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** - Download from [python.org](https://www.python.org/)
- **MySQL 8.0+** - Database server
- **pip** - Python package manager (comes with Python)

### Installation

1. **Navigate to server directory:**
```bash
cd server
```

2. **Create a virtual environment:**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
Create a `.env` file in the `server/` directory:
```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=your_secret_key_here_change_in_production

# Database Configuration
DB_HOST=localhost
DB_ROOT=root
DB_PASSWORD=your_mysql_password
DB_PORT=3306
```

5. **Set up the database:**
```bash
# Start MySQL and create the database
mysql -u root -p < Database_Files/OURVLE_Clone_Database.sql
mysql -u root -p OURVLECloneDatabase < Database_Files/OURVLE_Clone_Lecturers.sql
mysql -u root -p OURVLECloneDatabase < Database_Files/OURVLE_Clone_Courses.sql
mysql -u root -p OURVLECloneDatabase < Database_Files/OURVLE_Clone_Students.sql
# ... continue with other SQL files
```

6. **Run the Flask server:**
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## 🔌 API Endpoints

### Authentication

```
POST   /register              # Register new user
POST   /login                 # User login
```

### Courses

```
GET    /courses               # List all courses
GET    /courses/<id>          # Get course details
GET    /courses/<id>/content  # Get course content
POST   /courses               # Create course (admin only)
PUT    /courses/<id>          # Update course (admin only)
DELETE /courses/<id>          # Delete course (admin only)
```

### Assignments

```
GET    /assignments           # List user's assignments
GET    /assignments/<id>      # Get assignment details
POST   /assignments/<id>/submit  # Submit assignment
GET    /submissions           # List submissions (admin)
GET    /grades                # Get user's grades
```

### Calendar

```
GET    /calendar              # Get calendar events
GET    /calendar/<id>         # Get event details
```

### Forums

```
GET    /forums                # List discussion forums
GET    /forums/<id>           # Get forum details
GET    /forums/<id>/threads   # Get forum threads
POST   /forums/<id>/threads   # Create thread
GET    /forums/threads/<id>   # Get thread
POST   /forums/threads/<id>/reply  # Reply to thread
```

### Students (Admin Only)

```
GET    /students              # List all students
GET    /students/<id>         # Get student details
GET    /students/<id>/enrollments  # Get student enrollments
GET    /students/<id>/grades  # Get student grades
```

## 🔐 Authentication

The API uses **JWT (JSON Web Tokens)** for authentication:

1. User registers or logs in
2. Server returns JWT token (valid for specified duration)
3. Client includes token in `Authorization: Bearer <token>` header
4. Server validates token on protected routes

### Protected Routes

All routes except `/register` and `/login` require a valid JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔧 Configuration

### Environment Variables (`.env`)

```env
# Application
FLASK_ENV=development          # development or production
FLASK_DEBUG=1                  # 0 or 1
SECRET_KEY=your_secret_key     # Change this in production!

# Database
DB_HOST=localhost              # MySQL host
DB_ROOT=root                   # MySQL username
DB_PASSWORD=your_password      # MySQL password
DB_PORT=3306                   # MySQL port
```

### CORS Configuration

The server is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`
- `http://localhost:5174` (Alternate port)
- `http://127.0.0.1:5174`

Modify the `CORS()` and `@app.before_request` decorators in `app.py` to add more allowed origins.

## 📊 Data Generation

The `fake_data_gen.py` script can generate realistic test data:

```bash
# Generate and populate database
python fake_data_gen.py
```

This creates:
- 150,000 student records
- 3,400 courses
- 750 lecturers
- 450,000+ enrollments
- Realistic academic calendar events
- Discussion forums and threads

## 📝 Development Guidelines

### Code Structure

```python
from flask import Flask, jsonify, request

# Initialize Flask app
app = Flask(__name__)

# Middleware/Decorators
@app.before_request
def before_request():
    # Code runs before each request
    pass

# Route handlers
@app.route('/endpoint', methods=['GET', 'POST'])
@token_required  # Optional: require authentication
def handler(current_user=None):
    try:
        # Handle request
        return jsonify({'data': 'response'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

### Error Handling

```python
# Return appropriate HTTP status codes
return jsonify({'error': 'message'}), 400  # Bad Request
return jsonify({'error': 'message'}), 401  # Unauthorized
return jsonify({'error': 'message'}), 403  # Forbidden
return jsonify({'error': 'message'}), 404  # Not Found
return jsonify({'error': 'message'}), 500  # Server Error
```

## 🧪 Testing

Use the provided **Postman collection** to test API endpoints:

1. Import `COMP3161_Project.postman_collection.json` into Postman
2. Configure environment variables (BASE_URL, TOKEN, etc.)
3. Run individual requests or create automated test suites

## 🐛 Troubleshooting

### Connection Refused

```
Error: Connection refused on port 5000
```
- Ensure Flask server is running (`python app.py`)
- Check that port 5000 is not in use: `lsof -i :5000`

### Database Connection Error

```
Error: Access denied for user 'root'@'localhost'
```
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database is created: `mysql -u root -p < OURVLE_Clone_Database.sql`

### CORS Issues

```
Access to XMLHttpRequest blocked by CORS policy
```
- Verify client origin is in allowed list in `app.py`
- Check that CORS headers are being sent correctly
- Test with Postman to isolate frontend vs backend issue

### JWT Token Invalid

```
Token is invalid!
```
- Ensure token is included in Authorization header
- Check that token hasn't expired
- Verify SECRET_KEY matches in `.env`

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [MySQL Connector Python](https://dev.mysql.com/doc/connector-python/en/)
- [RESTful API Best Practices](https://restfulapi.net/)

## 👥 Contributing

Follow the established code style and patterns. Test all API endpoints before submitting changes.

## 📄 License

This project is part of the COMP3161 course at the University of the West Indies.
