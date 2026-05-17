"use client"

import { useEffect, useState, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import useAuth from "@/components/auth/auth-context.tsx"
import { contentApi, membersApi, forumsApi, assignmentsApi, calendarApi } from "@/api.ts"
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
      const { BASE_URL } = await import("@/api")
      const res = await fetch(`${BASE_URL}/courses/retrieve`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load courses")
      const all: Course[] = await res.json()
      const found = all.find((c) => c.CourseID == courseId) ?? null

      if (!found) {
        setLoading(false)
        return
      }
      setCourse(found)

      await Promise.all([
        contentApi.getByCourse(courseId).then(setContent).catch(() => {}),
        membersApi.getByCourseCode(found.CourseCode).then(setMembers).catch(() => {}),
        forumsApi.getByCourseCode(found.CourseCode).then(setForums).catch(() => {}),
        assignmentsApi.getByCourse(courseId).then(setAssignments).catch(() => {}),
        calendarApi.getByCourseCode(found.CourseCode).then(setEvents).catch(() => {}),
      ])
    } catch {
      // Handle error silently
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
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "content" && (
        <div>
          {isLecturer && (
            <button className="btn btn-primary mb-4" onClick={() => setShowContentDialog(true)}>
              + Add Content
            </button>
          )}

          {Object.keys(sections).length === 0 ? (
            <p className="text-muted">No content available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {Object.entries(sections).map(([section, items]) => (
                <div key={section} className="card">
                  <button
                    onClick={() => toggleSection(section)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-4)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: expandedSections.has(section) ? '1px solid var(--color-border-subtle)' : 'none',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{section}</span>
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
                      style={{ 
                        color: 'var(--color-text-muted)',
                        transform: expandedSections.has(section) ? 'rotate(180deg)' : 'none',
                        transition: 'transform var(--transition-fast)',
                      }}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {expandedSections.has(section) && (
                    <div style={{ padding: 'var(--space-4)' }}>
                      {items.map((item) => (
                        <a
                          key={item.ContentID}
                          href={item.ContentURL}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-2)',
                            background: 'var(--color-bg-tertiary)',
                            textDecoration: 'none',
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{item.ContentURL}</span>
                          <span className="badge badge-outline">{item.ContentType}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "assignments" && (
        <div>
          {isLecturer && (
            <button className="btn btn-primary mb-4" onClick={() => setShowAssignDialog(true)}>
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
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <h3 className="card-title">{a.Title}</h3>
                        <p className="card-description">{a.Description}</p>
                      </div>
                      <span className="badge badge-outline">
                        Due {new Date(a.DueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
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
