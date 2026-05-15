"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import useAuth from "@/components/auth/auth-context"
import { coursesApi } from "@/api"
import type { Course } from "@/api"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

export function CoursesContent() {
  const { user, isStudent, isLecturer, isAdmin } = useAuth()

  const [myCourses,   setMyCourses]   = useState<Course[]>([])
  const [allCourses,  setAllCourses]  = useState<Course[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // ── Enroll dialog (student) ─────────────────────────────────────────────────
  const [enrollCourseId, setEnrollCourseId] = useState("")
  const [enrollLoading,  setEnrollLoading]  = useState(false)
  const [enrollError,    setEnrollError]    = useState<string | null>(null)
  const [enrollSuccess,  setEnrollSuccess]  = useState<string | null>(null)

  // ── Create course dialog (admin) ────────────────────────────────────────────
  const [newCourse,     setNewCourse]     = useState({ CourseName: "", CourseCode: "", LecturerID: "" })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError,   setCreateError]   = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)

  // ── Assign lecturer dialog (admin) ──────────────────────────────────────────
  const [assignCourseId,    setAssignCourseId]    = useState("")
  const [assignLecturerId,  setAssignLecturerId]  = useState("")
  const [assignLoading,     setAssignLoading]     = useState(false)
  const [assignError,       setAssignError]       = useState<string | null>(null)
  const [assignSuccess,     setAssignSuccess]     = useState<string | null>(null)

  // Load courses based on role
  useEffect(() => {
    if (!user) return
    setLoading(true)

    const myFetch = isStudent
      ? coursesApi.getByStudent(user.userID)
      : isLecturer
      ? coursesApi.getByLecturer(user.userID)
      : coursesApi.getAll()   // admin sees everything

    myFetch
      .then(setMyCourses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user, isStudent, isLecturer, isAdmin])

  // Students also fetch all courses so they can browse and enroll
  useEffect(() => {
    if (!isStudent) return
    coursesApi.getAll().then(setAllCourses).catch(() => {})
  }, [isStudent])

  const enrolledIds = new Set(myCourses.map((c) => c.CourseID))

  // The grid shows all courses for students (to allow browsing), own courses otherwise
  const displayCourses = (isStudent ? allCourses : myCourses).filter((c) =>
    c.CourseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.CourseCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Handlers ─────────────────────────────────────────────────────────────────
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
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? "Courses" : "My Courses"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Create and manage all courses"
              : isLecturer
              ? "Courses you are currently teaching"
              : "Browse and manage your course enrollments"}
          </p>
        </div>

        {/* Action buttons — role-specific */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Student: enroll */}
          {isStudent && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>+ Enroll in Course</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll in a Course</DialogTitle>
                  <DialogDescription>Enter the Course ID to enroll.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Course ID</Label>
                    <Input
                      placeholder="e.g., a1b2c3d4"
                      value={enrollCourseId}
                      onChange={(e) => setEnrollCourseId(e.target.value)}
                    />
                  </div>
                  {enrollError   && <p className="text-sm text-destructive">{enrollError}</p>}
                  {enrollSuccess && <p className="text-sm text-green-600">{enrollSuccess}</p>}
                  <Button className="w-full" onClick={handleEnroll} disabled={enrollLoading}>
                    {enrollLoading ? "Enrolling…" : "Enroll"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Admin: Create Course */}
          {isAdmin && (
            <Dialog onOpenChange={() => { setCreateError(null); setCreateSuccess(null) }}>
              <DialogTrigger asChild>
                <Button>+ Create Course</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Course</DialogTitle>
                  <DialogDescription>Fill in the course details below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Course Name</Label>
                    <Input
                      placeholder="e.g., Database Management Systems"
                      value={newCourse.CourseName}
                      onChange={(e) => setNewCourse((p) => ({ ...p, CourseName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Course Code</Label>
                    <Input
                      placeholder="e.g., COMP3161"
                      value={newCourse.CourseCode}
                      onChange={(e) => setNewCourse((p) => ({ ...p, CourseCode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Lecturer ID <span className="text-muted-foreground text-xs">(optional — can assign later)</span>
                    </Label>
                    <Input
                      placeholder="e.g., lec-00001"
                      value={newCourse.LecturerID}
                      onChange={(e) => setNewCourse((p) => ({ ...p, LecturerID: e.target.value }))}
                    />
                  </div>
                  {createError   && <p className="text-sm text-destructive">{createError}</p>}
                  {createSuccess && <p className="text-sm text-green-600">{createSuccess}</p>}
                  <Button className="w-full" onClick={handleCreate} disabled={createLoading}>
                    {createLoading ? "Creating…" : "Create Course"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Admin: Assign Lecturer — separate button next to Create Course */}
          {isAdmin && (
            <Dialog onOpenChange={() => { setAssignError(null); setAssignSuccess(null) }}>
              <DialogTrigger asChild>
                <Button variant="outline">Assign Lecturer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Lecturer to Course</DialogTitle>
                  <DialogDescription>
                    Enter the Course ID and the Lecturer ID to assign. A course can only have one lecturer;
                    this will replace any existing assignment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Course ID</Label>
                    <Input
                      placeholder="e.g., a1b2c3d4"
                      value={assignCourseId}
                      onChange={(e) => setAssignCourseId(e.target.value)}
                    />
                    {/* Quick reference: list courses in a scrollable hint */}
                    {myCourses.length > 0 && (
                      <div className="rounded-md border bg-muted/40 p-2 max-h-32 overflow-y-auto">
                        {myCourses.map((c) => (
                          <button
                            key={c.CourseID}
                            type="button"
                            onClick={() => setAssignCourseId(c.CourseID)}
                            className="block w-full text-left text-xs px-1 py-0.5 hover:bg-muted rounded"
                          >
                            <span className="font-medium">{c.CourseCode}</span>{" "}
                            <span className="text-muted-foreground">— {c.CourseID}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Lecturer ID</Label>
                    <Input
                      placeholder="e.g., lec-00001"
                      value={assignLecturerId}
                      onChange={(e) => setAssignLecturerId(e.target.value)}
                    />
                  </div>
                  {assignError   && <p className="text-sm text-destructive">{assignError}</p>}
                  {assignSuccess && <p className="text-sm text-green-600">{assignSuccess}</p>}
                  <Button className="w-full" onClick={handleAssignLecturer} disabled={assignLoading}>
                    {assignLoading ? "Assigning…" : "Assign Lecturer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <Input
        placeholder="Search courses…"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-sm"
      />

      {/* ── Course grid ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground italic">{error}</p>
      ) : displayCourses.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-8 text-center">No courses found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayCourses.map((course) => {
            const enrolled = enrolledIds.has(course.CourseID)
            return (
              <Link key={course.CourseID} to={`/dashboard/courses/${course.CourseID}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={enrolled ? "default" : "secondary"}>{course.CourseCode}</Badge>
                      {isAdmin && !course.LecturerID && (
                        <Badge variant="destructive" className="text-xs">No Lecturer</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-2">{course.CourseName}</CardTitle>
                    <CardDescription>
                      {course.LecturerName
                        ? `Lecturer: ${course.LecturerName}`
                        : course.LecturerID
                        ? `Lecturer ID: ${course.LecturerID}`
                        : "No lecturer assigned"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">ID: {course.CourseID}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CoursesContent