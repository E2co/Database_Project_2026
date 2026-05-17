"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import useAuth from "@/components/auth/auth-context"
import { coursesApi } from "@/api"
import type { Course } from "@/api"

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton" style={style} />
}

export function CoursesContent() {
  const { user, isStudent, isLecturer, isAdmin } = useAuth()

  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Enroll dialog state
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [enrollCourseId, setEnrollCourseId] = useState("")
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null)

  // Create course dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newCourse, setNewCourse] = useState({ CourseName: "", CourseCode: "", LecturerID: "" })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  // Assign lecturer dialog state
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assignCourseId, setAssignCourseId] = useState("")
  const [assignLecturerId, setAssignLecturerId] = useState("")
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)

    const myFetch = isStudent
      ? coursesApi.getByStudent(user.userID)
      : isLecturer
      ? coursesApi.getByLecturer(user.userID)
      : coursesApi.getAll()

    myFetch
      .then(setMyCourses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user, isStudent, isLecturer, isAdmin])

  useEffect(() => {
    if (!isStudent) return
    coursesApi.getAll().then(setAllCourses).catch(() => {})
  }, [isStudent])

  const enrolledIds = new Set(myCourses.map((c) => c.CourseID))

  const displayCourses = (isStudent ? allCourses : myCourses).filter((c) =>
    c.CourseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.CourseCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEnroll = async () => {
    if (!user || !enrollCourseId.trim()) return
    setEnrollLoading(true)
    setEnrollError(null)
    setEnrollSuccess(null)
    try {
      await coursesApi.enroll(enrollCourseId.trim(), user.userID)
      setEnrollSuccess("Enrolled successfully!")
      const updated = await coursesApi.getByStudent(user.userID)
      setMyCourses(updated)
      setEnrollCourseId("")
    } catch (e: unknown) {
      setEnrollError(e instanceof Error ? e.message : "Enrollment failed.")
    } finally {
      setEnrollLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newCourse.CourseName || !newCourse.CourseCode) return
    setCreateLoading(true)
    setCreateError(null)
    setCreateSuccess(null)
    try {
      await coursesApi.create({
        CourseName: newCourse.CourseName,
        CourseCode: newCourse.CourseCode,
        LecturerID: newCourse.LecturerID || undefined,
      })
      setCreateSuccess("Course created successfully!")
      const updated = await coursesApi.getAll()
      setMyCourses(updated)
      setNewCourse({ CourseName: "", CourseCode: "", LecturerID: "" })
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Create failed.")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleAssignLecturer = async () => {
    if (!assignCourseId.trim() || !assignLecturerId.trim()) return
    setAssignLoading(true)
    setAssignError(null)
    setAssignSuccess(null)
    try {
      await coursesApi.assignLecturer(assignCourseId.trim(), assignLecturerId.trim())
      setAssignSuccess("Lecturer assigned successfully!")
      const updated = await coursesApi.getAll()
      setMyCourses(updated)
      setAssignCourseId("")
      setAssignLecturerId("")
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Assignment failed.")
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header page-header-with-actions">
        <div>
          <h1>{isAdmin ? "Courses" : "My Courses"}</h1>
          <p>
            {isAdmin
              ? "Create and manage all courses"
              : isLecturer
              ? "Courses you are currently teaching"
              : "Browse and manage your course enrollments"}
          </p>
        </div>

        <div className="page-actions">
          {isStudent && (
            <button className="btn btn-primary" onClick={() => setShowEnrollDialog(true)}>
              + Enroll in Course
            </button>
          )}

          {isAdmin && (
            <>
              <button className="btn btn-primary" onClick={() => setShowCreateDialog(true)}>
                + Create Course
              </button>
              <button className="btn btn-secondary" onClick={() => setShowAssignDialog(true)}>
                Assign Lecturer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="search-input" style={{ marginBottom: 'var(--space-6)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="courses-grid">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} style={{ height: '180px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : error ? (
        <p className="text-muted">{error}</p>
      ) : displayCourses.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
          </svg>
          <p className="empty-state-title">No courses found</p>
          <p className="empty-state-desc">Try adjusting your search or add a new course.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {displayCourses.map((course) => {
            const enrolled = enrolledIds.has(course.CourseID)
            return (
              <Link key={course.CourseID} to={`/dashboard/content/${course.CourseID}`} className="course-card">
                <div className="card card-clickable">
                  <div className="card-content">
                    <div className="course-card-badges">
                      <span className={`badge ${enrolled ? 'badge-primary' : 'badge-secondary'}`}>
                        {course.CourseCode}
                      </span>
                      {isAdmin && !course.LecturerID && (
                        <span className="badge badge-error">No Lecturer</span>
                      )}
                    </div>
                    <h3 className="course-card-title">{course.CourseName}</h3>
                    <p className="course-card-lecturer">
                      {course.LecturerName
                        ? `Lecturer: ${course.LecturerName}`
                        : course.LecturerID
                        ? `Lecturer ID: ${course.LecturerID}`
                        : "No lecturer assigned"}
                    </p>
                    <p className="course-card-id">ID: {course.CourseID}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Enroll Dialog */}
      {showEnrollDialog && (
        <div className="dialog-overlay" onClick={() => setShowEnrollDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Enroll in a Course</h2>
              <p className="dialog-description">Enter the Course ID to enroll.</p>
            </div>
            <div className="dialog-body">
              <div className="form-group">
                <label className="form-label">Course ID</label>
                <input
                  className="form-input"
                  placeholder="e.g., a1b2c3d4"
                  value={enrollCourseId}
                  onChange={(e) => setEnrollCourseId(e.target.value)}
                />
              </div>
              {enrollError && <p className="form-error mt-2">{enrollError}</p>}
              {enrollSuccess && <p className="form-success mt-2">{enrollSuccess}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowEnrollDialog(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEnroll} disabled={enrollLoading}>
                {enrollLoading ? "Enrolling..." : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Dialog */}
      {showCreateDialog && (
        <div className="dialog-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Create a New Course</h2>
              <p className="dialog-description">Fill in the course details below.</p>
            </div>
            <div className="dialog-body">
              <div className="form-group mb-4">
                <label className="form-label">Course Name</label>
                <input
                  className="form-input"
                  placeholder="e.g., Database Management Systems"
                  value={newCourse.CourseName}
                  onChange={(e) => setNewCourse((p) => ({ ...p, CourseName: e.target.value }))}
                />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Course Code</label>
                <input
                  className="form-input"
                  placeholder="e.g., COMP3161"
                  value={newCourse.CourseCode}
                  onChange={(e) => setNewCourse((p) => ({ ...p, CourseCode: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Lecturer ID <span className="form-hint">(optional - can assign later)</span>
                </label>
                <input
                  className="form-input"
                  placeholder="e.g., lec-00001"
                  value={newCourse.LecturerID}
                  onChange={(e) => setNewCourse((p) => ({ ...p, LecturerID: e.target.value }))}
                />
              </div>
              {createError && <p className="form-error mt-2">{createError}</p>}
              {createSuccess && <p className="form-success mt-2">{createSuccess}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={createLoading}>
                {createLoading ? "Creating..." : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Lecturer Dialog */}
      {showAssignDialog && (
        <div className="dialog-overlay" onClick={() => setShowAssignDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Assign Lecturer to Course</h2>
              <p className="dialog-description">
                Enter the Course ID and the Lecturer ID to assign. A course can only have one lecturer.
              </p>
            </div>
            <div className="dialog-body">
              <div className="form-group mb-4">
                <label className="form-label">Course ID</label>
                <input
                  className="form-input"
                  placeholder="e.g., a1b2c3d4"
                  value={assignCourseId}
                  onChange={(e) => setAssignCourseId(e.target.value)}
                />
                {myCourses.length > 0 && (
                  <div style={{ 
                    marginTop: 'var(--space-2)', 
                    padding: 'var(--space-2)', 
                    background: 'var(--color-bg-tertiary)', 
                    borderRadius: 'var(--radius-md)', 
                    maxHeight: '120px', 
                    overflowY: 'auto' 
                  }}>
                    {myCourses.map((c) => (
                      <button
                        key={c.CourseID}
                        type="button"
                        onClick={() => setAssignCourseId(c.CourseID)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: 'var(--space-1) var(--space-2)',
                          fontSize: '0.75rem',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        <strong>{c.CourseCode}</strong> - {c.CourseID}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Lecturer ID</label>
                <input
                  className="form-input"
                  placeholder="e.g., lec-00001"
                  value={assignLecturerId}
                  onChange={(e) => setAssignLecturerId(e.target.value)}
                />
              </div>
              {assignError && <p className="form-error mt-2">{assignError}</p>}
              {assignSuccess && <p className="form-success mt-2">{assignSuccess}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAssignLecturer} disabled={assignLoading}>
                {assignLoading ? "Assigning..." : "Assign Lecturer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CoursesContent
