import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AppShell, AuthLayout } from './components/AppShell'
import { Spinner } from './components/ui'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Detection from './pages/Detection'
import Profile from './pages/Profile'
import Plants from './pages/Plants'
import Weather from './pages/Weather'
import ForgotPassword from './pages/ForgotPassword'
import Admin from './pages/Admin'

function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="center-pad page">
        <Spinner label="Loading session" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function PublicOnly({ children }) {
  const { isAuthenticated, ready } = useAuth()
  if (!ready) {
    return (
      <div className="center-pad page">
        <Spinner label="Loading session" />
      </div>
    )
  }
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

function AdminRoute({ children }) {
  const { isAuthenticated, ready, user } = useAuth()
  const location = useLocation()

  if (!ready) {
    return (
      <div className="center-pad page">
        <Spinner label="Loading session" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <AuthLayout>
              <Signup />
            </AuthLayout>
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <AuthLayout>
              <ForgotPassword />
            </AuthLayout>
          </PublicOnly>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="detect" element={<Detection />} />
        <Route path="profile" element={<Profile />} />
        <Route path="plants" element={<Plants />} />
        <Route path="weather" element={<Weather />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
