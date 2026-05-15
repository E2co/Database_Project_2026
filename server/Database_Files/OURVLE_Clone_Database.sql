DROP DATABASE IF EXISTS OURVLECloneDatabase;
CREATE DATABASE OURVLECloneDatabase;
USE OURVLECloneDatabase;

CREATE TABLE User(
    ID                  varchar(10),
    UserID              varchar(10),
    FirstName           varchar(50),
    LastName            varchar(50),
    Email               varchar(100),
    Role                varchar(10),
    Password            varchar(255),
    DateCreated         date
);

CREATE TABLE Lecturer(
    LecturerID          varchar(10),
    Name                varchar(100),
    Department          varchar(50)
);

CREATE TABLE Course(
    CourseID            varchar(10),
    CourseName          varchar(100),
    CourseCode          varchar(10),
    LecturerID          varchar(10)
);

CREATE TABLE Student(
    StudentID           varchar(10),
    FirstName           varchar(50),
    LastName            varchar(50),
    Major               varchar(50),
    EnrollmentDate      date
);

CREATE TABLE Enrollment(
    StudentID           varchar(10),
    CourseID            varchar(10)
);

CREATE TABLE Calendar_Event(
    EventID             varchar(10),
    CourseID            varchar(10),
    EventTitle          varchar(100),
    Description         varchar(255),
    EventType           varchar(50),
    EventDate           date
);

CREATE TABLE Discussion_Forum(
    CourseID            varchar(10),
    ForumID             varchar(10),
    ForumTitle          varchar(100)
);

CREATE TABLE Discussion_Thread(
    ThreadID            INT AUTO_INCREMENT PRIMARY KEY,
    ForumID             varchar(10),
    Title               varchar(50),
    Content             Text,
    CreatedDate         date,
    AuthorID            varchar(50),
    Parent_ThreadID     INT
);

CREATE TABLE Assignment(
    AssignmentID        varchar(10),
    CourseID            varchar(10),
    Title               varchar(100),
    Description         varchar(255),
    DueDate             date
);

CREATE TABLE Submission(
    SubmissionID        varchar(10),
    AssignmentID        varchar(10),
    StudentID           varchar(10),
    SubmissionURL       varchar(255),
    SubmittedAt         date
);

CREATE TABLE Grade(
    GradeID             varchar(10),
    SubmissionID        varchar(10),
    Grade               varchar(100),
    LecturerID          varchar(10)
);

CREATE TABLE Course_Content(
    ContentID               varchar(10),
    CourseID                varchar(10),
    SectionTitle            varchar(100),
    ContentType             varchar(50),
    URL                     varchar(255),
    LecturerID              varchar(10),
    UploadDate              date
);