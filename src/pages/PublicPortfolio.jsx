import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../sections/Hero'
import About from '../sections/About'
import Skills from '../sections/Skills'
import Projects from '../sections/Projects'
import Education from '../sections/Education'
import Achievements from '../sections/Achievements'
import Contact from '../sections/Contact'
import Footer from '../components/Footer'
import PortfolioRenderer from '../components/portfolio/PortfolioRenderer'
import { useAuth } from '../context/useAuth'
import { authService } from '../services/authService'
import { portfolioService } from '../services/portfolioService'

const APPROVED_ADMIN_RETURN_PATHS = {
  '/admin/users': '/admin/users',
  'admin-users': '/admin/users',
}

function getSafeAdminReturnPath(user, location) {
  const liveSession = authService.getCurrentUser()
  const isVerifiedAdmin = Boolean(
    user && user.role === 'admin' && liveSession && liveSession.role === 'admin'
  )
  if (!isVerifiedAdmin) return null

  if (location.state?.fromAdminUsers === true) {
    const stateTarget = APPROVED_ADMIN_RETURN_PATHS[location.state.adminReturnTo]
    if (stateTarget) return stateTarget
  }

  const params = new URLSearchParams(location.search)
  const fromParam = params.get('from')
  if (fromParam && APPROVED_ADMIN_RETURN_PATHS[fromParam]) {
    return APPROVED_ADMIN_RETURN_PATHS[fromParam]
  }

  return null
}

export default function PublicPortfolio() {
  const { username = 'kowsthuba' } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const portfolio = portfolioService.getPortfolioByUsername(username)
  const adminReturnPath = getSafeAdminReturnPath(user, location)

  // Flagship Kowsthuba Demo Portfolio
  if (username.toLowerCase() === 'kowsthuba' || portfolio?.isDemo) {
    return (
      <div className="portfolio-wrapper">
        {/* Subtle Platform Return Banner */}
        <div style={{
          backgroundColor: '#171717',
          color: '#F6F5F0',
          padding: '8px 16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          position: 'relative',
          zIndex: 1100,
        }}>
          <div>
            <span style={{ color: '#315BEA', fontWeight: 700 }}>PORTFOLIO STUDIO DEMO</span>
            <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>
            <span>Viewing Flagship Portfolio: <strong>KOWSTHUBHA</strong></span>
          </div>
          <Link
            to="/"
            style={{
              color: '#315BEA',
              textDecoration: 'underline',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Back to Platform Studio
          </Link>
        </div>

        {/* Complete Existing Kowsthuba Portfolio in Exact Hierarchy */}
        <Navbar />
        <main>
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Education />
          <Achievements />
          <Contact />
        </main>
        <Footer />
      </div>
    )
  }

  // Custom User Portfolio Found — Enforce Publication Access Control
  if (portfolio && !portfolio.isDemo) {
    const isPublished = portfolioService.isPortfolioPublished(username)
    if (isPublished) {
      return (
        <div>
          {adminReturnPath && (
            <div
              style={{
                backgroundColor: '#F6F5F0',
                borderBottom: '1px solid #D9D7CE',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#171717',
              }}
            >
              <button
                type="button"
                onClick={() => navigate(adminReturnPath)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9D7CE',
                  borderRadius: '4px',
                  color: '#171717',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Back to User Management
              </button>
              <span style={{ color: '#656565', fontSize: '0.7rem' }}>
                ADMIN INSPECTION · @{username.toLowerCase()}
              </span>
            </div>
          )}
          <PortfolioRenderer portfolio={portfolio.data} />
        </div>
      )
    }

    const isOwner = Boolean(
      user?.username && user.username.trim().toLowerCase() === username.trim().toLowerCase()
    )

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#b45309', fontWeight: 700, letterSpacing: '0.1em' }}>
          DRAFT / PORTFOLIO NOT PUBLISHED
        </span>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', margin: '1rem 0' }}>
          This portfolio is not published yet
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', maxWidth: '480px', marginBottom: '2rem', lineHeight: 1.6 }}>
          The creator is currently preparing this portfolio in draft mode. Private portfolio content is not publicly visible until published.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {isOwner ? (
            <>
              <Link to={`/preview/${username}`} className="btn-hero-primary">
                Preview My Draft
              </Link>
              <Link to="/dashboard/publishing" className="btn-hero-secondary">
                Manage Publishing
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="btn-hero-primary">
                Platform Home
              </Link>
              <Link to="/p/kowsthuba" className="btn-hero-secondary">
                Explore Kowsthuba Demo
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  // Portfolio Not Found
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
        404 / PORTFOLIO NOT FOUND
      </span>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', margin: '1rem 0' }}>
        No portfolio exists at /p/{username}
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', maxWidth: '460px', marginBottom: '2rem' }}>
        The requested portfolio username does not exist or has not been published yet.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn-hero-primary">
          Platform Home
        </Link>
        <Link to="/p/kowsthuba" className="btn-hero-secondary">
          Explore Kowsthuba Demo
        </Link>
      </div>
    </div>
  )
}
