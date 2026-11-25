import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { storageService, STORAGE_KEYS } from '../services/storageService'

export default function MaintenanceBanner() {
  const { isAdmin } = useAuth()
  const location = useLocation()
  const settings = storageService.get(STORAGE_KEYS.SETTINGS, {})

  if (!settings || settings.maintenanceMode !== true) {
    return null
  }

  // Never lock out administrators or block /login
  if (location.pathname.startsWith('/admin') || location.pathname === '/login') {
    return null
  }

  return (
    <div
      role="status"
      style={{
        backgroundColor: '#fef3c7',
        color: '#92400e',
        borderBottom: '1px solid #fde68a',
        padding: '8px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        textAlign: 'center',
        fontWeight: 600,
      }}
    >
      {isAdmin
        ? 'MAINTENANCE MODE ACTIVE (Admin Bypass Enabled)'
        : `${settings.platformName || 'PORTFOLIO STUDIO'} — Scheduled maintenance in progress. Administrator access remains active.`}
    </div>
  )
}
