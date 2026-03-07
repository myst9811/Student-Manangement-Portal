import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Pages (to be built in subsequent phases)
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import StudentsListPage from '@/pages/StudentsListPage'
import StudentDetailPage from '@/pages/StudentDetailPage'
import CoursesListPage from '@/pages/CoursesListPage'
import CourseDetailPage from '@/pages/CourseDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AppLayout from '@/components/layout/AppLayout'

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsListPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="courses" element={<CoursesListPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
