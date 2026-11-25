import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Checking admin permissions...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== 'admin') {
    // Non-admin creators attempting to access /admin are safely routed to creator dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children
}
