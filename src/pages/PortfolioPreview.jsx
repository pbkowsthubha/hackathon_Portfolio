import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { portfolioService } from '../services/portfolioService'
import PortfolioRenderer from '../components/portfolio/PortfolioRenderer'

/**
 * Authenticated Owner-Only Portfolio Preview (/preview/:username)
 * Allows creators to inspect their draft or published portfolio with their
 * Design Studio theme without publishing or mutating saved data.
 */
export default function PortfolioPreview() {
  const { username } = useParams()
  const { user } = useAuth()

  const cleanTarget = (username || '').trim().toLowerCase()
  const cleanCurrent = (user?.username || '').trim().toLowerCase()
  const isAuthorized = Boolean(user && (user.role === 'admin' || cleanCurrent === cleanTarget))

  if (!isAuthorized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#ef4444', fontWeight: 700 }}>
          403 / PREVIEW RESTRICTED
        </span>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: '1rem 0' }}>
          Only the portfolio owner can preview this draft
        </h1>
        <Link to="/dashboard" className="btn-hero-primary">
          Return to My Dashboard
        </Link>
      </div>
    )
  }

  const portfolioRes = portfolioService.getPortfolioByUsername(cleanTarget)
  if (!portfolioRes || !portfolioRes.data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', margin: '1rem 0' }}>
          Portfolio not found
        </h1>
        <Link to="/dashboard" className="btn-hero-primary">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  const pubStatus = portfolioService.getPublicationStatus(cleanTarget)
  const isPublished = pubStatus.status === 'published'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          backgroundColor: '#171717',
          color: '#F6F5F0',
          padding: '10px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#60A5FA', fontWeight: 700 }}>OWNER PREVIEW</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>
            Status: <strong>{isPublished ? 'PUBLISHED' : 'DRAFT (Not publicly visible)'}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/dashboard/design-studio" style={{ color: '#F6F5F0', textDecoration: 'underline' }}>
            Design Studio
          </Link>
          <Link to="/dashboard/publishing" style={{ color: '#60A5FA', textDecoration: 'underline', fontWeight: 700 }}>
            ← Back to Publishing
          </Link>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <PortfolioRenderer portfolio={portfolioRes.data} isPreview />
      </div>
    </div>
  )
}
