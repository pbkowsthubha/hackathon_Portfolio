import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
        404 / PAGE NOT FOUND
      </span>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', margin: '1rem 0' }}>
        The page you are looking for does not exist.
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', maxWidth: '460px', marginBottom: '2rem' }}>
        Please check the URL or navigate back to the Portfolio Studio platform home.
      </p>
      <Link to="/" style={{
        display: 'inline-flex',
        padding: '0.75rem 1.5rem',
        backgroundColor: 'var(--color-accent)',
        color: '#FFFFFF',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
      }}>
        Return to Platform Home
      </Link>
    </div>
  )
}
