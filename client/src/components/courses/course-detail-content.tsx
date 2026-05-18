"use client"

import { useEffect, useState, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import useAuth from "@/components/auth/auth-context.tsx"
import { coursesApi, contentApi, membersApi, forumsApi, assignmentsApi, calendarApi } from "@/api.ts"
import type { CourseContent, Member, Forum, Assignment, CalendarEvent } from "@/api.ts"

interface Course {
  CourseID: string
  CourseName: string
  CourseCode: string
  LecturerID: string | null
}

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton" style={style} />
}

export function CourseDetailContent() {
  const { courseId } = useParams<{ courseId: string }>()
  const { isLecturer, isStudent } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [content, setContent] = useState<CourseContent[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [forums, setForums] = useState<Forum[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("content")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const [showContentDialog, setShowContentDialog] = useState(false)
  const [newContent, setNewContent] = useState({ SectionTitle: "", ContentType: "link", ContentURL: "" })
  const [contentSaving, setContentSaving] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)

  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [newAssign, setNewAssign] = useState({ Title: "", Description: "", DueDate: "" })
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const loadCourse = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    try {
      console.log("Loading course details for courseId:", courseId)
      
      // Load all courses to find the one we need (and get CourseCode)
      const allCourses = await coursesApi.getAll()
      const found = allCourses.find((c) => c.CourseID === courseId) ?? null

      if (!found) {
        console.log("Course not found:", courseId)
        setLoading(false)
        return
      }

      console.log("Found course:", found)
      setCourse(found)

      // Load all related data in parallel
      // Each API call uses the request() wrapper which handles authentication
      const results = await Promise.allSettled([
        contentApi.getByCourse(courseId),
        membersApi.getByCourseCode(found.CourseCode),
        forumsApi.getByCourseCode(found.CourseCode),
        assignmentsApi.getByCourse(courseId),
        calendarApi.getByCourseCode(found.CourseCode),
      ])

      // Handle results and log what we got
      results.forEach((result, index) => {
        const names = ["content", "members", "forums", "assignments", "events"]
        if (result.status === "fulfilled") {
          console.log(`${names[index]} loaded:`, result.value?.length || 0, "items")
        } else {
          console.error(`${names[index]} failed:`, result.reason)
        }
      })

      // Set state from results
      if (results[0].status === "fulfilled") setContent(results[0].value || [])
      if (results[1].status === "fulfilled") setMembers(results[1].value || [])
      if (results[2].status === "fulfilled") setForums(results[2].value || [])
      if (results[3].status === "fulfilled") setAssignments(results[3].value || [])
      if (results[4].status === "fulfilled") setEvents(results[4].value || [])

      console.log("All course data loaded successfully")
    } catch (error) {
      console.error("Failed to load course details:", error)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { loadCourse() }, [loadCourse])

  const handleAddContent = async () => {
    if (!courseId || !newContent.SectionTitle || !newContent.ContentURL) return
    setContentSaving(true)
    setContentError(null)
    try {
      await contentApi.add(courseId, newContent)
      const updated = await contentApi.getByCourse(courseId)
      setContent(updated)
      setNewContent({ SectionTitle: "", ContentType: "link", ContentURL: "" })
      setShowContentDialog(false)
    } catch (e: unknown) {
      setContentError(e instanceof Error ? e.message : "Failed to add content")
    } finally {
      setContentSaving(false)
    }
  }

  const handleCreateAssignment = async () => {
    if (!courseId || !newAssign.Title || !newAssign.DueDate) return
    setAssignSaving(true)
    setAssignError(null)
    try {
      await assignmentsApi.create(courseId, newAssign)
      const updated = await assignmentsApi.getByCourse(courseId)
      setAssignments(updated)
      setNewAssign({ Title: "", Description: "", DueDate: "" })
      setShowAssignDialog(false)
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Failed to create assignment")
    } finally {
      setAssignSaving(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const sections = content.reduce<Record<string, CourseContent[]>>((acc, item) => {
    const s = item.SectionTitle || "General"
    acc[s] = [...(acc[s] ?? []), item]
    return acc
  }, {})

  const tabs = [
    { id: "content", label: "Content" },
    { id: "assignments", label: "Assignments" },
    { id: "members", label: "Members" },
    { id: "forums", label: "Forums" },
    { id: "calendar", label: "Calendar" },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {[...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: '96px', borderRadius: 'var(--radius-lg)' }} />)}
      </div>
    )
  }

  if (!course) return <p className="text-muted">Course not found.</p>

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
        <Link to="/dashboard/courses" style={{ color: 'var(--color-accent-text)' }}>Courses</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text-primary)' }}>{course.CourseCode}</span>
      </div>

      {/* Course Header */}
      <div className="page-header">
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <span className="badge badge-primary">{course.CourseCode}</span>
          <span className="badge badge-outline">{members.length} members</span>
        </div>
        <h1>{course.CourseName}</h1>
        {course.LecturerID && <p>Lecturer ID: {course.LecturerID}</p>}
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-1)', 
          background: 'var(--color-bg-tertiary)', 
          padding: 'var(--space-1)', 
          borderRadius: 'var(--radius-lg)',
          overflowX: 'auto'
        }}>
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
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Tab */}
      {activeTab === "content" && (
        <div>
          {isLecturer && (
            <button className="btn btn-primary" onClick={() => setShowContentDialog(true)} style={{ marginBottom: 'var(--space-4)' }}>
              + Add Content
            </button>
          )}

          {content.length === 0 ? (
            <p className="text-muted">No content available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {Object.entries(sections).map(([section, items]) => (
                <div key={section} className="card">
                  <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => toggleSection(section)}>
                    <h3 className="card-title">{section}</h3>
                    <p className="card-description">{items.length} items</p>
                  </div>
                  {expandedSections.has(section) && (
                    <div className="card-content">
                      {items.map((item) => (
                        <div key={item.ContentID} style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>{item.SectionTitle}</h4>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <span className="badge badge-secondary">{item.ContentType}</span>
                            <a href={item.ContentURL || item.URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-text)' }}>
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div>
          {isLecturer && (
            <button className="btn btn-primary" onClick={() => setShowAssignDialog(true)} style={{ marginBottom: 'var(--space-4)' }}>
              + Create Assignment
            </button>
          )}

          {assignments.length === 0 ? (
            <p className="text-muted">No assignments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {assignments.map((a) => (
                <div key={a.AssignmentID} className="card">
                  <div className="card-header">
                    <div>
                      <h3 className="card-title">{a.Title}</h3>
                      <p className="card-description">{a.Description}</p>
                    </div>
                    <span className="badge badge-outline">
                      Due {new Date(a.DueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  {isStudent && (
                    <div className="card-content">
                      <button className="btn btn-primary">Submit Assignment</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Course Members</h3>
            <p className="card-description">{members.length} enrolled students</p>
          </div>
          <div className="card-content">
            {members.length === 0 ? (
              <p className="text-muted">No members found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-accent-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--color-accent-text)',
                    }}>
                      {m.FirstName[0]}{m.LastName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{m.FirstName} {m.LastName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{m.Major}</p>
                    </div>
                    <span className="badge badge-secondary">Student</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forums Tab */}
      {activeTab === "forums" && (
        <div>
          {forums.length === 0 ? (
            <p className="text-muted">No forums for this course.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {forums.map((f) => (
                <div key={f.ForumID} className="card card-clickable">
                  <div className="card-content">
                    <h3 style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{f.ForumTitle}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Forum ID: {f.ForumID}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Events</h3>
            <p className="card-description">Calendar events for {course.CourseCode}</p>
          </div>
          <div className="card-content">
            {events.length === 0 ? (
              <p className="text-muted">No events for this course.</p>
            ) : (
              <div className="list">
                {events.map((ev, i) => (
                  <div key={i} className="list-item" style={{ padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ textAlign: 'center', minWidth: '48px' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{new Date(ev.EventDate).getDate()}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{new Date(ev.EventDate).toLocaleDateString("en-US", { month: "short" })}</p>
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">{ev.EventTitle}</div>
                      <div className="list-item-subtitle">{ev.Description}</div>
                    </div>
                    <span className={`badge ${ev.EventType === "deadline" ? "badge-error" : "badge-primary"}`}>{ev.EventType}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Content Dialog */}
      {showContentDialog && (
        <div className="dialog-overlay" onClick={() => setShowContentDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Add Course Content</h2>
              <p className="dialog-description">Upload a link, file, or slide to a section.</p>
            </div>
            <div className="dialog-body">
              <div className="form-group mb-4">
                <label className="form-label">Section Title</label>
                <input className="form-input" placeholder="e.g., Week 1 - Introduction" value={newContent.SectionTitle} onChange={(e) => setNewContent((p) => ({ ...p, SectionTitle: e.target.value }))} />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Content Type</label>
                <select className="form-input" value={newContent.ContentType} onChange={(e) => setNewContent((p) => ({ ...p, ContentType: e.target.value }))}>
                  <option value="link">Link</option>
                  <option value="file">File</option>
                  <option value="slide">Slide</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">URL / Path</label>
                <input className="form-input" placeholder="https://..." value={newContent.ContentURL} onChange={(e) => setNewContent((p) => ({ ...p, ContentURL: e.target.value }))} />
              </div>
              {contentError && <p className="form-error mt-4">{contentError}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowContentDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddContent} disabled={contentSaving}>
                {contentSaving ? "Saving..." : "Add Content"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Dialog */}
      {showAssignDialog && (
        <div className="dialog-overlay" onClick={() => setShowAssignDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Create Assignment</h2>
            </div>
            <div className="dialog-body">
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
              {assignError && <p className="form-error mt-4">{assignError}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssignDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateAssignment} disabled={assignSaving}>
                {assignSaving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseDetailContent
