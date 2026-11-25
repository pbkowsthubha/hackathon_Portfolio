import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './PlatformHome.css'

export default function PlatformHome() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSwitchAccount = () => {
    logout()
    navigate('/login')
  }

  const platformFeatures = [
    {
      num: '01',
      title: 'Personal Profile',
      desc: 'Craft an art-directed biography, verified academic background, and distinctive personal branding.',
    },
    {
      num: '02',
      title: 'Project Showcase',
      desc: 'Highlight software, design, or engineering initiatives with rich media, tech stacks, and live links.',
    },
    {
      num: '03',
      title: 'Skills & Education',
      desc: 'Structured technical tool categorization and academic timelines verified against your actual progress.',
    },
    {
      num: '04',
      title: 'Blog Publishing',
      desc: 'Share architectural insights, development notes, and engineering journals directly from your domain.',
    },
    {
      num: '05',
      title: 'Customizable Templates',
      desc: 'Built on Swiss editorial aesthetics, modern typography, and structured magazine layouts.',
    },
    {
      num: '06',
      title: 'Portfolio Sharing',
      desc: 'Instantly share a clean, high-performance public URL with recruiters, peers, and collaborators.',
    },
  ]

  return (
    <div className="platform-page">
      {/* Platform Navigation */}
      <header className="platform-nav">
        <div className="platform-nav-container">
          <Link to="/" className="platform-brand">
            <span className="brand-text">PORTFOLIO STUDIO</span>
            <span className="brand-dot" aria-hidden="true">.</span>
          </Link>

          <nav className="platform-links" aria-label="Platform Navigation">
            <Link to="/" className="nav-item">Home</Link>
            <Link to="/p/kowsthuba" className="nav-item">Explore Demo</Link>
            {user ? (
              <>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="nav-item nav-action-btn"
                >
                  Login / Switch Account
                </button>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="nav-btn-primary">
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="nav-item nav-action-btn nav-action-btn--muted"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-item">Login</Link>
                <Link to="/login" className="nav-item nav-item--admin">Admin</Link>
                <Link to="/signup" className="nav-btn-primary">
                  Create My Portfolio
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="platform-hero">
        <div className="platform-hero-container">
          <div className="hero-text-col">
            <div className="platform-label-badge">
              <span className="badge-dot" aria-hidden="true" />
              <span>CREATE YOUR DIGITAL IDENTITY</span>
            </div>

            <h1 className="platform-hero-title">
              Your work deserves a better showcase.
            </h1>

            <p className="platform-hero-desc">
              Build a professional portfolio that tells your story, presents your projects and helps the world discover your work.
            </p>

            <div className="platform-hero-actions">
              <Link to="/signup" className="btn-hero-primary">
                <span>Create My Portfolio</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3.33337 8H12.6667M12.6667 8L8.00004 3.33334M12.6667 8L8.00004 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link to="/p/kowsthuba" className="btn-hero-secondary">
                <span>Explore Demo Portfolio</span>
              </Link>
            </div>

            <div className="platform-audience-bar">
              <span className="audience-label">CRAFTED FOR:</span>
              <span className="audience-pills">Students · Engineers · Designers · Researchers · Creators</span>
            </div>
          </div>

          {/* Editorial Visual Preview of a Portfolio */}
          <div className="hero-visual-col" aria-hidden="true">
            <div className="preview-editorial-window">
              <div className="preview-window-bar">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="preview-url-bar">portfoliostudio.local/p/kowsthuba</span>
              </div>
              <div className="preview-window-content">
                <div className="preview-header-mock">
                  <span className="preview-logo-mock">KOWSTHUBHA.</span>
                  <div className="preview-nav-mock">
                    <span>About</span>
                    <span>Work</span>
                    <span>Contact</span>
                  </div>
                </div>
                <div className="preview-body-mock">
                  <div className="preview-editorial-badge">01 / FEATURED</div>
                  <div className="preview-headline-mock">A journey into the world of computer science.</div>
                  <div className="preview-meta-mock">
                    <span className="meta-tag-mock">B.TECH CSE</span>
                    <span className="meta-tag-mock">SECOND YEAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="platform-features">
        <div className="features-container">
          <div className="features-header">
            <div className="platform-label-badge">
              <span className="badge-dot" aria-hidden="true" />
              <span>CORE CAPABILITIES</span>
            </div>
            <h2 className="features-title">Designed for distinction, built for clarity.</h2>
            <p className="features-subtitle">
              Every tool you need to build, curate, and share a world-class personal portfolio.
            </p>
          </div>

          <div className="features-grid">
            {platformFeatures.map((feat) => (
              <div key={feat.num} className="feature-card">
                <span className="feature-number">{feat.num}</span>
                <h3 className="feature-card-title">{feat.title}</h3>
                <p className="feature-card-desc">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="platform-cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h2 className="cta-title">Start building your distinctive portfolio today.</h2>
            <p className="cta-desc">
              Experience the Modern Editorial design system. No external setup required.
            </p>
            <div className="cta-actions">
              <Link to="/signup" className="btn-hero-primary">
                Get Started Free
              </Link>
              <Link to="/p/kowsthuba" className="btn-hero-secondary">
                View Live Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Footer */}
      <footer className="platform-footer">
        <div className="platform-footer-container">
          <div className="platform-footer-left">
            <span className="footer-brand-title">PORTFOLIO STUDIO.</span>
            <p className="footer-tagline">Your identity. Your work. Your portfolio.</p>
          </div>
          <div className="platform-footer-right">
            <span>© 2026 Portfolio Studio. Demonstration Hackathon Platform.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
