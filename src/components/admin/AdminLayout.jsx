import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import './AdminLayout.css'

const ADMIN_NAV_ITEMS = [
  { label: 'Overview', to: '/admin', end: true },
  { label: 'User Management', to: '/admin/users' },
  { label: 'Portfolio Moderation', to: '/admin/portfolios' },
  { label: 'Blog Moderation', to: '/admin/blogs' },
  { label: 'Activity Logs', to: '/admin/logs' },
  { label: 'Platform Settings', to: '/admin/settings' },
  { label: 'Data Backup & Restore', to: '/admin/backup' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    navigate('/', { replace: true })
    setTimeout(() => {
      logout()
    }, 10)
  }

  return (
    <div className="admin-layout-root">
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-brand-box">
          <Link to="/" className="admin-brand-link" onClick={() => setSidebarOpen(false)}>
            <span className="admin-brand-title">
              PORTFOLIO STUDIO<span className="admin-brand-dot">.</span>
            </span>
            <span className="admin-edition-tag">ADMIN CONTROL CENTER</span>
          </Link>
        </div>

        <nav className="admin-nav" aria-label="Admin Navigation">
          <div className="admin-nav-label">OVERSIGHT</div>
          <ul className="admin-nav-list">
            {ADMIN_NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="admin-nav-dot" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="admin-nav-divider" />

          <ul className="admin-nav-list">
            <li>
              <Link to="/" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
                <span aria-hidden="true">←</span>
                <span>Return to Platform Home</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-meta">
            <span className="admin-user-name">{user?.fullName || 'Administrator'}</span>
            <span className="admin-user-handle">@{user?.username || 'admin'} · ADMIN</span>
          </div>
        </div>
      </aside>

      <div className="admin-content-area">
        <header className="admin-top-header">
          <div className="admin-top-header-inner">
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? 'Close admin menu' : 'Open admin menu'}
              aria-expanded={sidebarOpen}
            >
              <span className="admin-menu-bar" />
              <span className="admin-menu-bar" />
              <span className="admin-menu-bar" />
            </button>

            <div className="admin-top-actions">
              <span className="admin-role-pill">ADMINISTRATOR</span>
              <Link to="/" className="btn-admin-home">
                <span aria-hidden="true">←</span>
                <span className="btn-admin-home-text">Platform Home</span>
              </Link>
              <button type="button" onClick={handleLogout} className="btn-admin-logout">
                Log Out
              </button>
            </div>
          </div>
        </header>

        <main className="admin-main-wrapper">{children}</main>
      </div>
    </div>
  )
}
