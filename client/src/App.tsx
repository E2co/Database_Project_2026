import { Routes, Route } from "react-router-dom"
import { AuthProvider } from "./components/auth/auth-context"
import { DashboardLayout } from "./components/dashboard/layout"
import LoginForm from "./components/auth/login-form"
import DashboardContent from "./components/dashboard/dashboard-content"
import CoursesContent from "./components/courses/courses-content"
import CourseDetailContent from "./components/courses/course-detail-content"
import CalendarContent from "./components/calendar/calendar-content"
import AssignmentsContent from "./components/assignments/assignments-content"
import ForumsContent from "./components/forums/forums-content"
import ReportsContent from "./components/reports/reports-content"

function App() {
  return (
    <AuthProvider>
      <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/dashboard" element={
        <DashboardLayout>
          <DashboardContent />
        </DashboardLayout>
      } />
      <Route path="/dashboard/courses" element={
        <DashboardLayout>
          <CoursesContent />
        </DashboardLayout>
      } />
      <Route path="/dashboard/courses/:courseId" element={
        <DashboardLayout>
          <CourseDetailContent  />
        </DashboardLayout>
      } />
      <Route path="/dashboard/calendar" element={
        <DashboardLayout>
          <CalendarContent />
        </DashboardLayout>
      } />
      <Route path="/dashboard/assignments" element={
        <DashboardLayout>
          <AssignmentsContent />
        </DashboardLayout>
      } />
      <Route path="/dashboard/forums" element={
        <DashboardLayout>
          <ForumsContent />
        </DashboardLayout>
      } />
      <Route path="/dashboard/reports" element={
        <DashboardLayout>
          <ReportsContent />
        </DashboardLayout>
      } />
      </Routes>
    </AuthProvider>
  )
}

export default App