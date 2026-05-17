"use client"

import { useState, useEffect } from "react"
import { reportsApi } from "@/api.ts"
import type { ReportCourse, ReportStudent, ReportLecturer } from "@/api.ts"

export function ReportsContent() {
  const [activeTab, setActiveTab] = useState("courses-50")

  const [courses50, setCourses50] = useState<ReportCourse[]>([])
  const [students5, setStudents5] = useState<ReportStudent[]>([])
  const [lecturers3, setLecturers3] = useState<ReportLecturer[]>([])
  const [topTenEnrolled, setTopTenEnrolled] = useState<ReportCourse[]>([])
  const [topTenStudents, setTopTenStudents] = useState<ReportStudent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [c50, s5, l3, topE, topS] = await Promise.all([
          reportsApi.coursesWithFiftyPlus(),
          reportsApi.studentsWithFivePlus(),
          reportsApi.lecturersWithThreePlus(),
          reportsApi.topTenEnrolled(),
          reportsApi.topTenGrades()
        ])
        setCourses50(c50)
        setStudents5(s5)
        setLecturers3(l3)
        setTopTenEnrolled(topE)
        setTopTenStudents(topS)
      } catch (err) {
        console.error("Report fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const tabs = [
    { id: "courses-50", label: "50+ Students" },
    { id: "students-5", label: "5+ Courses" },
    { id: "lecturers-3", label: "3+ Courses" },
    { id: "top-enrolled", label: "Top Enrolled" },
    { id: "top-students", label: "Top Students" },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <p className="text-muted">Loading Report Analytics...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header page-header-with-actions">
        <div>
          <h1>Reports</h1>
          <p>View system analytics and statistics</p>
        </div>
        <button className="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', marginRight: 'var(--space-2)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          Export Reports
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Students</span>
          </div>
          <div className="stat-card-value">100,000+</div>
          <div className="stat-card-desc">Registered users</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Courses</span>
          </div>
          <div className="stat-card-value">200+</div>
          <div className="stat-card-desc">Active courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Lecturers</span>
          </div>
          <div className="stat-card-value">150+</div>
          <div className="stat-card-desc">Teaching staff</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Avg. Enrollment</span>
          </div>
          <div className="stat-card-value">500</div>
          <div className="stat-card-desc">Per course</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-1)', 
          background: 'var(--color-bg-tertiary)', 
          padding: 'var(--space-1)', 
          borderRadius: 'var(--radius-lg)',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === tab.id ? 'var(--color-bg-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === "courses-50" && (
          <>
            <div className="card-header">
              <h3 className="card-title">Courses with 50+ Students</h3>
              <p className="card-description">All courses that have 50 or more enrolled students</p>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th style={{ textAlign: 'right' }}>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses50.map((course) => (
                      <tr key={course.CourseCode}>
                        <td><span className="badge badge-outline">{course.CourseCode}</span></td>
                        <td style={{ fontWeight: 500 }}>{course.CourseName}</td>
                        <td style={{ textAlign: 'right' }}>{course.StudentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "students-5" && (
          <>
            <div className="card-header">
              <h3 className="card-title">Students with 5+ Courses</h3>
              <p className="card-description">Students enrolled in 5 or more courses</p>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Major</th>
                      <th style={{ textAlign: 'right' }}>Courses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students5.map((student) => (
                      <tr key={`${student.FirstName}-${student.LastName}`}>
                        <td style={{ fontWeight: 500 }}>{`${student.FirstName} ${student.LastName}`}</td>
                        <td>{student.Major}</td>
                        <td style={{ textAlign: 'right' }}><span className="badge badge-primary">{student.CourseCount}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "lecturers-3" && (
          <>
            <div className="card-header">
              <h3 className="card-title">Lecturers with 3+ Courses</h3>
              <p className="card-description">Lecturers teaching 3 or more courses</p>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'right' }}>Courses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lecturers3.map((lecturer) => (
                      <tr key={lecturer.Name}>
                        <td style={{ fontWeight: 500 }}>{lecturer.Name}</td>
                        <td>{lecturer.Department}</td>
                        <td style={{ textAlign: 'right' }}><span className="badge badge-primary">{lecturer.CourseCount}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "top-enrolled" && (
          <>
            <div className="card-header">
              <h3 className="card-title">Top 10 Most Enrolled Courses</h3>
              <p className="card-description">Courses with the highest student enrollment</p>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Rank</th>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th style={{ textAlign: 'right' }}>Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTenEnrolled.map((course, index) => (
                      <tr key={course.CourseCode}>
                        <td><span className={`badge ${index < 3 ? 'badge-primary' : 'badge-secondary'}`}>#{index + 1}</span></td>
                        <td><span className="badge badge-outline">{course.CourseCode}</span></td>
                        <td style={{ fontWeight: 500 }}>{course.CourseName}</td>
                        <td style={{ textAlign: 'right' }}>{course.StudentCount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "top-students" && (
          <>
            <div className="card-header">
              <h3 className="card-title">Top 10 Students by Overall Average</h3>
              <p className="card-description">Students with the highest grade averages</p>
            </div>
            <div className="card-content">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Rank</th>
                      <th>Name</th>
                      <th>Major</th>
                      <th style={{ textAlign: 'right' }}>Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTenStudents.map((student, index) => (
                      <tr key={student.FirstName + student.LastName}>
                        <td><span className={`badge ${index < 3 ? 'badge-primary' : 'badge-secondary'}`}>#{index + 1}</span></td>
                        <td style={{ fontWeight: 500 }}>{`${student.FirstName} ${student.LastName}`}</td>
                        <td>{student.Major}</td>
                        <td style={{ textAlign: 'right', fontWeight: 500, color: 'var(--color-success)' }}>
                          {student.AverageGrade ? `${Number(student.AverageGrade).toFixed(1)}%` : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportsContent
