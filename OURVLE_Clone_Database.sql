CREATE DATABASE IF NOT EXISTS OURVLECloneDatabase;
USE OURVLECloneDatabase;

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
    ThreadID            varchar(10),
    ForumID             varchar(10),
    Content             varchar(255),
    CreatedDate         date,
    Author              varchar(50),
    Parent_ThreadID     varchar(10)
);