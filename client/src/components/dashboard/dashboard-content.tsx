"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import useAuth from "@/components/auth/auth-context"
import { coursesApi, assignmentsApi, calendarApi, gradesApi } from "@/api"
import type { Course, Assignment, CalendarEvent } from "@/api"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

function ErrorNote({ msg }: { msg: string }) {
  return <p className="text-sm text-muted-foreground italic py-2">{msg}</p>
}

export function DashboardContent() {
  const { user, isStudent, isLecturer, isAdmin } = useAuth()

  const [courses,        setCourses]        = useState<Course[]>([])
  const [assignments,    setAssignments]    = useState<Assignment[]>([])
  const [events,         setEvents]         = useState<CalendarEvent[]>([])
  const [average,        setAverage]        = useState<number | null>(null)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingAssign,  setLoadingAssign]  = useState(true)
  const [loadingEvents,  setLoadingEvents]  = useState(true)
  const [courseError,    setCourseError]    = useState<string | null>(null)

  const firstName = user?.firstName || user?.email?.split("@")[0] || "there"

  // 1. Load courses (skipped for admin on dashboard — they see stats only)
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

  // 2. Assignments per enrolled course (student only)
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

  // 3. Today's calendar events (student only)
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

  // 4. Grade average (student only)
  useEffect(() => {
    if (!user || !isStudent) return
    gradesApi.getStudentAverage(user.userID).then((r) => setAverage(r.OverallAverage)).catch(() => {})
  }, [user, isStudent])

  const pendingAssignments = assignments.filter((a) => new Date(a.DueDate) >= new Date())

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  // ─── Admin dashboard ──────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {firstName}</h1>
          <p className="text-muted-foreground mt-1">System administration overview.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Manage Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Create courses and assign lecturers.</p>
              <Link to="/dashboard/courses">
                <span className="text-sm text-primary hover:underline">Go to Courses →</span>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">View system-wide analytics.</p>
              <Link to="/dashboard/reports">
                <span className="text-sm text-primary hover:underline">Go to Reports →</span>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/dashboard/courses" className="block text-sm text-primary hover:underline">
                + Create a new course
              </Link>
              <Link to="/dashboard/courses" className="block text-sm text-primary hover:underline">
                + Assign a lecturer
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Student / Lecturer dashboard ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {firstName}</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your courses today.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {isStudent ? "Enrolled Courses" : "Courses Teaching"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCourses ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{courses.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Active this semester</p>
          </CardContent>
        </Card>

        {isStudent && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingAssign ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{pendingAssignments.length}</div>
              )}
              <p className="text-xs text-muted-foreground">Due upcoming</p>
            </CardContent>
          </Card>
        )}

        {isStudent && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Average</CardTitle>
            </CardHeader>
            <CardContent>
              {average === null ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{average.toFixed(1)}%</div>
              )}
              <p className="text-xs text-muted-foreground">Across all graded work</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEvents ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{events.length}</div>
            )}
            <p className="text-xs text-muted-foreground">{todayLabel.split(",")[0]}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Courses (student/lecturer only) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Courses</h2>
            <Link to="/dashboard/courses" className="text-sm text-primary hover:underline">View all</Link>
          </div>

          {loadingCourses ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
            </div>
          ) : courseError ? (
            <ErrorNote msg={courseError} />
          ) : courses.length === 0 ? (
            <ErrorNote msg="No courses found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.slice(0, 4).map((course) => (
                <Link key={course.CourseID} to={`/dashboard/courses/${course.CourseID}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <Badge variant="secondary">{course.CourseCode}</Badge>
                      <CardTitle className="text-lg mt-2">{course.CourseName}</CardTitle>
                      {course.LecturerID && (
                        <CardDescription>Lecturer: {course.LecturerID}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">ID: {course.CourseID}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar panel */}
        <div className="space-y-6">
          {/* Today's schedule (students) */}
          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
                <CardDescription>{todayLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingEvents ? (
                  <Skeleton className="h-20 w-full" />
                ) : events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events today.</p>
                ) : (
                  events.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 ${
                        ev.EventType === "lecture" ? "bg-primary" :
                        ev.EventType === "deadline" ? "bg-destructive" : "bg-accent"
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ev.EventTitle}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ev.EventType}</p>
                      </div>
                    </div>
                  ))
                )}
                <Link to="/dashboard/calendar" className="block text-sm text-primary hover:underline text-center pt-2">
                  View full calendar
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Upcoming assignments (students) */}
          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingAssign ? (
                  <Skeleton className="h-24 w-full" />
                ) : pendingAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending assignments.</p>
                ) : (
                  pendingAssignments.slice(0, 4).map((a) => (
                    <div key={a.AssignmentID} className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium leading-tight">{a.Title}</p>
                        <p className="text-xs text-muted-foreground">{a.Description}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {new Date(a.DueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Badge>
                    </div>
                  ))
                )}
                <Link to="/dashboard/assignments" className="block text-sm text-primary hover:underline text-center pt-2">
                  View all assignments
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Lecturer: quick link to assignments page */}
          {isLecturer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/dashboard/assignments" className="block text-sm text-primary hover:underline">
                  View assignments &amp; submissions
                </Link>
                <Link to="/dashboard/forums" className="block text-sm text-primary hover:underline">
                  Course forums
                </Link>
                <Link to="/dashboard/reports" className="block text-sm text-primary hover:underline">
                  Reports
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardContent