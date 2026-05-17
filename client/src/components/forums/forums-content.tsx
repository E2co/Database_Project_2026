"use client"

import { useEffect, useState } from "react"
import useAuth from "@/components/auth/auth-context.tsx"
import { coursesApi, forumsApi, threadsApi } from "@/api.ts"
import type { Course, Forum, Thread } from "@/api.ts"

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton" style={style} />
}

interface ForumWithCourse extends Forum {
  courseCode: string
  courseName: string
}

export function ForumsContent() {
  const { user, isStudent, isLecturer } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [forums, setForums] = useState<ForumWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")

  const [selectedForum, setSelectedForum] = useState<ForumWithCourse | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [threadsLoading, setThreadsLoading] = useState(false)

  const [replyBoxes, setReplyBoxes] = useState<Record<number, string>>({})
  const [replying, setReplying] = useState<Record<number, boolean>>({})

  const [showThreadDialog, setShowThreadDialog] = useState(false)
  const [newThread, setNewThread] = useState({ forumId: "", title: "", content: "" })
  const [threadSaving, setThreadSaving] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)

  const [showForumDialog, setShowForumDialog] = useState(false)
  const [newForum, setNewForum] = useState({ courseId: "", title: "" })
  const [forumSaving, setForumSaving] = useState(false)
  const [forumError, setForumError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)

    const fetchCourses = isStudent
      ? coursesApi.getByStudent(user.userID)
      : isLecturer
      ? coursesApi.getByLecturer(user.userID)
      : coursesApi.getAll()

    fetchCourses
      .then(async (list) => {
        setCourses(list)
        const nested = await Promise.all(
          list.map((c) =>
            forumsApi.getByCourseCode(c.CourseCode)
              .then((fs) => fs.map((f) => ({ ...f, courseCode: c.CourseCode, courseName: c.CourseName })))
              .catch(() => [] as ForumWithCourse[])
          )
        )
        setForums(nested.flat())
      })
      .finally(() => setLoading(false))
  }, [user, isStudent, isLecturer])

  useEffect(() => {
    if (!selectedForum) return
    setThreadsLoading(true)
    threadsApi.getByForum(selectedForum.ForumID)
      .then(setThreads)
      .catch(() => setThreads([]))
      .finally(() => setThreadsLoading(false))
  }, [selectedForum])

  const filteredForums = forums.filter((f) => {
    const matchSearch =
      f.ForumTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCourse = selectedCourse === "all" || f.courseCode === selectedCourse
    return matchSearch && matchCourse
  })

  const grouped = filteredForums.reduce<Record<string, ForumWithCourse[]>>((acc, f) => {
    const key = `${f.courseCode}||${f.courseName}`
    acc[key] = [...(acc[key] ?? []), f]
    return acc
  }, {})

  const handleCreateThread = async () => {
    if (!newThread.forumId || !newThread.title || !newThread.content) return
    setThreadSaving(true)
    setThreadError(null)
    try {
      await threadsApi.create(newThread.forumId, newThread.title, newThread.content)
      if (selectedForum && String(selectedForum.ForumID) === newThread.forumId) {
        const updated = await threadsApi.getByForum(selectedForum.ForumID)
        setThreads(updated)
      }
      setNewThread((p) => ({ ...p, title: "", content: "" }))
      setShowThreadDialog(false)
    } catch (e: unknown) {
      setThreadError(e instanceof Error ? e.message : "Failed to create thread")
    } finally {
      setThreadSaving(false)
    }
  }

  const handleCreateForum = async () => {
    if (!newForum.courseId || !newForum.title) return
    setForumSaving(true)
    setForumError(null)
    try {
      await forumsApi.create(newForum.courseId, newForum.title)
      const course = courses.find((c) => c.CourseID === newForum.courseId)
      if (course) {
        const fresh = await forumsApi.getByCourseCode(course.CourseCode)
        const enriched: ForumWithCourse[] = fresh.map((f) => ({
          ...f, courseCode: course.CourseCode, courseName: course.CourseName,
        }))
        setForums((prev) => [
          ...prev.filter((f) => f.courseCode !== course.CourseCode),
          ...enriched,
        ])
      }
      setNewForum({ courseId: "", title: "" })
      setShowForumDialog(false)
    } catch (e: unknown) {
      setForumError(e instanceof Error ? e.message : "Failed to create forum")
    } finally {
      setForumSaving(false)
    }
  }

  const handleReply = async (threadId: number) => {
    const content = replyBoxes[threadId]?.trim()
    if (!content) return
    setReplying((p) => ({ ...p, [threadId]: true }))
    try {
      await threadsApi.reply(threadId, content)
      if (selectedForum) {
        const updated = await threadsApi.getByForum(selectedForum.ForumID)
        setThreads(updated)
      }
      setReplyBoxes((p) => ({ ...p, [threadId]: "" }))
    } catch {
      // silent
    } finally {
      setReplying((p) => ({ ...p, [threadId]: false }))
    }
  }

  const topLevel = threads.filter((t) => t.Parent_ThreadID === null)
  const repliesFor = (threadId: number) => threads.filter((t) => t.Parent_ThreadID === threadId)

  return (
    <div>
      {/* Header */}
      <div className="page-header page-header-with-actions">
        <div>
          <h1>Forums</h1>
          <p>Engage in course discussions and get help from peers</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowThreadDialog(true)}>
            + New Thread
          </button>
          {!isStudent && (
            <button className="btn btn-secondary" onClick={() => setShowForumDialog(true)}>
              + New Forum
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="search-input">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search forums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: '180px' }}
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c.CourseID} value={c.CourseCode}>{c.CourseCode}</option>
          ))}
        </select>
      </div>

      <div className="content-grid">
        {/* Forum List */}
        <div className="content-main">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {[...Array(3)].map((_, i) => <Skeleton key={i} style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-desc">No forums found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {Object.entries(grouped).map(([key, cForums]) => {
                const [code, name] = key.split("||")
                return (
                  <div key={key} className="card">
                    <div className="card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span className="badge badge-primary">{code}</span>
                        <h3 className="card-title" style={{ marginBottom: 0 }}>{name}</h3>
                      </div>
                    </div>
                    <div className="card-content">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {cForums.map((f) => (
                          <button
                            key={f.ForumID}
                            onClick={() => setSelectedForum(f)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: 'var(--space-4)',
                              borderRadius: 'var(--radius-md)',
                              border: `1px solid ${selectedForum?.ForumID === f.ForumID ? 'var(--color-accent)' : 'var(--color-border)'}`,
                              background: selectedForum?.ForumID === f.ForumID ? 'var(--color-accent-subtle)' : 'var(--color-bg-tertiary)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <div>
                              <p style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{f.ForumTitle}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Forum ID: {f.ForumID}</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-text-muted)' }}>
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Thread Panel */}
        <div className="content-sidebar">
          {selectedForum ? (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">{selectedForum.ForumTitle}</h3>
                <p className="card-description">{selectedForum.courseCode}</p>
              </div>
              <div className="card-content">
                {threadsLoading ? (
                  <Skeleton style={{ height: '96px' }} />
                ) : topLevel.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', padding: 'var(--space-4)' }}>
                    No threads yet. Start one!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {topLevel.map((t) => (
                      <div key={t.ThreadID} style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-accent-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--color-accent-text)',
                          }}>
                            {String(t.Author).slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{t.Title ?? "(reply)"}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>{t.Content}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-disabled)', marginTop: 'var(--space-1)' }}>{t.CreatedDate}</p>
                          </div>
                        </div>

                        {/* Replies */}
                        {repliesFor(t.ThreadID).map((r) => (
                          <div key={r.ThreadID} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)', marginLeft: 'var(--space-8)', marginTop: 'var(--space-2)' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: 'var(--radius-full)',
                              background: 'var(--color-bg-elevated)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.625rem',
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                            }}>
                              {String(r.Author).slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{
                              flex: 1,
                              padding: 'var(--space-2) var(--space-3)',
                              background: 'var(--color-bg-tertiary)',
                              borderRadius: 'var(--radius-md)',
                              fontSize: '0.75rem',
                              color: 'var(--color-text-secondary)',
                            }}>
                              {r.Content}
                            </div>
                          </div>
                        ))}

                        {/* Reply Box */}
                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'var(--space-8)', marginTop: 'var(--space-2)' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Reply..."
                            style={{ fontSize: '0.75rem', padding: 'var(--space-2)' }}
                            value={replyBoxes[t.ThreadID] ?? ""}
                            onChange={(e) => setReplyBoxes((p) => ({ ...p, [t.ThreadID]: e.target.value }))}
                          />
                          <button
                            className="btn btn-secondary"
                            style={{ padding: 'var(--space-2)', fontSize: '0.75rem' }}
                            disabled={replying[t.ThreadID]}
                            onClick={() => handleReply(t.ThreadID)}
                          >
                            {replying[t.ThreadID] ? "..." : "Reply"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-content" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <p className="text-muted">Select a forum to view its threads.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Thread Dialog */}
      {showThreadDialog && (
        <div className="dialog-overlay" onClick={() => setShowThreadDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Create New Thread</h2>
              <p className="dialog-description">Start a new discussion in one of your course forums.</p>
            </div>
            <div className="dialog-body">
              <div className="form-group mb-4">
                <label className="form-label">Forum</label>
                <select
                  className="form-input"
                  value={newThread.forumId}
                  onChange={(e) => setNewThread((p) => ({ ...p, forumId: e.target.value }))}
                >
                  <option value="">Select a forum</option>
                  {forums.map((f) => (
                    <option key={f.ForumID} value={String(f.ForumID)}>{f.courseCode} - {f.ForumTitle}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Thread Title</label>
                <input
                  className="form-input"
                  placeholder="Enter a descriptive title"
                  value={newThread.title}
                  onChange={(e) => setNewThread((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-input"
                  placeholder="Write your post..."
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={newThread.content}
                  onChange={(e) => setNewThread((p) => ({ ...p, content: e.target.value }))}
                />
              </div>
              {threadError && <p className="form-error mt-4">{threadError}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowThreadDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateThread} disabled={threadSaving}>
                {threadSaving ? "Posting..." : "Create Thread"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Forum Dialog */}
      {showForumDialog && (
        <div className="dialog-overlay" onClick={() => setShowForumDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Create Forum</h2>
              <p className="dialog-description">Add a discussion forum to one of your courses.</p>
            </div>
            <div className="dialog-body">
              <div className="form-group mb-4">
                <label className="form-label">Course</label>
                <select
                  className="form-input"
                  value={newForum.courseId}
                  onChange={(e) => setNewForum((p) => ({ ...p, courseId: e.target.value }))}
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.CourseID} value={c.CourseID}>{c.CourseCode} - {c.CourseName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Forum Title</label>
                <input
                  className="form-input"
                  value={newForum.title}
                  onChange={(e) => setNewForum((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              {forumError && <p className="form-error mt-4">{forumError}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowForumDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateForum} disabled={forumSaving}>
                {forumSaving ? "Creating..." : "Create Forum"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ForumsContent
