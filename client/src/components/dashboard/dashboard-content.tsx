"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import useAuth from "@/components/auth/auth-context"
import { coursesApi, assignmentsApi, calendarApi, gradesApi } from "@/api"
import type { Course, Assignment, CalendarEvent } from "@/api"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} style={{ height: className.includes('h-') ? undefined : '32px' }} />
}

export function DashboardContent() {
  const { user, isStudent, isLecturer, isAdmin } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [average, setAverage] = useState<number | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingAssign, setLoadingAssign] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [courseError, setCourseError] = useState<string | null>(null)

  const firstName = user?.firstName || user?.email?.split("@")[0] || "there"

  // Fetch courses based on user role
  useEffect(() => {
    if (!user || isAdmin) {
      setLoadingCourses(false)
      return
    }
    setLoadingCourses(true)
    const fetch = isStudent
      ? coursesApi.getByStudent(user.userID)
      : coursesApi.getByLecturer(user.userID)

    fetch
      .then(setCourses)
      .catch((e) => setCourseError(e.message))
      .finally(() => setLoadingCourses(false))
  }, [user, isStudent, isLecturer, isAdmin])

  // Fetch assignments (students and lecturers only)
  useEffect(() => {
    if (!courses.length || !isStudent) {
      setLoadingAssign(false)
      return
    }
    setLoadingAssign(true)
    Promise.all(courses.map((c) => assignmentsApi.getByCourse(c.CourseID).catch(() => [] as Assignment[])))
      .then((results) => setAssignments(results.flat()))
      .finally(() => setLoadingAssign(false))
  }, [courses, isStudent])

  // Fetch today's events (students and lecturers only)
  useEffect(() => {
    if (!user || !isStudent) {
      setLoadingEvents(false)
      return
    }
    const today = new Date().toISOString().split("T")[0]
    setLoadingEvents(true)
    calendarApi
      .getByStudentAndDate(user.userID, today)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false))
  }, [user, isStudent])

  // Fetch overall grade (students only)
  useEffect(() => {
    if (!user || !isStudent) return
    gradesApi.getStudentAverage(user.userID).then((r) => setAverage(r.OverallAverage)).catch(() => {})
  }, [user, isStudent])

  const pendingAssignments = assignments.filter((a) => new Date(a.DueDate) >= new Date())

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  // ============================================================================
  // ADMIN DASHBOARD
  // ============================================================================
  if (isAdmin) {
    return (
      <div>
        <div className="page-header">
          <h1>Welcome, {firstName}</h1>
          <p>System administration overview.</p>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div className="card card-clickable">
            <div className="card-content">
              <h3 className="card-title">Manage Courses</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                Create courses and assign lecturers.
              </p>
              <Link to="/dashboard/courses" className="section-link">
                Go to Courses &rarr;
              </Link>
            </div>
          </div>

          <div className="card card-clickable">
            <div className="card-content">
              <h3 className="card-title">Reports</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
                View system-wide analytics.
              </p>
              <Link to="/dashboard/reports" className="section-link">
                Go to Reports &rarr;
              </Link>
            </div>
          </div>

          <div className="card card-clickable">
            <div className="card-content">
              <h3 className="card-title">Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <Link to="/dashboard/courses" className="section-link">+ Create a new course</Link>
                <Link to="/dashboard/courses" className="section-link">+ Assign a lecturer</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // LECTURER DASHBOARD
  // ============================================================================
  if (isLecturer) {
    return (
      <div>
        <div className="page-header">
          <h1>Welcome back, {firstName}</h1>
          <p>Here&apos;s what&apos;s happening with your courses today.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Courses Teaching</span>
              <div className="stat-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                </svg>
              </div>
            </div>
            {loadingCourses ? (
              <Skeleton style={{ width: '60px', height: '36px' }} />
            ) : (
              <div className="stat-card-value">{courses.length}</div>
            )}
            <div className="stat-card-desc">Active this semester</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Students</span>
              <div className="stat-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className="stat-card-value">-</div>
            <div className="stat-card-desc">Across all courses</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Pending Submissions</span>
              <div className="stat-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
                </svg>
              </div>
            </div>
            <div className="stat-card-value">-</div>
            <div className="stat-card-desc">To be graded</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          <div className="content-main">
            <div className="section-header">
              <h2 className="section-title">My Courses</h2>
              <Link to="/dashboard/courses" className="section-link">View all</Link>
            </div>

            {loadingCourses ? (
              <div className="courses-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : courseError ? (
              <p className="text-muted">{courseError}</p>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-desc">No courses found.</p>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.slice(0, 4).map((course) => (
                  <Link key={course.CourseID} to={`/dashboard/courses/${course.CourseID}`} className="course-card">
                    <div className="card card-clickable">
                      <div className="card-content">
                        <div className="course-card-badges">
                          <span className="badge badge-primary">{course.CourseCode}</span>
                        </div>
                        <h3 className="course-card-title">{course.CourseName}</h3>
                        <p className="course-card-id">ID: {course.CourseID}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="content-sidebar">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Quick Links</h3>
              </div>
              <div className="card-content">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <Link to="/dashboard/assignments" className="section-link">
                    View assignments &amp; submissions
                  </Link>
                  <Link to="/dashboard/reports" className="section-link">
                    Class reports
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // STUDENT DASHBOARD
  // ============================================================================
  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, {firstName}</h1>
        <p>Here&apos;s what&apos;s happening with your courses today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Enrolled Courses</span>
            <div className="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
              </svg>
            </div>
          </div>
          {loadingCourses ? (
            <Skeleton style={{ width: '60px', height: '36px' }} />
          ) : (
            <div className="stat-card-value">{courses.length}</div>
          )}
          <div className="stat-card-desc">Active this semester</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Assignments</span>
            <div className="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
              </svg>
            </div>
          </div>
          {loadingAssign ? (
            <Skeleton style={{ width: '60px', height: '36px' }} />
          ) : (
            <div className="stat-card-value">{pendingAssignments.length}</div>
          )}
          <div className="stat-card-desc">Due upcoming</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Overall Average</span>
            <div className="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
          </div>
          {average === null ? (
            <Skeleton style={{ width: '80px', height: '36px' }} />
          ) : (
            <div className="stat-card-value">{average.toFixed(1)}%</div>
          )}
          <div className="stat-card-desc">Across all graded work</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Today&apos;s Events</span>
            <div className="stat-card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v4" /><path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
              </svg>
            </div>
          </div>
          {loadingEvents ? (
            <Skeleton style={{ width: '60px', height: '36px' }} />
          ) : (
            <div className="stat-card-value">{events.length}</div>
          )}
          <div className="stat-card-desc">{todayLabel.split(",")[0]}</div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Courses Section */}
        <div className="content-main">
          <div className="section-header">
            <h2 className="section-title">My Courses</h2>
            <Link to="/dashboard/courses" className="section-link">View all</Link>
          </div>

          {loadingCourses ? (
            <div className="courses-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '160px', borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : courseError ? (
            <p className="text-muted">{courseError}</p>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-desc">No courses found.</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.slice(0, 6).map((course) => (
                <Link key={course.CourseID} to={`/dashboard/content/${course.CourseID}`} className="course-card">
                  <div className="card card-clickable">
                    <div className="card-content">
                      <div className="course-card-badges">
                        <span className="badge badge-primary">{course.CourseCode}</span>
                      </div>
                      <h3 className="course-card-title">{course.CourseName}</h3>
                      <p className="course-card-lecturer">
                        {course.LecturerName || 'No lecturer assigned'}
                      </p>
                      <p className="course-card-id">ID: {course.CourseID}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="content-sidebar">
          {/* Today's Schedule */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Today&apos;s Schedule</h3>
              <p className="card-description">{todayLabel}</p>
            </div>
            <div className="card-content">
              {loadingEvents ? (
                <Skeleton style={{ height: '80px' }} />
              ) : events.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>No events today.</p>
              ) : (
                <div className="list">
                  {events.map((ev, i) => (
                    <div key={i} className="list-item">
                      <div className={`list-item-indicator ${ev.EventType}`} />
                      <div className="list-item-content">
                        <div className="list-item-title">{ev.EventTitle}</div>
                        <div className="list-item-subtitle">{ev.EventType}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/dashboard/calendar" className="section-link" style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-4)' }}>
                View full calendar
              </Link>
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upcoming Assignments</h3>
            </div>
            <div className="card-content">
              {loadingAssign ? (
                <Skeleton style={{ height: '96px' }} />
              ) : pendingAssignments.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>No pending assignments.</p>
              ) : (
                <div className="list">
                  {pendingAssignments.slice(0, 4).map((a) => (
                    <div key={a.AssignmentID} className="list-item" style={{ justifyContent: 'space-between' }}>
                      <div className="list-item-content">
                        <div className="list-item-title">{a.Title}</div>
                        <div className="list-item-subtitle">{a.Description}</div>
                      </div>
                      <span className="badge badge-outline">
                        {new Date(a.DueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/dashboard/assignments" className="section-link" style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-4)' }}>
                View all assignments
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardContent
