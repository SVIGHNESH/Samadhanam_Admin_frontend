import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './hooks/useAuth'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import ComplaintsPage from './pages/Complaints'
import ComplaintDetailPage from './pages/ComplaintDetail'
import MunicipalitiesPage from './pages/Municipalities'
import EscalatedPage from './pages/Escalated'

function ProtectedRoute({ children }) {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/complaints" element={
        <ProtectedRoute>
          <ComplaintsPage />
        </ProtectedRoute>
      } />
      <Route path="/complaints/:id" element={
        <ProtectedRoute>
          <ComplaintDetailPage />
        </ProtectedRoute>
      } />
      <Route path="/municipalities" element={
        <ProtectedRoute>
          <MunicipalitiesPage />
        </ProtectedRoute>
      } />
      <Route path="/municipalities/:name" element={
        <ProtectedRoute>
          <MunicipalitiesPage />
        </ProtectedRoute>
      } />
      <Route path="/escalated" element={
        <ProtectedRoute>
          <EscalatedPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
