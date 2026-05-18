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
    if (!user) {
      console.log("User not loaded yet")
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log("Loading courses for user:", user.userID, "role:", isStudent ? "student" : "lecturer")
      
      let courseData: Course[] = []
      
      if (isStudent) {
        console.log("Fetching student courses")
        courseData = await coursesApi.getByStudent(user.userID)
      } else if (isLecturer) {
        console.log("Fetching lecturer courses")
        courseData = await coursesApi.getByLecturer(user.userID)
      }
      
      console.log("Courses loaded:", courseData?.length || 0, "courses")
      setCourses(courseData || [])

      if (courseData && courseData.length > 0) {
        console.log("Setting first course as selected:", courseData[0].CourseID)
        setSelectedCourseId(courseData[0].CourseID)
      } else {
        console.log("No courses found for user")
        setSelectedCourseId(null)
        setAssignments([])
        setSubmissions([])
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error("Failed to load courses:", errorMsg)
      setError(`Failed to load courses: ${errorMsg}`)
      setCourses([])
      setSelectedCourseId(null)
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
      setError(null)
      console.log("Loading assignments for courseId:", courseId)
      
      const data = await assignmentsApi.getByCourse(courseId)
      console.log("Assignments response:", data)
      console.log("Total assignments:", data?.length || 0)
      
      setAssignments(data || [])

      if (data && data.length > 0) {
        console.log("Setting first assignment as selected:", data[0].AssignmentID)
        setSelectedAssignmentId(data[0].AssignmentID)
      } else {
        console.log("No assignments found for course", courseId)
        setSelectedAssignmentId(null)
        setSubmissions([])
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error("Failed to load assignments for course", courseId, ":", errorMsg)
      setError(`Failed to load assignments: ${errorMsg}`)
      setAssignments([])
      setSelectedAssignmentId(null)
      setSubmissions([])
    }
  }

  // Load submissions for selected assignment (lecturer only)
  useEffect(() => {
    if (selectedAssignmentId && (isLecturer || isStudent)) {
      loadSubmissions(selectedAssignmentId)
    }
  }, [selectedAssignmentId, isLecturer, isStudent])

  const loadSubmissions = async (assignmentId: string) => {
    try {
      console.log("Loading submissions for assignmentId:", assignmentId)
      const data = await assignmentsApi.getSubmissions(assignmentId)
      console.log("Submissions loaded:", data?.length || 0, "submissions")
      setSubmissions(data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error("Failed to load submissions for assignment", assignmentId, ":", errorMsg)
      // Don't set global error for submissions, just log it
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

      console.log("Submitting grade:", gradeNum, "for student:", submission.StudentID, "assignment:", selectedAssignmentId)
      await assignmentsApi.grade(selectedAssignmentId, submission.StudentID, gradeNum)
      
      console.log("Grade submitted successfully")
      setGradeValue("")
      setGradingSubmissionId(null)
      setGradeError(null)
      
      // Reload submissions
      loadSubmissions(selectedAssignmentId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setGradeError("Failed to submit grade: " + errorMsg)
      console.error("Grade submission failed:", errorMsg)
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
      console.log("Submitting assignment:", assignmentId, "for student:", user.userID)
      await assignmentsApi.submit(assignmentId, user.userID, submissionUrl.trim())
      
      console.log("Assignment submitted successfully")
      setSubmissionUrl("")
      setSubmittingAssignmentId(null)
      
      // Reload submissions
      loadSubmissions(assignmentId)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setSubmissionError("Failed to submit: " + errorMsg)
      console.error("Assignment submission failed:", errorMsg)
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
        <div className="card" style={{ background: "var(--color-error-subtle)", color: "var(--color-error)", marginBottom: "1rem", padding: "1rem", borderRadius: "var(--radius-md)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "2rem" }}>
        {/* Left Sidebar: Courses & Assignments */}
        <div>
          {/* Courses */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Courses</h3>
            </div>
            <div className="card-content" style={{ padding: 0 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {courses.map((course) => (
                  <button
                    key={course.CourseID}
                    onClick={() => setSelectedCourseId(course.CourseID)}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--color-border-subtle)",
                      textAlign: "left",
                      background: selectedCourseId === course.CourseID ? "var(--color-bg-hover)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "background var(--transition-fast)",
                    }}
                  >
                    <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{course.CourseCode}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>{course.CourseName}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignments */}
          {selectedCourseId && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <div className="card-header">
                <h3 className="card-title">Assignments</h3>
              </div>
              <div className="card-content" style={{ padding: 0 }}>
                {assignments.length === 0 ? (
                  <p style={{ padding: "1rem", color: "var(--color-text-muted)" }}>No assignments</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {assignments.map((assignment) => (
                      <button
                        key={assignment.AssignmentID}
                        onClick={() => setSelectedAssignmentId(assignment.AssignmentID)}
                        style={{
                          padding: "1rem",
                          borderBottom: "1px solid var(--color-border-subtle)",
                          textAlign: "left",
                          background: selectedAssignmentId === assignment.AssignmentID ? "var(--color-bg-hover)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          transition: "background var(--transition-fast)",
                        }}
                      >
                        <div style={{ fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "0.25rem" }}>
                          {assignment.Title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          Due {new Date(assignment.DueDate).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div>
          {selectedAssignmentId ? (
            <>
              {assignments.find((a) => a.AssignmentID === selectedAssignmentId) && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                  <div className="card-header">
                    <h2 className="card-title">
                      {assignments.find((a) => a.AssignmentID === selectedAssignmentId)?.Title}
                    </h2>
                    <p className="card-description">
                      {assignments.find((a) => a.AssignmentID === selectedAssignmentId)?.Description}
                    </p>
                  </div>
                </div>
              )}

              {/* Lecturer: Submissions Table */}
              {isLecturer && submissions.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Submissions</h3>
                    <p className="card-description">{submissions.length} student(s) submitted</p>
                  </div>
                  <div className="card-content">
                    <div style={{ overflowX: "auto" }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Submission</th>
                            <th>Submitted</th>
                            <th>Grade</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((submission) => (
                            <tr key={submission.SubmissionID}>
                              <td>
                                <div style={{ fontWeight: 500 }}>
                                  {submission.FirstName} {submission.LastName}
                                </div>
                                <div style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                                  {submission.Email}
                                </div>
                              </td>
                              <td>
                                <a 
                                  href={submission.SubmissionURL} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--color-accent-text)" }}
                                >
                                  View
                                </a>
                              </td>
                              <td style={{ fontSize: "0.875rem" }}>
                                {new Date(submission.SubmittedAt).toLocaleString()}
                              </td>
                              <td>
                                {submission.Grade !== null ? (
                                  <span style={{ color: "var(--color-accent)", fontWeight: 500 }}>
                                    {submission.Grade}
                                  </span>
                                ) : (
                                  <span className="text-muted">Not graded</span>
                                )}
                              </td>
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
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-md)",
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
                                        background: "var(--color-accent)",
                                        color: "var(--color-text-primary)",
                                        border: "none",
                                        borderRadius: "var(--radius-md)",
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
                                        border: "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-md)",
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
                                      background: "var(--color-accent)",
                                      color: "var(--color-text-primary)",
                                      border: "none",
                                      borderRadius: "var(--radius-md)",
                                      cursor: "pointer",
                                      fontSize: "0.875rem"
                                    }}
                                  >
                                    {submission.Grade !== null ? "Edit" : "Grade"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {gradeError && (
                        <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--color-error-subtle)", color: "var(--color-error)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                          {gradeError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lecturer: No submissions yet */}
              {isLecturer && submissions.length === 0 && (
                <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
                  <p className="text-muted">No submissions yet</p>
                </div>
              )}

              {/* Student: Submit Assignment Button */}
              {isStudent && selectedAssignmentId && !submissions.some(s => s.StudentID === user?.userID) && (
                <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--color-border)" }}>
                  <h4 style={{ marginBottom: "1rem" }}>Submit Assignment</h4>
                  <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                    <input
                      type="url"
                      placeholder="https://example.com/my-submission"
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      style={{
                        padding: "0.75rem",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.875rem",
                        background: "var(--color-bg-tertiary)",
                        color: "var(--color-text-primary)"
                      }}
                      disabled={submissionLoading}
                    />
                    <button
                      onClick={() => handleSubmitAssignment(selectedAssignmentId)}
                      disabled={submissionLoading}
                      style={{
                        padding: "0.75rem 1rem",
                        background: "var(--color-accent)",
                        color: "var(--color-text-primary)",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: submissionLoading ? "not-allowed" : "pointer",
                        fontWeight: 500,
                        opacity: submissionLoading ? 0.5 : 1
                      }}
                    >
                      {submissionLoading ? "Submitting..." : "Submit"}
                    </button>
                    {submissionError && (
                      <div style={{ padding: "0.75rem", background: "var(--color-error-subtle)", color: "var(--color-error)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                        {submissionError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Student: Already submitted */}
              {isStudent && submissions.some(s => s.StudentID === user?.userID) && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--color-accent-subtle)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", color: "var(--color-accent-text)" }}>
                  ✓ You have already submitted this assignment.
                </div>
              )}
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
