# OURVLE Database Project 2026

A comprehensive Virtual Learning Environment (VLE) database system with realistic test data generation and REST API authentication.

## 📋 Project Overview

This project implements a complete **OURVLE (Our Virtual Learning Environment)** database system designed to support educational institutions with:
- 150,000+ student records
- 3,400+ courses across multiple faculties
- 750 lecturers managing courses
- Realistic calendar events, discussion forums, and student interactions
- RESTful API with JWT authentication

## 🗂️ Project Structure

```
Database_Project_2026/
├── OURVLE_Clone_Database.sql               # Schema: 7 tables with relationships
├── OURVLE_Clone_Lecturers.sql              # Lecturer data
├── OURVLE_Clone_Courses.sql                # Course catalog
├── OURVLE_Clone_Students.sql               # Student records
├── OURVLE_Clone_Enrollments.sql            # Course enrollments
├── OURVLE_Clone_Calendar_Events.sql        # Realistic academic events
├── OURVLE_Clone_Forums.sql                 # Discussion forums
├── OURVLE_Clone_Discussion_Threads.sql     # Discussion threads & replies
├── fake_data_gen.py                        # Data generator (dual-mode)
├── Lab6_app.py                             # Flask REST API
├── .env                                    # Configuration (DB credentials, SECRET_KEY)
└── README.md                               # This file
```

## 🗄️ Database Schema

### 7 Core Tables

| Table | Purpose | Record Count |
|-------|---------|--------------|
| **Lecturer** | Faculty members | 750 |
| **Course** | Academic courses | 3,400 |
| **Student** | Student records | 150,000 |
| **Enrollment** | Course enrollments | ~450,000 (avg 3-6 per student) |
| **Calendar_Event** | Lectures, labs, exams, assignments | ~34,000 |
| **Discussion_Forum** | Course discussion spaces | ~11,000 |
| **Discussion_Thread** | Forum posts and replies | ~250,000+ |

### Key Features

- **Foreign key relationships** ensure data integrity
- **Realistic academic content** with course-specific discussions
- **Faculty-based enrollment** allowing cross-department course selection
- **Enrollment constraints**: Min 3 courses, Max 6 per student; Min 10, Max unlimited per course
- **Lecturer constraints**: Each teaches 1-5 courses

## 🎓 Faculties & Departments

```
Science & Technology (Computing, Mathematics, Physics, Biology, Chemistry, Geography)
Engineering (Biomedical, Civil, Electrical Power, Electronics, Computer)
Social Sciences (Economics, Psychology, Sociology, Government, MSBM)
Medical Sciences (Medicine, Nursing, Pharmacy)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- MySQL/MariaDB server
- `pip` packages: `faker`, `flask`, `pyjwt`, `mysql-connector-python`, `python-dotenv`

### 1. Set Up Database

```bash
# Login to MySQL
mysql -u root -p

# Load schema
mysql> SOURCE OURVLE_Clone_Database.sql;

# Load data (first time only)
mysql> SOURCE OURVLE_Clone_Lecturers.sql;
mysql> SOURCE OURVLE_Clone_Courses.sql;
mysql> SOURCE OURVLE_Clone_Students.sql;
mysql> SOURCE OURVLE_Clone_Enrollments.sql;
mysql> SOURCE OURVLE_Clone_Calendar_Events.sql;
mysql> SOURCE OURVLE_Clone_Forums.sql;
mysql> SOURCE OURVLE_Clone_Discussion_Threads.sql;

# Verify data loaded
mysql> SELECT COUNT(*) as students FROM Student;
mysql> SELECT COUNT(*) as enrollments FROM Enrollment;
```

### 2. Configure Credentials

Create `.env` file:
```env
DB_ROOT=root
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
SECRET_KEY=your-secret-key-here
```

Generate a secure SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Generate Realistic Data

```bash
# First time: generate all tables
python3 fake_data_gen.py

# Update only academic content (faster)
# Edit fake_data_gen.py: REGENERATE_MODE = "forums_only"
python3 fake_data_gen.py
```

### 4. Start Flask API

```bash
python3 app.py
```

Server runs on `http://127.0.0.1:5000`

## 📡 API Endpoints

### Authentication
- **POST** `/register` - Create new user account
- **POST** `/login` - Authenticate and receive JWT token

### Courses
- **GET** `/courses` - List all courses
- **GET** `/courses/<student_id>` - Get student's enrolled courses
- **GET** `/courses/<lecturer_id>` - Get lecturer's courses
- **GET** `/course_members/<course_code>` - Get students enrolled in course

### Calendar & Events
- **GET** `/calendar_events/<course_code>` - Get events for a course
- **GET** `/calendar_events/<student_id>/<date>` - Get student's events on specific date

### Example Requests

```bash
# Register
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com", "password":"password123"}'

# Login
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com", "password":"password123"}'

# Get all courses
curl http://localhost:5000/courses

# Get student's courses
curl http://localhost:5000/courses/630160001
```

## 🔄 Data Generation Modes

### Mode 1: `"all"` - Full Generation
- Regenerates all 7 SQL files
- Use on first run or complete data refresh
- Takes ~2 minutes

```python
REGENERATE_MODE = "all"
```

### Mode 2: `"forums_only"` - Fast Academic Content Update
- Regenerates only Calendar Events, Forums, Discussion Threads
- Keeps existing Lecturer, Course, Student, Enrollment data
- Perfect for refreshing realistic academic content
- Takes ~30 seconds
- 10x faster than full generation

```python
REGENERATE_MODE = "forums_only"
```

See [README_REGEN_MODES.md](README_REGEN_MODES.md) for detailed instructions.

## ✨ Realistic Content Features

### Calendar Events
- **Course-aware titles**: "Exam: Urban Geography Assessment"
- **Event-specific descriptions**: Exam instructions, lab requirements, assignment deadlines
- **Realistic dates**: Distributed throughout semester (Sep 2 - Dec 20, 2024)
- **Event types**: Lectures, Labs, Tutorials, Assignments, Exams, Seminars, Office Hours

### Discussion Forums
- **Course-specific topics**: "General Discussion", "Project Discussion", "Weekly Q&A", "Resources & Links"
- **4-12 forums per course** with varied discussion formats

### Discussion Threads
- **Realistic student questions**: "Does anyone have suggestions on how to approach this concept?"
- **Course-specific replies**: "Great point! That's a really insightful observation about infrastructure."
- **Natural conversation flow**: 4-12 top-level posts per forum with 0-6 replies each
- **250,000+ threads and replies** across all courses

## 🔐 Security Features

- **Password hashing** with Werkzeug `generate_password_hash()`
- **JWT authentication** with 1-hour token expiration
- **HttpOnly cookies** for secure token storage
- **Input validation** on all endpoints
- **SQL injection prevention** via parameterized queries

## 📊 Data Statistics

| Metric | Value |
|--------|-------|
| Total Students | 150,000 |
| Total Courses | 3,400 |
| Total Lecturers | 750 |
| Avg Courses per Student | 3-6 |
| Avg Students per Course | 10-100 |
| Calendar Events | ~34,000 |
| Discussion Forums | ~11,000 |
| Discussion Threads & Replies | ~250,000+ |
| **Total Records Generated** | **~750,000+** |

## 🛠️ Technical Stack

- **Database**: MySQL/MariaDB
- **Backend**: Python 3.10 with Flask
- **ORM/Queries**: mysql.connector-python
- **Authentication**: PyJWT
- **Data Generation**: Faker library
- **Security**: Werkzeug password hashing
- **Environment**: python-dotenv

## 📝 System Requirements

### Disk Space
- 150,000 students × 200 bytes ≈ 30 MB
- 3,400 courses × 100 bytes ≈ 340 KB
- 450,000 enrollments × 40 bytes ≈ 18 MB
- 250,000 discussion items × 500 bytes ≈ 125 MB
- **Total**: ~200 MB (with indices)

### Memory
- Generator script: ~100 MB during execution
- MySQL server: Recommended 512 MB+

### Processing Time
- Full data generation: ~2 minutes
- Forums-only update: ~30 seconds
- Database load: ~1-2 minutes per 50,000 records

## 🐛 Known Issues & Solutions

### Issue: `KeyError: 'Lecture'` in event generation
**Status**: ✅ FIXED  
Event descriptions dictionary now includes all event types (Lab, Lecture, Tutorial, Assignment Due, Exam).

### Issue: Empty SECRET_KEY prevents JWT authentication
**Status**: ✅ FIXED  
Example `.env` provided. Generate key with: `python3 -c "import secrets; print(secrets.token_hex(32))"`

### Issue: Calendar events had unrealistic titles
**Status**: ✅ FIXED  
Now generates course-aware titles matching event types with realistic descriptions.

## 📚 Additional Documentation

- [README_REGEN_MODES.md](README_REGEN_MODES.md) - Detailed data generation workflow
- [OURVLE_Clone_Database.sql](OURVLE_Clone_Database.sql) - Complete schema with relationships

## 🎯 Use Cases

### Educational Testing
- Test VLE features with realistic 150K student dataset
- Benchmark database performance
- Validate API under heavy load

### Development
- Rapid data refresh for testing new features
- Course-specific content generation
- Discussion forum simulations

### Analytics
- Student enrollment patterns
- Course load distribution
- Discussion engagement metrics

## 🤝 Contributing

To modify data generation:
1. Edit `TOPIC_KEYWORDS`, `EVENT_DESCRIPTIONS`, or `DISCUSSION_STARTERS` in `fake_data_gen.py`
2. Adjust `NUM_LECTURERS`, `NUM_COURSES`, `NUM_STUDENTS` constants
3. Set `REGENERATE_MODE = "all"` for full generation
4. Run: `python3 fake_data_gen.py`
5. Load generated SQL files into MySQL

## 📄 License

This project is for educational purposes.

## 👤 Author

Damario Escoffery, Ruth Bakare, Nathan Crossdale, Trevaughn Johnson and Antwon Fonglyewquee - Database Project 2026

---

**Last Updated**: April 6, 2026  
**Status**: ✅ Production Ready  
**Test Data**: 150,000 students, 3,400 courses, 750 lecturers
