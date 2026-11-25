export default function RouteFallback({ label = 'Loading view...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary, #656565)',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
    </div>
  )
}
