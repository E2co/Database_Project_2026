"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import useAuth from "@/components/auth/auth-context.tsx"
import { coursesApi, forumsApi, threadsApi } from "@/api.ts"
import type { Course, Forum, Thread } from "@/api.ts"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />
}

interface ForumWithCourse extends Forum {
  courseCode: string
  courseName: string
}

export function ForumsContent() {
  const { user, isStudent, isLecturer } = useAuth()

  const [courses,    setCourses]    = useState<Course[]>([])
  const [forums,     setForums]     = useState<ForumWithCourse[]>([])
  const [loading,    setLoading]    = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("all")

  // Selected forum threads
  const [selectedForum,  setSelectedForum]  = useState<ForumWithCourse | null>(null)
  const [threads,        setThreads]        = useState<Thread[]>([])
  const [threadsLoading, setThreadsLoading] = useState(false)

  // Reply box per top-level thread
  const [replyBoxes, setReplyBoxes] = useState<Record<number, string>>({})
  const [replying,   setReplying]   = useState<Record<number, boolean>>({})

  // New thread dialog
  const [newThread, setNewThread] = useState({ forumId: "", title: "", content: "" })
  const [threadSaving, setThreadSaving] = useState(false)
  const [threadError,  setThreadError]  = useState<string | null>(null)

  // New forum dialog (lecturers)
  const [newForum, setNewForum] = useState({ courseId: "", title: "" })
  const [forumSaving, setForumSaving] = useState(false)
  const [forumError,  setForumError]  = useState<string | null>(null)

  // Load courses → forums
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

  // Load threads when a forum is selected
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

  // Group filtered forums by course
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
      // Refresh threads if this forum is open
      if (selectedForum && String(selectedForum.ForumID) === newThread.forumId) {
        const updated = await threadsApi.getByForum(selectedForum.ForumID)
        setThreads(updated)
      }
      setNewThread((p) => ({ ...p, title: "", content: "" }))
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
      // Refresh forums for that course
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

  // Top-level threads (no parent)
  const topLevel = threads.filter((t) => t.Parent_ThreadID === null)
  const repliesFor = (threadId: number) =>
    threads.filter((t) => t.Parent_ThreadID === threadId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Forums</h1>
          <p className="text-muted-foreground mt-1">Engage in course discussions and get help from peers</p>
        </div>
        <div className="flex gap-2">
          {/* Create thread */}
          <Dialog>
            <DialogTrigger asChild>
              <Button>+ New Thread</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Thread</DialogTitle>
                <DialogDescription>Start a new discussion in one of your course forums.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Forum</Label>
                  <Select value={newThread.forumId} onValueChange={(v) => setNewThread((p) => ({ ...p, forumId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select a forum" /></SelectTrigger>
                    <SelectContent>
                      {forums.map((f) => (
                        <SelectItem key={f.ForumID} value={String(f.ForumID)}>
                          {f.courseCode} – {f.ForumTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thread Title</Label>
                  <Input placeholder="Enter a descriptive title" value={newThread.title} onChange={(e) => setNewThread((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea placeholder="Write your post…" className="min-h-[120px]" value={newThread.content} onChange={(e) => setNewThread((p) => ({ ...p, content: e.target.value }))} />
                </div>
                {threadError && <p className="text-sm text-destructive">{threadError}</p>}
                <Button className="w-full" onClick={handleCreateThread} disabled={threadSaving}>
                  {threadSaving ? "Posting…" : "Create Thread"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lecturer: create forum */}
          {!isStudent && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">+ New Forum</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Forum</DialogTitle>
                  <DialogDescription>Add a discussion forum to one of your courses.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Course</Label>
                    <select className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={newForum.courseId} onChange={(e) => setNewForum((p) => ({ ...p, courseId: e.target.value }))}>
                      <option value="">Select course</option>
                      {courses.map((c) => (
                        <option key={c.CourseID} value={c.CourseID}>{c.CourseCode} – {c.CourseName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Forum Title</Label>
                    <Input value={newForum.title} onChange={(e) => setNewForum((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  {forumError && <p className="text-sm text-destructive">{forumError}</p>}
                  <Button className="w-full" onClick={handleCreateForum} disabled={forumSaving}>
                    {forumSaving ? "Creating…" : "Create Forum"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input placeholder="Search forums…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="sm:max-w-xs" />
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder="Filter by course" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.CourseID} value={c.CourseCode}>{c.CourseCode}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Forum list */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No forums found.</p>
          ) : (
            Object.entries(grouped).map(([key, cForums]) => {
              const [code, name] = key.split("||")
              return (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Badge>{code}</Badge>
                      <CardTitle className="text-lg">{name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {cForums.map((f) => (
                      <div
                        key={f.ForumID}
                        onClick={() => setSelectedForum(f)}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                          selectedForum?.ForumID === f.ForumID ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <div>
                          <p className="font-medium">{f.ForumTitle}</p>
                          <p className="text-sm text-muted-foreground">Forum ID: {f.ForumID}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Thread panel */}
        <div className="space-y-4">
          {selectedForum ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedForum.ForumTitle}</CardTitle>
                <CardDescription>{selectedForum.courseCode}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {threadsLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : topLevel.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No threads yet. Start one!</p>
                ) : (
                  topLevel.map((t) => (
                    <div key={t.ThreadID} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{String(t.Author).slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t.Title ?? "(reply)"}</p>
                          <p className="text-xs text-muted-foreground">{t.Content}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t.CreatedDate}</p>
                        </div>
                      </div>

                      {/* Replies */}
                      {repliesFor(t.ThreadID).map((r) => (
                        <div key={r.ThreadID} className="flex items-start gap-3 ml-8">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{String(r.Author).slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 rounded-md bg-muted px-3 py-2 text-xs">{r.Content}</div>
                        </div>
                      ))}

                      {/* Reply box */}
                      <div className="flex gap-2 ml-8">
                        <Input
                          placeholder="Reply…"
                          className="text-xs h-8"
                          value={replyBoxes[t.ThreadID] ?? ""}
                          onChange={(e) => setReplyBoxes((p) => ({ ...p, [t.ThreadID]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs px-2"
                          disabled={replying[t.ThreadID]}
                          onClick={() => handleReply(t.ThreadID)}
                        >
                          {replying[t.ThreadID] ? "…" : "Reply"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Select a forum to view its threads.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForumsContent