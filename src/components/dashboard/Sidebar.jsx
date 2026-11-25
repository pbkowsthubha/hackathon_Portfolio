import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { portfolioService } from '../../services/portfolioService'
import './Sidebar.css'

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const isPublished = user?.username ? portfolioService.isPortfolioPublished(user.username) : false

  const navItems = [
    { label: 'Overview', to: '/dashboard', activeExact: true, available: true },
    { label: 'My Profile', to: '/dashboard/profile', available: true },
    { label: 'Projects', to: '/dashboard/projects', available: true },
    { label: 'Skills', to: '/dashboard/skills', available: true },
    { label: 'Education', to: '/dashboard/education', available: true },
    { label: 'Achievements', to: '/dashboard/achievements', available: true },
    { label: 'Certifications', to: '/dashboard/certifications', available: true },
    { label: 'Blog', to: '/dashboard/blog', available: true },
    { label: 'Design Studio', to: '/dashboard/design-studio', available: true },
    { label: 'Publishing', to: '/dashboard/publishing', available: true },
    {
      label: isPublished ? 'Live Preview' : 'Preview Draft',
      to: user?.username ? (isPublished ? `/p/${user.username}` : `/preview/${user.username}`) : '#',
      isExternal: isPublished,
      available: true,
    },
    { label: 'Settings', stage: 'Upcoming', available: false },
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`dashboard-sidebar ${isOpen ? 'dashboard-sidebar--open' : ''}`}>
        <div className="sidebar-brand-section">
          <Link
            to="/"
            className="sidebar-brand-link"
            aria-label="Back to Portfolio Studio Platform Home"
            onClick={onClose}
          >
            <span className="sidebar-brand-title">
              <span>PORTFOLIO STUDIO</span>
              <span className="brand-dot">.</span>
            </span>
            <span className="sidebar-edition-tag">CREATOR SUITE</span>
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard Navigation">
          <div className="nav-group-label">WORKSPACE</div>
          <ul className="sidebar-nav-list">
            {navItems.map((item, idx) => (
              <li key={idx} className="sidebar-nav-item">
                {item.available ? (
                  <NavLink
                    to={item.to}
                    end={item.activeExact}
                    target={item.isExternal ? '_blank' : undefined}
                    rel={item.isExternal ? 'noopener noreferrer' : undefined}
                    className={({ isActive }) =>
                      `sidebar-nav-link ${isActive && !item.isExternal ? 'sidebar-nav-link--active' : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className="nav-item-indicator" aria-hidden="true" />
                    <span className="nav-item-text">{item.label}</span>
                    {item.isExternal && <span className="nav-external-arrow">↗</span>}
                  </NavLink>
                ) : (
                  <div className="sidebar-nav-link sidebar-nav-link--disabled" title="Coming in upcoming stages">
                    <span className="nav-item-text">{item.label}</span>
                    <span className="nav-stage-badge">{item.stage}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-block">
            <span className="user-name-display">{user?.fullName || 'Creator'}</span>
            <span className="user-handle-display">@{user?.username}</span>
          </div>
        </div>
      </aside>
    </>
  )
}
