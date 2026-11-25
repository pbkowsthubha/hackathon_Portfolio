import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { portfolioService } from '../../services/portfolioService'

export default function DashboardHeader({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isPublished = user?.username ? portfolioService.isPortfolioPublished(user.username) : false

  const handleLogout = () => {
    navigate('/', { replace: true })
    setTimeout(() => {
      logout()
    }, 10)
  }

  return (
    <header className="dash-top-header">
      <div className="dash-top-header-inner">
        {/* Mobile Toggle Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="dash-mobile-menu-btn"
          aria-label="Open sidebar menu"
        >
          <span className="dash-menu-bar" />
          <span className="dash-menu-bar" />
          <span className="dash-menu-bar" />
        </button>

        <div className="dash-top-brand-mobile">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>
            PORTFOLIO STUDIO
          </Link>
        </div>

        {/* Right Action Controls */}
        <div className="dash-top-actions">
          <Link
            to="/"
            className="btn-dash-home"
            aria-label="Back to Platform Home"
          >
            <span className="btn-dash-home-arrow" aria-hidden="true">←</span>
            <span className="btn-dash-home-full">Platform Home</span>
            <span className="btn-dash-home-short" aria-hidden="true">Home</span>
          </Link>

          <Link
            to={user?.username ? (isPublished ? `/p/${user.username}` : `/preview/${user.username}`) : '#'}
            target={isPublished ? '_blank' : undefined}
            rel={isPublished ? 'noopener noreferrer' : undefined}
            className="btn-dash-preview"
          >
            <span>{isPublished ? 'Live Portfolio' : 'Preview Draft'}</span>
            <span style={{ fontSize: '0.85rem' }}>{isPublished ? '↗' : '→'}</span>
          </Link>

          <button type="button" onClick={handleLogout} className="btn-dash-logout">
            Log Out
          </button>
        </div>
      </div>
    </header>
  )
}
