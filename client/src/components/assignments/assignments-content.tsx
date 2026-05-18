"use client"

import { useState, useEffect } from "react"
import useAuth from "@/components/auth/auth-context"
import { assignmentsApi, coursesApi } from "@/api"
import type { Assignment, Submission, Course } from "@/api"

export function AssignmentsContent() {
  const { user, isStudent, isLecturer } = useAuth()
  
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Grading state (lecturer only)
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null)
  const [gradeValue, setGradeValue] = useState("")
  const [gradeLoading, setGradeLoading] = useState(false)
  const [gradeError, setGradeError] = useState<string | null>(null)

  // Submission state (student only)
  const [submissionUrl, setSubmissionUrl] = useState("")
  const [submissionLoading, setSubmissionLoading] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null)

  // Load courses on mount
  useEffect(() => {
    loadCourses()
  }, [user])

  const loadCourses = async () => {
    if (!user) return
    try {
      setLoading(true)
      let courseData: Course[] = []
      
      if (isStudent) {
        courseData = await coursesApi.getByStudent(user.userID)
      } else if (isLecturer) {
        courseData = await coursesApi.getByLecturer(user.userID)
      }
      
      setCourses(courseData || [])
      if (courseData && courseData.length > 0) {
        setSelectedCourseId(courseData[0].CourseID)
      }
    } catch (err) {
      setError("Failed to load courses")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Load assignments for selected course
  useEffect(() => {
    if (selectedCourseId) {
      loadAssignments(selectedCourseId)
    }
  }, [selectedCourseId])

  const loadAssignments = async (courseId: string) => {
    try {
      const data = await assignmentsApi.getByCourse(courseId)
      setAssignments(data || [])
      if (data && data.length > 0) {
        setSelectedAssignmentId(data[0].AssignmentID)
      } else {
        setSelectedAssignmentId(null)
        setSubmissions([])
      }
    } catch (err) {
      console.error("Failed to load assignments:", err)
      setAssignments([])
      setSelectedAssignmentId(null)
    }
  }

  // Load submissions for selected assignment (lecturer only)
  useEffect(() => {
    if (selectedAssignmentId && isLecturer) {
      loadSubmissions(selectedAssignmentId)
    } else if (selectedAssignmentId && isStudent) {
      loadSubmissions(selectedAssignmentId)
    }
  }, [selectedAssignmentId])

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const data = await assignmentsApi.getSubmissions(assignmentId)
      setSubmissions(data || [])
    } catch (err) {
      console.error("Failed to load submissions:", err)
      setSubmissions([])
    }
  }

  // Handle lecturer grading
  const handleGradeSubmit = async (submission: Submission) => {
    if (!gradeValue.trim() || !selectedAssignmentId) return

    setGradeLoading(true)
    setGradeError(null)
    try {
      const gradeNum = parseFloat(gradeValue)
      if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
        setGradeError("Grade must be a number between 0 and 100")
        setGradeLoading(false)
        return
      }

      await assignmentsApi.grade(selectedAssignmentId, submission.StudentID, gradeNum)
      
      setGradeValue("")
      setGradingSubmissionId(null)
      setGradeError(null)
      
      // Reload submissions
      loadSubmissions(selectedAssignmentId)
    } catch (err) {
      setGradeError("Failed to submit grade: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setGradeLoading(false)
    }
  }

  // Handle student submission
  const handleSubmitAssignment = async (assignmentId: string) => {
    if (!submissionUrl.trim() || !user) {
      setSubmissionError("Please enter a submission URL")
      return
    }

    setSubmissionLoading(true)
    setSubmissionError(null)
    try {
      await assignmentsApi.submit(assignmentId, user.userID, submissionUrl.trim())
      
      setSubmissionUrl("")
      setSubmittingAssignmentId(null)
      
      // Reload submissions
      loadSubmissions(assignmentId)
    } catch (err) {
      setSubmissionError("Failed to submit: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setSubmissionLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading assignments...</div>
  }

  if (courses.length === 0) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Assignments</h1>
        <div className="card" style={{ marginTop: "1rem" }}>
          <p className="text-muted">
            {isStudent ? "You are not enrolled in any courses." : "You have no courses assigned."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1>Assignments</h1>
        <p className="text-muted">
          {isStudent ? "Track and submit your assignments" : "Grade student submissions"}
        </p>
      </div>

      {error && (
        <div className="card" style={{ background: "var(--destructive)", color: "var(--destructive-foreground)", marginBottom: "1rem", padding: "1rem" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "2rem" }}>
        {/* Left Sidebar: Courses & Assignments */}
        <div>
          {/* Courses */}
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              Courses
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {courses.map((course) => (
                <button
                  key={course.CourseID}
                  onClick={() => setSelectedCourseId(course.CourseID)}
                  style={{
                    padding: "0.75rem 1rem",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    background: selectedCourseId === course.CourseID ? "var(--primary)" : "transparent",
                    color: selectedCourseId === course.CourseID ? "var(--primary-foreground)" : "var(--foreground)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontSize: "0.875rem"
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{course.CourseCode}</div>
                  <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.7 }}>
                    {course.CourseName}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Assignments for selected course */}
          {selectedCourseId && assignments.length > 0 && (
            <div>
              <h3 style={{ marginBottom: "1rem", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", color: "var(--muted-foreground)" }}>
                Assignments
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {assignments.map((assignment) => (
                  <button
                    key={assignment.AssignmentID}
                    onClick={() => setSelectedAssignmentId(assignment.AssignmentID)}
                    style={{
                      padding: "0.75rem 1rem",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      background: selectedAssignmentId === assignment.AssignmentID ? "var(--primary)" : "transparent",
                      color: selectedAssignmentId === assignment.AssignmentID ? "var(--primary-foreground)" : "var(--foreground)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontSize: "0.875rem"
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>{assignment.Title}</div>
                    <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", opacity: 0.7 }}>
                      Due: {new Date(assignment.DueDate).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content: Assignment Details & Submissions */}
        <div>
          {selectedAssignmentId ? (
            <>
              {/* Assignment Info */}
              <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
                {assignments.find(a => a.AssignmentID === selectedAssignmentId) && (
                  <>
                    <h2 style={{ marginBottom: "0.5rem" }}>
                      {assignments.find(a => a.AssignmentID === selectedAssignmentId)?.Title}
                    </h2>
                    <p className="text-muted" style={{ marginBottom: "1rem" }}>
                      {assignments.find(a => a.AssignmentID === selectedAssignmentId)?.Description}
                    </p>
                    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                      <strong>Due Date:</strong> {new Date(assignments.find(a => a.AssignmentID === selectedAssignmentId)?.DueDate || "").toLocaleString()}
                    </div>
                  </>
                )}
              </div>

              {/* Submissions Section */}
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ marginBottom: "1.5rem" }}>
                  {isStudent ? "Your Submissions" : "Student Submissions"}
                </h3>

                {submissions.length === 0 ? (
                  <p className="text-muted">
                    {isStudent ? "No submissions yet." : "No submissions from students."}
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          {!isStudent && <th style={{ textAlign: "left" }}>Student</th>}
                          <th style={{ textAlign: "left" }}>Submission</th>
                          <th style={{ textAlign: "left" }}>Submitted</th>
                          <th style={{ textAlign: "left" }}>Grade</th>
                          {!isStudent && <th style={{ textAlign: "left" }}>Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {submissions.map((submission) => (
                          <tr key={submission.SubmissionID}>
                            {!isStudent && (
                              <td>
                                <div style={{ fontWeight: 500 }}>
                                  {submission.FirstName} {submission.LastName}
                                </div>
                                <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                                  {submission.Email}
                                </div>
                              </td>
                            )}
                            <td>
                              <a 
                                href={submission.SubmissionURL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: "var(--primary)" }}
                              >
                                View
                              </a>
                            </td>
                            <td style={{ fontSize: "0.875rem" }}>
                              {new Date(submission.SubmittedAt).toLocaleString()}
                            </td>
                            <td>
                              {submission.Grade !== null ? (
                                <span style={{ color: "var(--primary)", fontWeight: 500 }}>
                                  {submission.Grade}
                                </span>
                              ) : (
                                <span className="text-muted">Not graded</span>
                              )}
                            </td>
                            {!isStudent && (
                              <td>
                                {gradingSubmissionId === submission.SubmissionID ? (
                                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <input
                                      type="number"
                                      placeholder="0-100"
                                      value={gradeValue}
                                      onChange={(e) => setGradeValue(e.target.value)}
                                      min="0"
                                      max="100"
                                      style={{
                                        padding: "0.5rem",
                                        border: "1px solid var(--border)",
                                        borderRadius: "var(--radius)",
                                        width: "80px",
                                        fontSize: "0.875rem"
                                      }}
                                      disabled={gradeLoading}
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleGradeSubmit(submission)}
                                      disabled={gradeLoading}
                                      style={{
                                        padding: "0.5rem 0.75rem",
                                        background: "var(--primary)",
                                        color: "var(--primary-foreground)",
                                        border: "none",
                                        borderRadius: "var(--radius)",
                                        cursor: gradeLoading ? "not-allowed" : "pointer",
                                        fontSize: "0.875rem",
                                        opacity: gradeLoading ? 0.5 : 1
                                      }}
                                    >
                                      {gradeLoading ? "..." : "Save"}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setGradingSubmissionId(null)
                                        setGradeValue("")
                                        setGradeError(null)
                                      }}
                                      style={{
                                        padding: "0.5rem 0.75rem",
                                        background: "transparent",
                                        border: "1px solid var(--border)",
                                        borderRadius: "var(--radius)",
                                        cursor: "pointer",
                                        fontSize: "0.875rem"
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setGradingSubmissionId(submission.SubmissionID)
                                      setGradeValue(submission.Grade?.toString() || "")
                                      setGradeError(null)
                                    }}
                                    style={{
                                      padding: "0.5rem 0.75rem",
                                      background: "var(--primary)",
                                      color: "var(--primary-foreground)",
                                      border: "none",
                                      borderRadius: "var(--radius)",
                                      cursor: "pointer",
                                      fontSize: "0.875rem"
                                    }}
                                  >
                                    {submission.Grade !== null ? "Edit" : "Grade"}
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {gradeError && (
                      <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--destructive)", color: "var(--destructive-foreground)", borderRadius: "var(--radius)", fontSize: "0.875rem" }}>
                        {gradeError}
                      </div>
                    )}
                  </div>
                )}

                {/* Student: Submit Assignment Button */}
                {isStudent && selectedAssignmentId && !submissions.some(s => s.StudentID === user?.userID) && (
                  <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
                    <h4 style={{ marginBottom: "1rem" }}>Submit Assignment</h4>
                    <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                      <input
                        type="url"
                        placeholder="https://example.com/my-submission"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        style={{
                          padding: "0.75rem",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          fontSize: "0.875rem"
                        }}
                        disabled={submissionLoading}
                      />
                      <button
                        onClick={() => handleSubmitAssignment(selectedAssignmentId)}
                        disabled={submissionLoading}
                        style={{
                          padding: "0.75rem 1rem",
                          background: "var(--primary)",
                          color: "var(--primary-foreground)",
                          border: "none",
                          borderRadius: "var(--radius)",
                          cursor: submissionLoading ? "not-allowed" : "pointer",
                          fontWeight: 500,
                          opacity: submissionLoading ? 0.5 : 1
                        }}
                      >
                        {submissionLoading ? "Submitting..." : "Submit"}
                      </button>
                      {submissionError && (
                        <div style={{ padding: "0.75rem", background: "var(--destructive)", color: "var(--destructive-foreground)", borderRadius: "var(--radius)", fontSize: "0.875rem" }}>
                          {submissionError}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Student: Already submitted */}
                {isStudent && submissions.some(s => s.StudentID === user?.userID) && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--muted)", borderRadius: "var(--radius)", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                    You have already submitted this assignment.
                  </div>
                )}
              </div>
            </>
          ) : assignments.length > 0 ? (
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <p className="text-muted">Select an assignment from the left to view details</p>
            </div>
          ) : (
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <p className="text-muted">No assignments in this course</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssignmentsContent