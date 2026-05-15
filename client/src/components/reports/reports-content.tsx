"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

  if (loading) return <div className="p-10 text-center">Loading Report Analytics...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">View system analytics and statistics</p>
        </div>
        <Button variant="outline">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          Export Reports
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100,000+</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">200+</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Lecturers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150+</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">500</div>
            <p className="text-xs text-muted-foreground">Per course</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="courses-50" className="text-xs sm:text-sm">50+ Students</TabsTrigger>
          <TabsTrigger value="students-5" className="text-xs sm:text-sm">5+ Courses</TabsTrigger>
          <TabsTrigger value="lecturers-3" className="text-xs sm:text-sm">3+ Courses</TabsTrigger>
          <TabsTrigger value="top-enrolled" className="text-xs sm:text-sm">Top Enrolled</TabsTrigger>
          <TabsTrigger value="top-students" className="text-xs sm:text-sm">Top Students</TabsTrigger>
        </TabsList>

        {/* Courses with 50+ students */}
        <TabsContent value="courses-50" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Courses with 50+ Students</CardTitle>
              <CardDescription>All courses that have 50 or more enrolled students</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses50.map((course) => (
                    <TableRow key={course.CourseCode}>
                      <TableCell>
                        <Badge variant="outline">{course.CourseCode}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{course.CourseName}</TableCell>
                      <TableCell className="text-right">{course.StudentCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students with 5+ courses */}
        <TabsContent value="students-5" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Students with 5+ Courses</CardTitle>
              <CardDescription>Students enrolled in 5 or more courses</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Major</TableHead>
                    <TableHead className="text-right">Courses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students5.map((student) => (
                    <TableRow key={`${student.FirstName}-${student.LastName}`}>
                      <TableCell className="font-medium">{`${student.FirstName} ${student.LastName}`}</TableCell>
                      <TableCell>{student.Major}</TableCell>
                      <TableCell className="text-right">
                        <Badge>{student.CourseCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lecturers with 3+ courses */}
        <TabsContent value="lecturers-3" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lecturers with 3+ Courses</CardTitle>
              <CardDescription>Lecturers teaching 3 or more courses</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Courses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturers3.map((lecturer) => (
                    <TableRow key={lecturer.Name}>
                      <TableCell className="font-medium">{lecturer.Name}</TableCell>
                      <TableCell>{lecturer.Department}</TableCell>
                      <TableCell className="text-right">
                        <Badge>{lecturer.CourseCount}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top 10 enrolled courses */}
        <TabsContent value="top-enrolled" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Enrolled Courses</CardTitle>
              <CardDescription>Courses with the highest student enrollment</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Course Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTenEnrolled.map((course, index) => (
                    <TableRow key={course.CourseCode}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{course.CourseCode}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{course.CourseName}</TableCell>
                      <TableCell className="text-right">{course.StudentCount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top 10 students */}
        <TabsContent value="top-students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Students by Overall Average</CardTitle>
              <CardDescription>Students with the highest grade averages</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Major</TableHead>
                    <TableHead className="text-right">Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTenStudents.map((student, index) => (
                    <TableRow key={student.FirstName + student.LastName}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{`${student.FirstName} ${student.LastName}`}</TableCell>
                      <TableCell>{student.Major}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {student.AverageGrade ? `${Number(student.AverageGrade).toFixed(1)}%` : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ReportsContent