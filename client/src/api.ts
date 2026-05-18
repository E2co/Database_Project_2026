// ─── Base URL ──────────────────────────────────────────────────────────────────
export const baseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5000"
export const BASE_URL = baseUrl.replace(/\/$/, '')

// ─── In-memory token store ─────────────────────────────────────────────────────
// Cookies with SameSite=None require Secure=True (HTTPS), which breaks on local
// HTTP. Instead we store the JWT returned by /login in memory and send it as an
// Authorization: Bearer header on every request. This works on all browsers
// regardless of protocol or port. The token is lost on page refresh (user must
// log in again), which is acceptable for a dev/local setup. For production,
// switch to httpOnly Secure cookies on an HTTPS domain.
let _token: string | null = null

export function setToken(token: string | null) {
  _token = token
}

export function getToken(): string | null {
  return _token
}

// ─── Generic fetch wrapper ─────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  }

  // Attach the token as a Bearer header if we have one.
  // The Flask token_required decorator checks this header first.
  if (_token) {
    headers["Authorization"] = `Bearer ${_token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include", // still sent so cookies work in production
    headers,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? data?.message ?? `HTTP ${res.status}`)
  return data as T
}

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /login response.
 * NOTE: Flask returns "ID" (the internal auto-increment ID used in the JWT),
 * not "UserID". The JWT encodes ID, so all token_required routes look up by ID.
 */
export interface LoginResponse {
  message: string
  token: string
  ID: string        // internal DB primary key — stored in the JWT as user_id
}

/**
 * GET /me response.
 * Returned after login to hydrate the full user profile including Role.
 * User table columns: ID, UserID, FirstName, LastName, Email, Role, Password, DateCreated
 */
export interface MeResponse {
  ID: string          // internal primary key (used in JWT)
  UserID: string      // application-level UserID (can be different)
  FirstName: string
  LastName: string
  Email: string
  Role: string        // "student" | "lecturer" | "admin"
}

export const authApi = {
  /**
   * POST /register
   * Body: { FirstName, LastName, Email, Role, Password }
   * Returns: { message, ID }  (ID = internal primary key, auto-generated)
   * NOTE: UserID is accepted in the body but auto-generated server-side if omitted.
   */
  register: (payload: {
    FirstName: string
    LastName: string
    Email: string
    Role: string
    Password: string
    UserID?: string   // optional; server generates one if absent
  }) =>
    request<{ message: string; ID: string }>("/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * POST /login
   * Body: { Email, Password }
   * Sets httpOnly jwt_token cookie AND returns { message, token, ID }.
   * Call authApi.me() immediately after to get Role, FirstName, etc.
   */
  login: (email: string, password: string) =>
    request<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify({ Email: email, Password: password }),
    }),

  /**
   * GET /me  🔒
   * Returns the full profile of the currently authenticated user.
   * This is the ONLY way to get the Role after login because /login
   * does not return Role in its response.
   */
  me: () => request<MeResponse>("/me"),

  /**
   * POST /logout
   * Clears the jwt_token cookie server-side.
   */
  logout: () =>
    request<{ message: string }>("/logout", { method: "POST" }),
}

// ══════════════════════════════════════════════════════════════════════════════
//  COURSES
// ══════════════════════════════════════════════════════════════════════════════
export interface Course {
  CourseID: string
  CourseName: string
  CourseCode: string
  LecturerID: string | null
  LecturerName: string | null   // populated by LEFT JOIN Lecturer in all /courses/* routes
}

export const coursesApi = {
  /** GET /courses/retrieve — returns all courses, no auth required */
  getAll: () =>
    request<Course[]>("/courses/retrieve"),

  /**
   * GET /courses/std/<student_id>
   * student_id = the student's UserID string.
   * Flask route type is <int> but the value is passed as-is in the URL.
   */
  getByStudent: (studentId: string) =>
    request<Course[]>(`/courses/std/${studentId}`),

  /**
   * GET /courses/lecturer/<lecturer_id>
   * Returns courses where LecturerID matches.
   */
  getByLecturer: (lecturerId: string) =>
    request<Course[]>(`/courses/lecturer/${lecturerId}`),

  /**
   * POST /courses/create  🔒 admin only
   * Body: { CourseName, CourseCode, LecturerID? }
   */
  create: (payload: { CourseName: string; CourseCode: string; LecturerID?: string }) =>
    request<{ message: string; CourseID: string; CourseName: string; CourseCode: string; LecturerID: string | null }>(
      "/courses/create",
      { method: "POST", body: JSON.stringify(payload) }
    ),

  /**
   * POST /courses/enroll/<course_id>  🔒
   * course_id in the URL; Body: { StudentID }
   */
  enroll: (courseId: string, studentId: string) =>
    request<{ message: string; StudentID: string; CourseID: string }>(
      `/courses/enroll/${courseId}`,
      { method: "POST", body: JSON.stringify({ StudentID: studentId }) }
    ),

  /**
   * PUT /courses/lecturer/<course_id>  🔒 admin only
   * Body: { LecturerID }
   */
  assignLecturer: (courseId: string, lecturerId: string) =>
    request<{ message: string; CourseID: string; LecturerID: string }>(
      `/courses/lecturer/${courseId}`,
      { method: "PUT", body: JSON.stringify({ LecturerID: lecturerId }) }
    ),
}

// ══════════════════════════════════════════════════════════════════════════════
//  COURSE MEMBERS
//  GET /course_members/<course_code>
//  Returns: { FirstName, LastName, Major }[]
// ══════════════════════════════════════════════════════════════════════════════
export interface Member {
  FirstName: string
  LastName: string
  Major: string
}

export const membersApi = {
  /** Takes CourseCode (e.g. "COMP3161"), NOT CourseID */
  getByCourseCode: (courseCode: string) =>
    request<Member[]>(`/course_members/${courseCode}`),
}

// ══════════════════════════════════════════════════════════════════════════════
//  COURSE CONTENT
//  GET  /content/<course_id>
//  POST /courses/content/<course_id>  🔒 lecturer
// ══════════════════════════════════════════════════════════════════════════════
export interface CourseContent {
  ContentID: string
  SectionTitle: string
  ContentType: "link" | "file" | "slide"
  // Flask SELECT aliases the DB column "URL" as "ContentURL" in some versions.
  // Both are optional so the type works regardless of which the server returns.
  ContentURL?: string
  URL?: string
  // Flask returns "UploadedBy" or "LecturerID" depending on the SELECT used.
  UploadedBy?: string
  LecturerID?: string
  // Flask returns "DateUploaded" or "UploadDate" depending on the SELECT used.
  DateUploaded?: string
  UploadDate?: string
}

export const contentApi = {
  getByCourse: (courseId: string) =>
    request<CourseContent[]>(`/dashboard/content/${courseId}`),

  /**
   * POST /courses/content/<course_id>  🔒 lecturer only
   * Body: { SectionTitle, ContentType, ContentURL }
   * ContentType must be "link" | "file" | "slide"
   */
  add: (courseId: string, payload: { SectionTitle: string; ContentType: string; ContentURL: string }) =>
    request<{ message: string; ContentID: string; CourseID: string; SectionTitle: string; ContentType: string }>(
      `/courses/content/${courseId}`,
      { method: "POST", body: JSON.stringify(payload) }
    ),
}

// ══════════════════════════════════════════════════════════════════════════════
//  CALENDAR EVENTS
//  GET  /calendar_events/<course_code>              → events for a course
//  GET  /calendar_events/<student_id>               → all events for a student
//  GET  /calendar_events/<student_id>/<event_date>  → student events on a date
//  POST /calendar_events                            → create an event
// ══════════════════════════════════════════════════════════════════════════════
export interface CalendarEvent {
  EventTitle: string
  Description: string
  EventType: string
  EventDate: string   // "YYYY-MM-DD"
}

export const calendarApi = {
  /** GET /calendar_events/<course_code> — takes CourseCode, not CourseID */
  getByCourseCode: (courseCode: string) =>
    request<CalendarEvent[]>(`/calendar_events/${courseCode}`),

  /** GET /calendar_events/<student_id> — all events across enrolled courses */
  getByStudent: (studentId: string) =>
    request<CalendarEvent[]>(`/calendar_events/${studentId}`),

  /**
   * GET /calendar_events/<student_id>/<event_date>
   * event_date: "YYYY-MM-DD"
   */
  getByStudentAndDate: (studentId: string, eventDate: string) =>
    request<CalendarEvent[]>(`/calendar_events/${studentId}/${eventDate}`),

  /**
   * POST /calendar_events
   * Body: { CourseID, EventTitle, Description, EventType, EventDate }
   * All fields required.
   */
  create: (payload: {
    CourseID: string
    EventTitle: string
    Description: string
    EventType: string
    EventDate: string
  }) =>
    request<{ message: string }>("/calendar_events", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}

// ══════════════════════════════════════════════════════════════════════════════
//  FORUMS
//  GET  /forums/<course_code>  → forums for a course (by CourseCode)
//  POST /forums                → create a forum
// ══════════════════════════════════════════════════════════════════════════════
export interface Forum {
  ForumID: number
  ForumTitle: string
  CourseID: string
}

export const forumsApi = {
  /** Takes CourseCode (e.g. "COMP3161"), NOT CourseID */
  getByCourseCode: (courseCode: string) =>
    request<Forum[]>(`/forums/${courseCode}`),

  /**
   * POST /forums
   * Body: { CourseID, ForumTitle }
   * CourseID here is the actual UUID CourseID, not the code.
   */
  create: (courseId: string, forumTitle: string) =>
    request<{ message: string }>("/forums", {
      method: "POST",
      body: JSON.stringify({ CourseID: courseId, ForumTitle: forumTitle }),
    }),
}

// ══════════════════════════════════════════════════════════════════════════════
//  DISCUSSION THREADS
//  GET  /forums/<forum_id>/threads        → threads in a forum
//  POST /forums/<forum_id>/threads  🔒   → create top-level thread
//  POST /threads/<thread_id>/replies  🔒 → reply to a thread
// ══════════════════════════════════════════════════════════════════════════════
export interface Thread {
  ThreadID: number
  ForumID: number
  Title: string | null          // null for replies
  Content: string
  CreatedDate: string
  Author: string                // UserID pulled from JWT server-side
  Parent_ThreadID: number | null
}

export const threadsApi = {
  /** GET /forums/<forum_id>/threads */
  getByForum: (forumId: number | string) =>
    request<Thread[]>(`/forums/${forumId}/threads`),

  /**
   * POST /forums/<forum_id>/threads  🔒
   * Body: { Title, Content }
   * Author is read from the JWT token server-side — do NOT send UserID.
   */
  create: (forumId: number | string, title: string, content: string) =>
    request<{ message: string; ThreadID: number }>(`/forums/${forumId}/threads`, {
      method: "POST",
      body: JSON.stringify({ Title: title, Content: content }),
    }),

  /**
   * POST /threads/<thread_id>/replies  🔒
   * Body: { Content }
   * Author and Parent_ThreadID are set server-side from JWT and URL.
   */
  reply: (threadId: number | string, content: string) =>
    request<{ message: string; ReplyID: number }>(`/threads/${threadId}/replies`, {
      method: "POST",
      body: JSON.stringify({ Content: content }),
    }),
}

// ══════════════════════════════════════════════════════════════════════════════
//  ASSIGNMENTS
//  GET  /courses/assignments/<course_id>                → assignments for a course
//  POST /courses/assignments/<course_id>  🔒 lect       → create an assignment
//  POST /assignments/submit/<assignment_id>  🔒 std      → submit
//  POST /assignments/grade/<assignment_id>  🔒 lect      → grade a submission
//  GET  /assignments/submissions/<assignment_id>  🔒 lect → all submissions + grades
// ══════════════════════════════════════════════════════════════════════════════
export interface Assignment {
  AssignmentID: string
  Title: string
  Description: string
  DueDate: string
}

/** Returned by GET /assignments/submissions/<assignment_id> */
export interface Submission {
  SubmissionID: string
  StudentID: string
  FirstName: string
  LastName: string
  Email: string
  SubmissionURL: string   // DB column is SubmissionURL, not FilePath
  SubmittedAt: string
  Grade: number | null    // null = not yet graded
  GradeID: string | null
}

export const assignmentsApi = {
  getByCourse: (courseId: string) =>
    request<Assignment[]>(`/courses/assignments/${courseId}`),

  /**
   * GET /assignments/submissions/<assignment_id>  🔒 lecturer only
   * Returns every submission for the assignment, with grade if graded.
   */
  getSubmissions: (assignmentId: string) =>
    request<Submission[]>(`/assignments/submissions/${assignmentId}`),

  /**
   * POST /courses/assignments/<course_id>  🔒 lecturer only
   * Body: { Title, Description, DueDate }
   */
  create: (courseId: string, payload: { Title: string; Description: string; DueDate: string }) =>
    request<{ message: string; AssignmentID: string; CourseID: string; Title: string; DueDate: string }>(
      `/courses/assignments/${courseId}`,
      { method: "POST", body: JSON.stringify(payload) }
    ),

  /**
   * POST /assignments/submit/<assignment_id>  🔒 student only
   * Body: { StudentID, SubmissionURL }
   */
  submit: (assignmentId: string, studentId: string, filePath: string) =>
    request<{ message: string; SubmissionID: string; AssignmentID: string; StudentID: string }>(
      `/assignments/submit/${assignmentId}`,
      { method: "POST", body: JSON.stringify({ StudentID: studentId, SubmissionURL: filePath }) }
    ),

  /**
   * POST /assignments/grade/<assignment_id>  🔒 lecturer only
   * Body: { StudentID, Grade }  — Grade is 0–100
   */
  grade: (assignmentId: string, studentId: string, grade: number) =>
    request<{ message: string; GradeID: string; SubmissionID: string; StudentID: string; Grade: number }>(
      `/assignments/grade/${assignmentId}`,
      { method: "POST", body: JSON.stringify({ StudentID: studentId, Grade: grade }) }
    ),
}

// ══════════════════════════════════════════════════════════════════════════════
//  GRADES
//  GET /students/average/<student_id>
// ══════════════════════════════════════════════════════════════════════════════
export const gradesApi = {
  getStudentAverage: (studentId: string) =>
    request<{ StudentID: string; OverallAverage: number }>(
      `/students/average/${studentId}`
    ),
}

// ══════════════════════════════════════════════════════════════════════════════
//  REPORTS
//  GET /reports/fifty_or_more     → { CourseName, CourseCode }[]
//  GET /reports/five_or_more      → { FirstName, LastName, Major }[]
//  GET /reports/three_or_more     → { Name, Department }[]
//  GET /reports/top_ten_enrolled  → { CourseName, CourseCode }[]
// ══════════════════════════════════════════════════════════════════════════════
export interface ReportCourse   { CourseName: string; CourseCode: string; StudentCount?: number; }
export interface ReportStudent  { FirstName: string; LastName: string; Major: string; CourseCount?: number; AverageGrade?: number }
export interface ReportLecturer { Name: string; Department: string; CourseCount?: number }

export const reportsApi = {
  coursesWithFiftyPlus:   () => request<ReportCourse[]>("/reports/fifty_or_more"),
  studentsWithFivePlus:   () => request<ReportStudent[]>("/reports/five_or_more"),
  lecturersWithThreePlus: () => request<ReportLecturer[]>("/reports/three_or_more"),
  topTenEnrolled:         () => request<ReportCourse[]>("/reports/top_ten_enrolled"),
  topTenGrades:           () => request<ReportStudent[]>("/reports/top_ten_students"),
}