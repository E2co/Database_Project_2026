"use client"

import { useEffect, useState, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import useAuth from "@/components/auth/auth-context.tsx"
import {
  contentApi, membersApi, forumsApi, assignmentsApi, calendarApi } from "@/api.ts"
import type { CourseContent, Member, Forum, Assignment, CalendarEvent } from "@/api.ts"

interface Course {
  CourseID: string
  CourseName: string
  CourseCode: string
  LecturerID: string | null
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

// ─── Content type icon ─────────────────────────────────────────────────────────
function TypeIcon({ type }: { type: string }) {
  if (type === "slide")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      </svg>
    )
  if (type === "link")
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-accent">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    )
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

// Helper: get the URL regardless of which field name Flask returns
function getUrl(item: CourseContent): string {
  return item.ContentURL ?? "#"
}

// ─── Main component ────────────────────────────────────────────────────────────
export function CourseDetailContent() {

  const { courseId } = useParams<{ courseId: string }>()

  const { user, isLecturer, isStudent } = useAuth()

  const [course,      setCourse]      = useState<Course | null>(null)
  const [content,     setContent]     = useState<CourseContent[]>([])
  const [members,     setMembers]     = useState<Member[]>([])
  const [forums,      setForums]      = useState<Forum[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [events,      setEvents]      = useState<CalendarEvent[]>([])

  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [activeTab,   setActiveTab]   = useState("content")

  // Add-content form (lecturer only)
  const [newContent, setNewContent] = useState({ SectionTitle: "", ContentType: "link", ContentURL: "" })
  const [contentSaving, setContentSaving] = useState(false)
  const [contentError,  setContentError]  = useState<string | null>(null)

  // Create assignment form (lecturer only)
  const [newAssign,    setNewAssign]    = useState({ Title: "", Description: "", DueDate: "" })
  const [assignSaving, setAssignSaving] = useState(false)
  const [assignError,  setAssignError]  = useState<string | null>(null)

  const loadCourse = useCallback(async () => {
    if(!courseId) return 
    setLoading(true)
    setError(null)

    try {
      const { BASE_URL } = await import("@/api")
      const res = await fetch(`${BASE_URL}/courses/retrieve`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load courses")
      const all: Course[] = await res.json()
      const found = all.find((c) => c.CourseID == courseId) ?? null

      if (!found) {
        setError("Course not found.")
        setLoading(false)
        return
      }
      setCourse(found)

      await Promise.all([
        contentApi.getByCourse(courseId)
          .then(setContent)
          .catch(()=> {}),
        membersApi.getByCourseCode(found.CourseCode)
          .then(setMembers)
          .catch(()=> {}),
        forumsApi.getByCourseCode(found.CourseCode)
          .then(setForums)
          .catch(()=> {}),
        assignmentsApi.getByCourse(courseId)
          .then(setAssignments)
          .catch(()=> {}),
        calendarApi.getByCourseCode(found.CourseCode)
          .then(setEvents)
          .catch(()=> {}),
      ])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load course.")
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
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Failed to create assignment")
    } finally {
      setAssignSaving(false)
    }
  }

  // Group content by section
  const sections = content.reduce<Record<string, CourseContent[]>>((acc, item) => {
    const s = item.SectionTitle || "General"
    acc[s] = [...(acc[s] ?? []), item]
    return acc
  }, {})

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
  if (!course)  return <p className="text-muted-foreground">Course not found.</p>

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/courses" className="hover:text-foreground">Courses</Link>
        <span>/</span>
        <span className="text-foreground">{course.CourseCode}</span>
      </div>

      {/* Course header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge>{course.CourseCode}</Badge>
            <Badge variant="outline">{members.length} members</Badge>
          </div>
          <h1 className="text-3xl font-bold">{course.CourseName}</h1>
          {course.LecturerID && (
            <p className="text-muted-foreground">Lecturer ID: {course.LecturerID}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="forums">Forums</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {/* ── Content ── */}
        <TabsContent value="content" className="mt-6 space-y-4">
          {isLecturer && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">+ Add Content</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Course Content</DialogTitle>
                  <DialogDescription>Upload a link, file, or slide to a section.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Section Title</Label>
                    <Input placeholder="e.g., Week 1 – Introduction" value={newContent.SectionTitle} onChange={(e) => setNewContent((p) => ({ ...p, SectionTitle: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={newContent.ContentType} onChange={(e) => setNewContent((p) => ({ ...p, ContentType: e.target.value }))}>
                      <option value="link">Link</option>
                      <option value="file">File</option>
                      <option value="slide">Slide</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>URL / Path</Label>
                    <Input placeholder="https://…" value={newContent.ContentURL} onChange={(e) => setNewContent((p) => ({ ...p, ContentURL: e.target.value }))} />
                  </div>
                  {contentError && <p className="text-sm text-destructive">{contentError}</p>}
                  <Button className="w-full" onClick={handleAddContent} disabled={contentSaving}>
                    {contentSaving ? "Saving…" : "Add Content"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {Object.keys(sections).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No content available yet.</p>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {Object.entries(sections).map(([section, items], idx) => (
                <AccordionItem key={idx} value={`s-${idx}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-semibold">{section}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pb-2">
                      {items.map((item) => (
                        <a key={item.ContentID} href={item.ContentURL} target="_blank" rel="noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <TypeIcon type={item.ContentType} />
                          <span className="text-sm flex-1">{item.ContentURL}</span>
                          <Badge variant="outline" className="text-xs">{item.ContentType}</Badge>
                        </a>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        {/* ── Assignments ── */}
        <TabsContent value="assignments" className="mt-6 space-y-4">
          {isLecturer && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">+ Create Assignment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Assignment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
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
                  {assignError && <p className="text-sm text-destructive">{assignError}</p>}
                  <Button className="w-full" onClick={handleCreateAssignment} disabled={assignSaving}>
                    {assignSaving ? "Creating…" : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No assignments yet.</p>
          ) : (
            assignments.map((a) => (
              <Card key={a.AssignmentID}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{a.Title}</CardTitle>
                      <CardDescription>{a.Description}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      Due {new Date(a.DueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </Badge>
                  </div>
                </CardHeader>
                {isStudent && (
                  <CardContent>
                    <Button size="sm">Submit Assignment</Button>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Members ── */}
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Members</CardTitle>
              <CardDescription>{members.length} enrolled students</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No members found.</p>
              ) : (
                <div className="space-y-4">
                  {members.map((m, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>{`${m.FirstName[0]}${m.LastName[0]}`}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{m.FirstName} {m.LastName}</p>
                        <p className="text-xs text-muted-foreground">{m.Major}</p>
                      </div>
                      <Badge variant="secondary">Student</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Forums ── */}
        <TabsContent value="forums" className="mt-6 space-y-4">
          {forums.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No forums for this course.</p>
          ) : (
            forums.map((f) => (
              <Card key={f.ForumID} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{f.ForumTitle}</CardTitle>
                      <CardDescription>Forum ID: {f.ForumID}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Calendar ── */}
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Calendar events for {course.CourseCode}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No events for this course.</p>
              ) : (
                events.map((ev, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                    <div className="text-center min-w-[48px]">
                      <p className="text-2xl font-bold">
                        {new Date(ev.EventDate).getDate()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ev.EventDate).toLocaleDateString("en-US", { month: "short" })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{ev.EventTitle}</p>
                      <p className="text-sm text-muted-foreground">{ev.Description}</p>
                    </div>
                    <Badge variant={ev.EventType === "deadline" ? "destructive" : "default"}>
                      {ev.EventType}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CourseDetailContent