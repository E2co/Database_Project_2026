"use client"

import { useEffect, useState } from "react"
import useAuth from "@/components/auth/auth-context.tsx"
import { coursesApi, calendarApi } from "@/api.ts"
import type { CalendarEvent, Course } from "@/api.ts"

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="skeleton" style={style} />
}

export function CalendarContent() {
  const { user, isStudent, isLecturer } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newEvent, setNewEvent] = useState({
    CourseID: "", EventTitle: "", Description: "", EventType: "lecture", EventDate: "",
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)

    const courseFetch = isStudent
      ? coursesApi.getByStudent(user.userID)
      : isLecturer
      ? coursesApi.getByLecturer(user.userID)
      : coursesApi.getAll()

    courseFetch.then((list) => {
      setCourses(list)
      return Promise.all(
        list.map((c) => calendarApi.getByCourseCode(c.CourseCode).catch(() => [] as CalendarEvent[]))
      )
    })
      .then((nested) => setAllEvents(nested.flat()))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, isStudent, isLecturer])

  const selectedDateStr = selectedDate?.toISOString().split("T")[0] ?? ""
  const eventsForDate = allEvents.filter((ev) => ev.EventDate === selectedDateStr)

  const [dateEvents, setDateEvents] = useState<CalendarEvent[] | null>(null)
  useEffect(() => {
    if (!user || !isStudent || !selectedDateStr) return
    calendarApi.getByStudentAndDate(user.userID, selectedDateStr)
      .then(setDateEvents)
      .catch(() => setDateEvents([]))
  }, [user, isStudent, selectedDateStr])

  const displayEvents = isStudent && dateEvents !== null ? dateEvents : eventsForDate

  const today = new Date()
  const week = new Date(today)
  week.setDate(today.getDate() + 7)
  const upcoming = allEvents
    .filter((ev) => {
      const d = new Date(ev.EventDate)
      return d >= today && d <= week
    })
    .sort((a, b) => a.EventDate.localeCompare(b.EventDate))
    .slice(0, 6)

  const handleCreateEvent = async () => {
    if (!newEvent.CourseID || !newEvent.EventTitle || !newEvent.EventDate) return
    setCreateLoading(true)
    setCreateError(null)
    try {
      await calendarApi.create(newEvent)
      const course = courses.find((c) => c.CourseID === newEvent.CourseID)
      if (course) {
        const fresh = await calendarApi.getByCourseCode(course.CourseCode)
        setAllEvents((prev) => [
          ...prev.filter((e) => !fresh.some((f) => f.EventTitle === e.EventTitle && f.EventDate === e.EventDate)),
          ...fresh,
        ])
      }
      setNewEvent({ CourseID: "", EventTitle: "", Description: "", EventType: "lecture", EventDate: "" })
      setShowCreateDialog(false)
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create event")
    } finally {
      setCreateLoading(false)
    }
  }

  // Simple calendar view
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const prevMonth = () => setSelectedDate(new Date(year, month - 1, 1))
  const nextMonth = () => setSelectedDate(new Date(year, month + 1, 1))
  const monthName = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const getTypeColor = (type: string) => {
    const t = type.toLowerCase()
    if (t === "lecture") return "var(--color-accent)"
    if (t === "deadline" || t === "exam") return "var(--color-error)"
    return "var(--color-warning)"
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header page-header-with-actions">
        <div>
          <h1>Calendar</h1>
          <p>View and manage your academic schedule</p>
        </div>
        {!isStudent && (
          <button className="btn btn-primary" onClick={() => setShowCreateDialog(true)}>
            + Add Event
          </button>
        )}
      </div>

      <div className="content-grid">
        {/* Calendar */}
        <div className="content-main">
          <div className="card">
            <div className="card-content">
              {/* Month Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <button className="btn btn-ghost" onClick={prevMonth}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{monthName}</h3>
                <button className="btn btn-ghost" onClick={nextMonth}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6 6"/>
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--space-1)', textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', padding: 'var(--space-2)' }}>{d}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--space-1)' }}>
                {days.map((day, i) => {
                  if (day === null) return <div key={i} />
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const hasEvents = allEvents.some(e => e.EventDate === dateStr)
                  const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month
                  const isToday = new Date().toISOString().split('T')[0] === dateStr

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(new Date(year, month, day))}
                      style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: isSelected ? 'var(--color-accent)' : isToday ? 'var(--color-bg-elevated)' : 'transparent',
                        color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        position: 'relative',
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {day}
                      {hasEvents && (
                        <span style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: isSelected ? 'var(--color-text-primary)' : 'var(--color-accent)',
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="content-sidebar">
          {/* Selected Date Events */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h3>
              <p className="card-description">
                {loading ? "Loading..." : `${displayEvents.length} event${displayEvents.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="card-content">
              {loading ? (
                <Skeleton style={{ height: '80px' }} />
              ) : displayEvents.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.875rem', textAlign: 'center', padding: 'var(--space-4)' }}>
                  No events on this date.
                </p>
              ) : (
                <div className="list">
                  {displayEvents.map((ev, i) => (
                    <div key={i} className="list-item">
                      <div className="list-item-indicator" style={{ background: getTypeColor(ev.EventType) }} />
                      <div className="list-item-content">
                        <div className="list-item-title">{ev.EventTitle}</div>
                        <div className="list-item-subtitle">{ev.Description}</div>
                      </div>
                      <span className={`badge ${ev.EventType.toLowerCase() === 'deadline' ? 'badge-error' : 'badge-primary'}`}>
                        {ev.EventType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Upcoming</h3>
              <p className="card-description">Next 7 days</p>
            </div>
            <div className="card-content">
              {loading ? (
                <Skeleton style={{ height: '96px' }} />
              ) : upcoming.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>No upcoming events.</p>
              ) : (
                <div className="list">
                  {upcoming.map((ev, i) => (
                    <div key={i} className="list-item">
                      <div style={{ textAlign: 'center', minWidth: '40px' }}>
                        <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {new Date(ev.EventDate).getDate()}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(ev.EventDate).toLocaleDateString("en-US", { month: "short" })}
                        </p>
                      </div>
                      <div className="list-item-content">
                        <div className="list-item-title">{ev.EventTitle}</div>
                        <div className="list-item-subtitle">{ev.EventType}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Dialog */}
      {showCreateDialog && (
        <div className="dialog-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2 className="dialog-title">Create Calendar Event</h2>
              <p className="dialog-description">Add an event to a course calendar.</p>
            </div>
            <div className="dialog-body">
              <div className="form-group mb-4">
                <label className="form-label">Course</label>
                <select
                  className="form-input"
                  value={newEvent.CourseID}
                  onChange={(e) => setNewEvent((p) => ({ ...p, CourseID: e.target.value }))}
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.CourseID} value={c.CourseID}>{c.CourseCode} - {c.CourseName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Event Title</label>
                <input
                  className="form-input"
                  value={newEvent.EventTitle}
                  onChange={(e) => setNewEvent((p) => ({ ...p, EventTitle: e.target.value }))}
                />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Description</label>
                <input
                  className="form-input"
                  value={newEvent.Description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, Description: e.target.value }))}
                />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={newEvent.EventType}
                  onChange={(e) => setNewEvent((p) => ({ ...p, EventType: e.target.value }))}
                >
                  {["lecture", "deadline", "exam", "lab", "event"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newEvent.EventDate}
                  onChange={(e) => setNewEvent((p) => ({ ...p, EventDate: e.target.value }))}
                />
              </div>
              {createError && <p className="form-error mt-4">{createError}</p>}
            </div>
            <div className="dialog-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateEvent} disabled={createLoading}>
                {createLoading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarContent
