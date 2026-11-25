import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import { getThemeById } from '../data/designThemes'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const portfolio = user?.username ? portfolioService.getUserPortfolio(user.username) : null
  const completion = portfolio ? portfolioService.calculateCompletion(portfolio) : { percentage: 0, fields: [] }

  const projectsCount = portfolio?.projects?.length || 0
  const skillsCount = portfolio?.skills?.length || 0
  const educationCount = portfolio?.education?.length || 0
  const achievementsCount = portfolio?.achievements?.length || 0
  const certificationsCount = portfolio?.certifications?.length || 0
  const blogPosts = portfolio?.blogPosts || []
  const blogTotalCount = blogPosts.length
  const blogPublishedCount = blogPosts.filter((p) => p.status === 'published').length
  const blogDraftCount = blogPosts.filter((p) => p.status !== 'published').length
  const isPublished = portfolio?.publication?.status === 'published'
  const activeThemeName = getThemeById(portfolio?.design?.themeId).name

  const formatLastUpdated = (isoString) => {
    if (!isoString) return 'Just now'
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Recently'
    }
  }

  return (
    <DashboardLayout>
      <div className="dashboard-content-container">
        {/* Workspace Welcome Banner */}
        <div className="dash-welcome-card">
          <div className="welcome-tag">CREATOR OVERVIEW</div>
          <h1 className="welcome-title">Your creative workspace.</h1>
          <p className="welcome-desc">
            Welcome, <strong>{user?.fullName || 'Creator'}</strong>. Build and manage your professional identity from one place.
          </p>
        </div>

        {/* Primary Metrics & Status Row */}
        <div className="dash-grid">
          {/* Status & Last Updated Card */}
          <div className="dash-card">
            <div className="card-top">
              <span className="card-meta">PORTFOLIO STATUS</span>
              <span className="status-marker" aria-hidden="true">■</span>
            </div>

            <div className="card-body-details">
              <div className="detail-row">
                <span className="detail-key">Publication State:</span>
                <span className={isPublished ? 'status-badge-published' : 'status-badge-draft'}>
                  {isPublished ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Public URL:</span>
                <span className="detail-val mono-link">/p/{user?.username}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Last Updated:</span>
                <span className="detail-val">{formatLastUpdated(portfolio?.updatedAt)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Active Theme:</span>
                <span className="detail-val">{activeThemeName}</span>
              </div>
            </div>

            <div className="dash-card-actions">
              <Link to="/dashboard/profile" className="btn-dash-primary-action">
                <span>Edit My Profile</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Deterministic Profile Completion Indicator */}
          <div className="dash-card">
            <div className="card-top">
              <span className="card-meta">PROFILE READINESS</span>
              <span className="completion-percentage-val">{completion.percentage}%</span>
            </div>

            <div className="completion-bar-wrapper" role="progressbar" aria-valuenow={completion.percentage} aria-valuemin="0" aria-valuemax="100">
              <div
                className="completion-bar-fill"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>

            <div className="completion-breakdown-list">
              <span className="breakdown-title">COMPLETION CRITERIA (DETERMINISTIC WEIGHTS):</span>
              <div className="breakdown-grid">
                {completion.fields.map((f, i) => (
                  <div key={i} className={`breakdown-item ${f.completed ? 'breakdown-item--done' : ''}`}>
                    <span className="item-check">{f.completed ? '✓' : '○'}</span>
                    <span className="item-name">{f.name}</span>
                    <span className="item-weight">({f.weight}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Content Metrics Row */}
        <div className="dash-metrics-strip">
          <div className="metric-pill-card">
            <span className="metric-pill-num">{projectsCount}</span>
            <span className="metric-pill-label">Projects</span>
          </div>
          <div className="metric-pill-card">
            <span className="metric-pill-num">{skillsCount}</span>
            <span className="metric-pill-label">Skills</span>
          </div>
          <div className="metric-pill-card">
            <span className="metric-pill-num">{educationCount}</span>
            <span className="metric-pill-label">Education</span>
          </div>
          <div className="metric-pill-card">
            <span className="metric-pill-num">{achievementsCount}</span>
            <span className="metric-pill-label">Achievements</span>
          </div>
          <div className="metric-pill-card">
            <span className="metric-pill-num">{certificationsCount}</span>
            <span className="metric-pill-label">Certifications</span>
          </div>
          <div className="metric-pill-card">
            <span className="metric-pill-num">{blogTotalCount}</span>
            <span className="metric-pill-label">Blog Posts</span>
          </div>
        </div>

        {/* Quick Access to Sections */}
        <div className="dash-sections-preview-card">
          <div className="card-top">
            <span className="card-meta">PORTFOLIO MODULES</span>
            <span className="status-marker" aria-hidden="true">■</span>
          </div>

          <div className="modules-grid">
            <Link to="/dashboard/profile" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">01</span>
                <span className="module-status-active">Active</span>
              </div>
              <h3 className="module-title">Personal Profile</h3>
              <p className="module-desc">Bio, professional title, location, photo, and social links.</p>
            </Link>

            <Link to="/dashboard/projects" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">02</span>
                <span className="module-status-active">Active ({projectsCount})</span>
              </div>
              <h3 className="module-title">Projects Showcase</h3>
              <p className="module-desc">Add, edit and organize software & engineering projects.</p>
            </Link>

            <Link to="/dashboard/skills" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">03</span>
                <span className="module-status-active">Active ({skillsCount})</span>
              </div>
              <h3 className="module-title">Skills Manager</h3>
              <p className="module-desc">Curate technical proficiencies and categorized capabilities.</p>
            </Link>

            <Link to="/dashboard/education" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">04</span>
                <span className="module-status-active">Active ({educationCount})</span>
              </div>
              <h3 className="module-title">Education Manager</h3>
              <p className="module-desc">Track academic degrees, institutions, and study periods.</p>
            </Link>

            <Link to="/dashboard/achievements" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">05</span>
                <span className="module-status-active">Active ({achievementsCount})</span>
              </div>
              <h3 className="module-title">Achievements</h3>
              <p className="module-desc">Highlight hackathons, competition wins, and awards.</p>
            </Link>

            <Link to="/dashboard/certifications" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">06</span>
                <span className="module-status-active">Active ({certificationsCount})</span>
              </div>
              <h3 className="module-title">Certifications</h3>
              <p className="module-desc">Credential badges, issuing orgs, and verification links.</p>
            </Link>

            <Link to="/dashboard/blog" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">07</span>
                <span className="module-status-active">Active ({blogTotalCount})</span>
              </div>
              <h3 className="module-title">Blog Publishing</h3>
              <p className="module-desc">Write, preview, and publish articles ({blogPublishedCount} published, {blogDraftCount} drafts).</p>
            </Link>

            <Link to="/dashboard/design-studio" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">08</span>
                <span className="module-status-active">Active</span>
              </div>
              <h3 className="module-title">Design Studio</h3>
              <p className="module-desc">Customize portfolio themes, colors, typography, and section layouts.</p>
            </Link>

            <Link to="/dashboard/publishing" className="module-item module-item--active">
              <div className="module-header">
                <span className="module-num">09</span>
                <span className="module-status-active">{isPublished ? 'Published' : 'Draft'}</span>
              </div>
              <h3 className="module-title">Portfolio Publishing</h3>
              <p className="module-desc">Preview your portfolio, publish or unpublish, and share your public URL.</p>
            </Link>
          </div>
        </div>

        {/* Flagship Reference Banner */}
        <div className="dash-demo-banner">
          <div className="demo-banner-content">
            <span className="demo-tag">EDITORIAL BENCHMARK</span>
            <h3 className="demo-title">KOWSTHUBHA Flagship Portfolio</h3>
            <p className="demo-desc">
              Review how a completed Modern Editorial portfolio renders across desktop and mobile devices.
            </p>
          </div>
          <Link to="/p/kowsthuba" className="btn-view-demo">
            Explore Flagship Demo
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
