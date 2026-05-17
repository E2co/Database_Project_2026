"use client"

import { useEffect, useState, useCallback } from "react"
import useAuth from "@/components/auth/auth-context"
import { coursesApi, assignmentsApi, gradesApi } from "@/api"
import type { Assignment, Course, Submission } from "@/api"

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton" style={style} />
}

interface RichAssignment extends Assignment {
  courseCode: string
  courseName: string
  courseId: string
}

// Submissions Panel for Lecturers
function SubmissionsPanel({ assignment }: { assignment: RichAssignment }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [grading, setGrading] = useState<Submission | null>(null)
  const [gradeValue, setGradeValue] = useState("")
  const [gradeSaving, setGradeSaving] = useState(false)
  const [gradeError, setGradeError] = useState<string | null>(null)
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null)

  const loadSubmissions = useCallback(() => {
    setLoading(true)
    assignmentsApi.getSubmissions(assignment.AssignmentID)
      .then(setSubmissions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [assignment.AssignmentID])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  const graded = submissions.filter((s) => s.Grade !== null)
  const ungraded = submissions.filter((s) => s.Grade === null)

  const handleGrade = async () => {
    if (!grading) return
    const num = parseFloat(gradeValue)
    if (isNaN(num) || num < 0 || num > 100) {
      setGradeError("Enter a grade between 0 and 100.")
      return
    }
    setGradeSaving(true)
    setGradeError(null)
    setGradeSuccess(null)
    try {
      await assignmentsApi.grade(assignment.AssignmentID, grading.StudentID, num)
      setGradeSuccess(`Grade of ${num}% saved for ${grading.FirstName} ${grading.LastName}.`)
      setGradeValue("")
      loadSubmissions()
    } catch (e: unknown) {
      setGradeError(e instanceof Error ? e.message : "Grading failed.")
    } finally {
      setGradeSaving(false)
    }
  }

  if (loading) return <Skeleton style={{ height: '96px', marginTop: 'var(--space-4)' }} />
  if (error) return <p className="form-error mt-4">{error}</p>

  return (
    <div style={{ marginTop: 'var(--space-4)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <span className="badge badge-secondary">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</span>
        <span className="badge badge-success">{graded.length} graded</span>
        {ungraded.length > 0 && <span className="badge badge-error">{ungraded.length} awaiting grade</span>}
      </div>

      {submissions.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.875rem' }}>No submissions yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {submissions.map((sub) => (
            <div
              key={sub.SubmissionID}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                gap: 'var(--space-4)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                  {sub.FirstName} {sub.LastName}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sub.Email}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                  Submitted {new Date(sub.SubmittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {sub.SubmissionURL && (
                <a
                  href={sub.SubmissionURL}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.75rem', color: 'var(--color-accent-text)', flexShrink: 0 }}
                >
                  View file
                </a>
              )}

              {sub.Grade !== null ? (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: sub.Grade >= 80 ? 'var(--color-success)' : sub.Grade >= 60 ? 'var(--color-warning)' : 'var(--color-error)',
                  }}>
                    {sub.Grade}%
                  </span>
                </div>
              ) : (
                <button
                  className="btn btn-secondary"
                  style={{ flexShrink: 0 }}
                  onClick={() => {
                    setGrading(sub)
                    setGradeError(null)
                    setGradeSuccess(null)
                    setGradeValue("")
                    setShowGradeDialog(true)
                  }}
                >
                  Grade
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grade Dialog */}
      {showGradeDialog && grading && (
        <div className="dialog-overlay" onClick={() => setShowGradeDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Grade Submission</h2>
              <p className="dialog-description">
                Assign a grade (0-100) for <strong>{grading.FirstName} {grading.LastName}</strong> on <strong>{assignment.Title}</strong>.
              </p>
            </div>
            <div className="dialog-body">
              {grading.SubmissionURL && (
                <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
                  Submission file: <a href={grading.SubmissionURL} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent-text)' }}>{grading.SubmissionURL}</a>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Grade (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="form-input"
                  placeholder="e.g. 85"
                  value={gradeValue}
                  onChange={(e) => setGradeValue(e.target.value)}
                />
              </div>
              {gradeError && <p className="form-error mt-2">{gradeError}</p>}
              {gradeSuccess && <p className="form-success mt-2">{gradeSuccess}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowGradeDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGrade} disabled={gradeSaving}>
                {gradeSaving ? "Saving..." : "Submit Grade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Lecturer Assignment Card
function LecturerAssignmentCard({ assignment }: { assignment: RichAssignment }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <span className="badge badge-outline">{assignment.courseCode}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{assignment.courseName}</span>
            </div>
            <h3 className="card-title">{assignment.Title}</h3>
            <p className="card-description">{assignment.Description}</p>
          </div>
          <span className={`badge ${new Date(assignment.DueDate) < new Date() ? 'badge-secondary' : 'badge-outline'}`}>
            {new Date(assignment.DueDate) < new Date() ? "Past due " : "Due "}
            {new Date(assignment.DueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
      <div className="card-content">
        <button className="btn btn-secondary" onClick={() => setExpanded((p) => !p)}>
          {expanded ? "Hide Submissions" : "View Submissions"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: 'var(--space-2)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {expanded && <SubmissionsPanel assignment={assignment} />}
      </div>
    </div>
  )
}

// Student Submit Dialog
function StudentSubmitDialog({ assignment, studentId }: { assignment: RichAssignment; studentId: string }) {
  const [showDialog, setShowDialog] = useState(false)
  const [filePath, setFilePath] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!filePath.trim()) return
    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)
    try {
      await assignmentsApi.submit(assignment.AssignmentID, studentId, filePath)
      setSubmitSuccess("Submitted successfully!")
      setFilePath("")
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setShowDialog(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 'var(--space-2)' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
        Submit Assignment
      </button>

      {showDialog && (
        <div className="dialog-overlay" onClick={() => setShowDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Submit Assignment</h2>
              <p className="dialog-description">Upload your submission for <strong>{assignment.Title}</strong></p>
            </div>
            <div className="dialog-body">
              <div className="form-group">
                <label className="form-label">File Path / URL</label>
                <input
                  className="form-input"
                  placeholder="/uploads/my-assignment.pdf"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                />
              </div>
              {submitError && <p className="form-error mt-2">{submitError}</p>}
              {submitSuccess && <p className="form-success mt-2">{submitSuccess}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Main Component
export function AssignmentsContent() {
  const { user, isStudent, isLecturer } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<RichAssignment[]>([])
  const [average, setAverage] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newAssign, setNewAssign] = useState({ courseId: "", Title: "", Description: "", DueDate: "" })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)

    const courseFetch = isStudent
      ? coursesApi.getByStudent(user.userID)
      : coursesApi.getByLecturer(user.userID)

    courseFetch.then(async (list) => {
      setCourses(list)
      const nested = await Promise.all(
        list.map((c) =>
          assignmentsApi.getByCourse(c.CourseID)
            .then((as) => as.map((a) => ({
              ...a,
              courseCode: c.CourseCode,
              courseName: c.CourseName,
              courseId: c.CourseID,
            })))
            .catch(() => [] as RichAssignment[])
        )
      )
      setAssignments(nested.flat())
    }).finally(() => setLoading(false))
  }, [user, isStudent, isLecturer])

  useEffect(() => {
    if (!user || !isStudent) return
    gradesApi.getStudentAverage(user.userID).then((r) => setAverage(r.OverallAverage)).catch(() => {})
  }, [user, isStudent])

  const now = new Date()
  const upcoming = assignments.filter((a) => new Date(a.DueDate) >= now)
  const past = assignments.filter((a) => new Date(a.DueDate) < now)

  const handleCreate = async () => {
    if (!newAssign.courseId || !newAssign.Title || !newAssign.DueDate) return
    setCreating(true)
    setCreateError(null)
    try {
      await assignmentsApi.create(newAssign.courseId, {
        Title: newAssign.Title,
        Description: newAssign.Description,
        DueDate: newAssign.DueDate,
      })
      const course = courses.find((c) => c.CourseID === newAssign.courseId)
      if (course) {
        const fresh = await assignmentsApi.getByCourse(course.CourseID)
        const enriched: RichAssignment[] = fresh.map((a) => ({
          ...a, courseCode: course.CourseCode, courseName: course.CourseName, courseId: course.CourseID,
        }))
        setAssignments((prev) => [
          ...prev.filter((a) => a.courseId !== course.CourseID),
          ...enriched,
        ])
      }
      setNewAssign({ courseId: "", Title: "", Description: "", DueDate: "" })
      setShowCreateDialog(false)
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Create failed.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {[...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: '128px', borderRadius: 'var(--radius-lg)' }} />)}
      </div>
    )
  }

  const tabs = [
    { id: "upcoming", label: `Upcoming (${upcoming.length})` },
    { id: "past", label: `Past (${past.length})` },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header page-header-with-actions">
        <div>
          <h1>Assignments</h1>
          <p>{isStudent ? "Track and submit your course assignments" : "Manage assignments and grade student submissions"}</p>
        </div>
        {isLecturer && (
          <button className="btn btn-primary" onClick={() => setShowCreateDialog(true)}>
            + Create Assignment
          </button>
        )}
      </div>

      {/* Stats (student only) */}
      {isStudent && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-6)' }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Upcoming</span>
            </div>
            <div className="stat-card-value">{upcoming.length}</div>
            <div className="stat-card-desc">assignments to submit</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Past Due</span>
            </div>
            <div className="stat-card-value">{past.length}</div>
            <div className="stat-card-desc">past deadline</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Overall Average</span>
            </div>
            <div className="stat-card-value">{average !== null ? `${average.toFixed(1)}%` : "-"}</div>
            {average !== null && (
              <div style={{ marginTop: 'var(--space-2)', height: '8px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${average}%`, background: 'var(--color-accent)', borderRadius: 'var(--radius-full)' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--color-bg-tertiary)', padding: 'var(--space-1)', borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === tab.id ? 'var(--color-bg-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lecturer View */}
      {isLecturer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {activeTab === "upcoming" && (
            upcoming.length === 0 ? (
              <div className="empty-state"><p className="empty-state-desc">No upcoming assignments.</p></div>
            ) : (
              upcoming.map((a) => <LecturerAssignmentCard key={a.AssignmentID} assignment={a} />)
            )
          )}
          {activeTab === "past" && (
            past.length === 0 ? (
              <div className="empty-state"><p className="empty-state-desc">No past assignments.</p></div>
            ) : (
              past.map((a) => <LecturerAssignmentCard key={a.AssignmentID} assignment={a} />)
            )
          )}
        </div>
      )}

      {/* Student View */}
      {isStudent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {activeTab === "upcoming" && (
            upcoming.length === 0 ? (
              <div className="empty-state"><p className="empty-state-desc">No upcoming assignments. Great job!</p></div>
            ) : (
              upcoming.map((a) => (
                <div key={a.AssignmentID} className="card">
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                          <span className="badge badge-outline">{a.courseCode}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.courseName}</span>
                        </div>
                        <h3 className="card-title">{a.Title}</h3>
                        <p className="card-description">{a.Description}</p>
                      </div>
                      <span className={`badge ${new Date(a.DueDate) < new Date(Date.now() + 3 * 86400000) ? 'badge-error' : 'badge-secondary'}`}>
                        Due {new Date(a.DueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="card-content">
                    <StudentSubmitDialog assignment={a} studentId={user!.userID} />
                  </div>
                </div>
              ))
            )
          )}
          {activeTab === "past" && (
            past.length === 0 ? (
              <div className="empty-state"><p className="empty-state-desc">No past assignments.</p></div>
            ) : (
              past.map((a) => (
                <div key={a.AssignmentID} className="card">
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                          <span className="badge badge-outline">{a.courseCode}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.courseName}</span>
                        </div>
                        <h3 className="card-title">{a.Title}</h3>
                        <p className="card-description">{a.Description}</p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Was due {new Date(a.DueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}

      {/* Create Assignment Dialog */}
      {showCreateDialog && (
        <div className="dialog-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Create Assignment</h2>
            </div>
            <div className="dialog-body">
              <div className="form-group mb-4">
                <label className="form-label">Course</label>
                <select
                  className="form-input"
                  value={newAssign.courseId}
                  onChange={(e) => setNewAssign((p) => ({ ...p, courseId: e.target.value }))}
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.CourseID} value={c.CourseID}>{c.CourseCode} - {c.CourseName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Title</label>
                <input className="form-input" value={newAssign.Title} onChange={(e) => setNewAssign((p) => ({ ...p, Title: e.target.value }))} />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Description</label>
                <input className="form-input" value={newAssign.Description} onChange={(e) => setNewAssign((p) => ({ ...p, Description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={newAssign.DueDate} onChange={(e) => setNewAssign((p) => ({ ...p, DueDate: e.target.value }))} />
              </div>
              {createError && <p className="form-error mt-4">{createError}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignmentsContent
