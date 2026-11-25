import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { authService } from '../services/authService'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Authenticating session...
        </p>
      </div>
    )
  }

  const liveSession = user ? authService.getCurrentUser() : null
  if (!user || !liveSession || liveSession.status === 'suspended') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (liveSession.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return children
}
