"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import useAuth from "@/components/auth/auth-context"
import { coursesApi, assignmentsApi, gradesApi } from "@/api"
import type { Assignment, Course, Submission } from "@/api"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

interface RichAssignment extends Assignment {
  courseCode: string
  courseName: string
  courseId: string
}

// ══════════════════════════════════════════════════════════════════════════════
//  LECTURER — Submissions panel for one assignment
// ══════════════════════════════════════════════════════════════════════════════
function SubmissionsPanel({ assignment }: { assignment: RichAssignment }) {
  const [submissions,  setSubmissions]  = useState<Submission[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  // Grade dialog state
  const [grading,      setGrading]      = useState<Submission | null>(null)
  const [gradeValue,   setGradeValue]   = useState("")
  const [gradeSaving,  setGradeSaving]  = useState(false)
  const [gradeError,   setGradeError]   = useState<string | null>(null)
  const [gradeSuccess, setGradeSuccess] = useState<string | null>(null)

  const loadSubmissions = useCallback(() => {
    setLoading(true)
    assignmentsApi.getSubmissions(assignment.AssignmentID)
      .then(setSubmissions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [assignment.AssignmentID])

  useEffect(() => { loadSubmissions() }, [loadSubmissions])

  const graded   = submissions.filter((s) => s.Grade !== null)
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
      loadSubmissions()           // refresh list so grade appears immediately
    } catch (e: unknown) {
      setGradeError(e instanceof Error ? e.message : "Grading failed.")
    } finally {
      setGradeSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-24 w-full mt-4" />
  if (error)   return <p className="text-sm text-destructive mt-4">{error}</p>

  return (
    <div className="mt-4 space-y-3">
      {/* Summary badges */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{submissions.length} submission{submissions.length !== 1 ? "s" : ""}</Badge>
        <Badge variant="outline" className="text-green-600 border-green-300">{graded.length} graded</Badge>
        {ungraded.length > 0 && (
          <Badge variant="destructive">{ungraded.length} awaiting grade</Badge>
        )}
      </div>

      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No submissions yet.</p>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub) => (
            <div
              key={sub.SubmissionID}
              className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 gap-4"
            >
              {/* Student info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {sub.FirstName} {sub.LastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{sub.Email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted {new Date(sub.SubmittedAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>

              {/* File link */}
              {sub.SubmissionURL && (
                <a
                  href={sub.SubmissionURL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  View file
                </a>
              )}

              {/* Grade or Grade button */}
              {sub.Grade !== null ? (
                <div className="text-right shrink-0">
                  <span className={`text-lg font-bold ${
                    sub.Grade >= 80 ? "text-green-600" :
                    sub.Grade >= 60 ? "text-yellow-600" : "text-destructive"
                  }`}>
                    {sub.Grade}%
                  </span>
                </div>
              ) : (
                <Dialog
                  onOpenChange={(open) => {
                    if (open) { setGrading(sub); setGradeError(null); setGradeSuccess(null); setGradeValue("") }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="shrink-0">
                      Grade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Grade Submission</DialogTitle>
                      <DialogDescription>
                        Assign a grade (0 – 100) for{" "}
                        <strong>{sub.FirstName} {sub.LastName}</strong> on{" "}
                        <strong>{assignment.Title}</strong>.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      {sub.SubmissionURL && (
                        <div className="rounded-md bg-muted px-3 py-2 text-sm">
                          Submission file:{" "}
                          <a href={sub.SubmissionURL} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                            {sub.SubmissionURL}
                          </a>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="grade-input">Grade (%)</Label>
                        <Input
                          id="grade-input"
                          type="number"
                          min={0}
                          max={100}
                          placeholder="e.g. 85"
                          value={gradeValue}
                          onChange={(e) => setGradeValue(e.target.value)}
                        />
                      </div>
                      {gradeError   && <p className="text-sm text-destructive">{gradeError}</p>}
                      {gradeSuccess && <p className="text-sm text-green-600">{gradeSuccess}</p>}
                      <Button className="w-full" onClick={handleGrade} disabled={gradeSaving}>
                        {gradeSaving ? "Saving…" : "Submit Grade"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  LECTURER — Assignment card with expandable submissions
// ══════════════════════════════════════════════════════════════════════════════
function LecturerAssignmentCard({ assignment }: { assignment: RichAssignment }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{assignment.courseCode}</Badge>
              <span className="text-xs text-muted-foreground">{assignment.courseName}</span>
            </div>
            <CardTitle className="text-lg">{assignment.Title}</CardTitle>
            <CardDescription>{assignment.Description}</CardDescription>
          </div>
          <div className="text-right shrink-0">
            <Badge variant={new Date(assignment.DueDate) < new Date() ? "secondary" : "outline"}>
              {new Date(assignment.DueDate) < new Date() ? "Past due " : "Due "}
              {new Date(assignment.DueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded((p) => !p)}
        >
          {expanded ? "Hide Submissions" : "View Submissions"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ml-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>

        {expanded && <SubmissionsPanel assignment={assignment} />}
      </CardContent>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  STUDENT — submit dialog
// ══════════════════════════════════════════════════════════════════════════════
function StudentSubmitDialog({ assignment, studentId }: { assignment: RichAssignment; studentId: string }) {
  const [filePath,     setFilePath]     = useState("")
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState<string | null>(null)
  const [submitSuccess,setSubmitSuccess]= useState<string | null>(null)

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
    <Dialog onOpenChange={() => { setSubmitError(null); setSubmitSuccess(null) }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          Submit Assignment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogDescription>Upload your submission for <strong>{assignment.Title}</strong></DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="file-path">File Path / URL</Label>
            <Input
              id="file-path"
              placeholder="/uploads/my-assignment.pdf"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
          </div>
          {submitError   && <p className="text-sm text-destructive">{submitError}</p>}
          {submitSuccess && <p className="text-sm text-green-600">{submitSuccess}</p>}
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function AssignmentsContent() {
  const { user, isStudent, isLecturer } = useAuth()

  const [courses,     setCourses]     = useState<Course[]>([])
  const [assignments, setAssignments] = useState<RichAssignment[]>([])
  const [average,     setAverage]     = useState<number | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [activeTab,   setActiveTab]   = useState("upcoming")

  // Create assignment dialog (lecturer)
  const [newAssign,   setNewAssign]   = useState({ courseId: "", Title: "", Description: "", DueDate: "" })
  const [creating,    setCreating]    = useState(false)
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
              courseId:   c.CourseID,
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

  const now      = new Date()
  const upcoming = assignments.filter((a) => new Date(a.DueDate) >= now)
  const past     = assignments.filter((a) => new Date(a.DueDate) <  now)

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
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Create failed.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground mt-1">
            {isStudent ? "Track and submit your course assignments" : "Manage assignments and grade student submissions"}
          </p>
        </div>

        {isLecturer && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>+ Create Assignment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={newAssign.courseId}
                    onChange={(e) => setNewAssign((p) => ({ ...p, courseId: e.target.value }))}
                  >
                    <option value="">Select a course</option>
                    {courses.map((c) => (
                      <option key={c.CourseID} value={c.CourseID}>{c.CourseCode} – {c.CourseName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={newAssign.Title} onChange={(e) => setNewAssign((p) => ({ ...p, Title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newAssign.Description} onChange={(e) => setNewAssign((p) => ({ ...p, Description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={newAssign.DueDate} onChange={(e) => setNewAssign((p) => ({ ...p, DueDate: e.target.value }))} />
                </div>
                {createError && <p className="text-sm text-destructive">{createError}</p>}
                <Button className="w-full" onClick={handleCreate} disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats (student only) */}
      {isStudent && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Upcoming</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcoming.length}</div>
              <p className="text-xs text-muted-foreground">assignments to submit</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Past Due</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{past.length}</div>
              <p className="text-xs text-muted-foreground">past deadline</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Overall Average</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{average !== null ? `${average.toFixed(1)}%` : "—"}</div>
              {average !== null && <Progress value={average} className="h-2 mt-2" />}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── LECTURER VIEW ───────────────────────────────────────────────────────── */}
      {isLecturer && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6 space-y-4">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">No upcoming assignments.</p>
            ) : (
              upcoming.map((a) => <LecturerAssignmentCard key={a.AssignmentID} assignment={a} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6 space-y-4">
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">No past assignments.</p>
            ) : (
              past.map((a) => <LecturerAssignmentCard key={a.AssignmentID} assignment={a} />)
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ── STUDENT VIEW ────────────────────────────────────────────────────────── */}
      {isStudent && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6 space-y-4">
            {upcoming.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No upcoming assignments. Great job!</p>
              </div>
            ) : (
              upcoming.map((a) => (
                <Card key={a.AssignmentID}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{a.courseCode}</Badge>
                          <span className="text-xs text-muted-foreground">{a.courseName}</span>
                        </div>
                        <CardTitle className="text-lg">{a.Title}</CardTitle>
                        <CardDescription>{a.Description}</CardDescription>
                      </div>
                      <Badge variant={new Date(a.DueDate) < new Date(Date.now() + 3 * 86400000) ? "destructive" : "secondary"}>
                        Due {new Date(a.DueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <StudentSubmitDialog assignment={a} studentId={user!.userID} />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6 space-y-4">
            {past.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No past assignments.</p>
              </div>
            ) : (
              past.map((a) => (
                <Card key={a.AssignmentID}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{a.courseCode}</Badge>
                          <span className="text-xs text-muted-foreground">{a.courseName}</span>
                        </div>
                        <CardTitle className="text-lg">{a.Title}</CardTitle>
                        <CardDescription>{a.Description}</CardDescription>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        Was due {new Date(a.DueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default AssignmentsContent