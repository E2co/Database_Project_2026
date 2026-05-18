import { useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/components/auth/auth-context"
import useAuth from "@/components/auth/auth-context"

// Auth Pages
import LoginForm from "@/components/auth/login-form"
import RegisterForm from "@/components/auth/register-form"

// Dashboard Pages
import DashboardLayout from "@/components/dashboard/layout"
import DashboardContent from "@/components/dashboard/dashboard-content"
import CoursesContent from "@/components/courses/courses-content"
import CourseDetailContent from "@/components/courses/course-detail-content"
import CalendarContent from "@/components/calendar/calendar-content"
import AssignmentsContent from "@/components/assignments/assignments-content"
import ForumsContent from "@/components/forums/forums-content"
import ReportsContent from "@/components/reports/reports-content"

// Loading component
function LoadingPage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--foreground)',
      fontSize: '1rem',
      fontFamily: 'inherit'
    }}>
      Loading...
    </div>
  )
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingPage />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route wrapper - allows access to login/register even while loading
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  // Only redirect if NOT loading AND user exists
  // This allows the login page to show immediately
  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Main Routes Component
function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes - Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginForm />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterForm />
          </PublicRoute>
        }
      />

      {/* Dashboard Routes - Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardContent />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/courses"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CoursesContent />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/content/:courseId"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CourseDetailContent />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/calendar"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CalendarContent />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/assignments"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AssignmentsContent />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/forums"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ForumsContent />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reports"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReportsContent />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Root and fallback routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App