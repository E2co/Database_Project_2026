"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import useAuth from "@/components/auth/auth-context.tsx"
import { coursesApi, calendarApi } from "@/api.ts"
import type { CalendarEvent, Course } from "@/api.ts"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

const TYPE_COLOR: Record<string, string> = {
  lecture:  "bg-primary",
  deadline: "bg-destructive",
  exam:     "bg-destructive",
  event:    "bg-accent",
  lab:      "bg-accent",
}

function TypeBadge({ type }: { type: string }) {
  const lower = type.toLowerCase()
  if (lower === "lecture") return <Badge>Lecture</Badge>
  if (lower === "deadline" || lower === "exam") return <Badge variant="destructive">{type}</Badge>
  return <Badge variant="secondary">{type}</Badge>
}

export function CalendarContent() {
  const { user, isStudent, isLecturer } = useAuth()

  const [courses,    setCourses]    = useState<Course[]>([])
  const [allEvents,  setAllEvents]  = useState<CalendarEvent[]>([])
  const [loading,    setLoading]    = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Create event form (lecturer / admin)
  const [newEvent, setNewEvent] = useState({
    CourseID: "", EventTitle: "", Description: "", EventType: "lecture", EventDate: "",
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError,   setCreateError]   = useState<string | null>(null)

  // Load courses then fetch events for each
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
  const eventsForDate   = allEvents.filter((ev) => ev.EventDate === selectedDateStr)

  // For students: also fetch by student + date when they pick a date
  const [dateEvents, setDateEvents] = useState<CalendarEvent[] | null>(null)
  useEffect(() => {
    if (!user || !isStudent || !selectedDateStr) return
    calendarApi.getByStudentAndDate(user.userID, selectedDateStr)
      .then(setDateEvents)
      .catch(() => setDateEvents([]))
  }, [user, isStudent, selectedDateStr])

  const displayEvents = isStudent && dateEvents !== null ? dateEvents : eventsForDate

  // Upcoming: next 7 days
  const today  = new Date()
  const week   = new Date(today)
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
      // Refresh events for that course
      const course = courses.find((c) => c.CourseID === newEvent.CourseID)
      if (course) {
        const fresh = await calendarApi.getByCourseCode(course.CourseCode)
        setAllEvents((prev) => [
          ...prev.filter((e) => !fresh.some((f) => f.EventTitle === e.EventTitle && f.EventDate === e.EventDate)),
          ...fresh,
        ])
      }
      setNewEvent({ CourseID: "", EventTitle: "", Description: "", EventType: "lecture", EventDate: "" })
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Failed to create event")
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your academic schedule</p>
        </div>

        {/* Lecturers and admins can create events */}
        {!isStudent && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>+ Add Event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Calendar Event</DialogTitle>
                <DialogDescription>Add an event to a course calendar.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={newEvent.CourseID} onChange={(e) => setNewEvent((p) => ({ ...p, CourseID: e.target.value }))}>
                    <option value="">Select a course</option>
                    {courses.map((c) => (
                      <option key={c.CourseID} value={c.CourseID}>{c.CourseCode} – {c.CourseName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input value={newEvent.EventTitle} onChange={(e) => setNewEvent((p) => ({ ...p, EventTitle: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newEvent.Description} onChange={(e) => setNewEvent((p) => ({ ...p, Description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={newEvent.EventType} onChange={(e) => setNewEvent((p) => ({ ...p, EventType: e.target.value }))}>
                    {["lecture","deadline","exam","lab","event"].map((t) => (
                      <option key={t} value={t} className="capitalize">{t}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newEvent.EventDate} onChange={(e) => setNewEvent((p) => ({ ...p, EventDate: e.target.value }))} />
                </div>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <Button className="w-full" onClick={handleCreateEvent} disabled={createLoading}>
                  {createLoading ? "Creating…" : "Create Event"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar picker */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md w-full"
            />
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Selected date events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </CardTitle>
              <CardDescription>
                {loading ? "Loading…" : `${displayEvents.length} event${displayEvents.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : displayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No events on this date.</p>
              ) : (
                displayEvents.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`h-2 w-2 rounded-full mt-2 ${TYPE_COLOR[ev.EventType.toLowerCase()] ?? "bg-muted-foreground"}`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{ev.EventTitle}</p>
                      <p className="text-xs text-muted-foreground">{ev.Description}</p>
                    </div>
                    <TypeBadge type={ev.EventType} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events.</p>
              ) : (
                upcoming.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="text-center min-w-[40px]">
                      <p className="text-lg font-bold">{new Date(ev.EventDate).getDate()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ev.EventDate).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ev.EventTitle}</p>
                      <p className="text-xs text-muted-foreground capitalize">{ev.EventType}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CalendarContent