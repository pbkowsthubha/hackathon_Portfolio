import { Component } from 'react'

/**
 * React Error Boundary for route-level isolation.
 * Prevents a single failed page from crashing the entire application,
 * never resets localStorage data, and hides internal stack traces in production.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error(`[ErrorBoundary:${this.props.scope || 'App'}]`, error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const {
      scope = 'this page',
      homeTo = '/',
      homeLabel = 'Return Home',
    } = this.props

    return (
      <div
        role="alert"
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: 'var(--color-surface-secondary, #E9E7DF)',
            border: '1px solid var(--color-border, #D9D7CE)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#dc2626',
            }}
          >
            RECOVERY MODE
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '1.5rem',
              margin: 0,
            }}
          >
            Unable to display {scope}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: '0.9375rem',
              color: 'var(--color-text-secondary, #656565)',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            An unexpected rendering error occurred. Your saved portfolios, drafts, and account
            records have not been modified.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '4px',
                backgroundColor: 'var(--color-accent, #315BEA)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
            <a
              href={homeTo}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '4px',
                border: '1px solid var(--color-border, #D9D7CE)',
                backgroundColor: 'var(--color-bg, #F6F5F0)',
                color: 'var(--color-text-primary, #171717)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {homeLabel}
            </a>
          </div>
        </div>
      </div>
    )
  }
}
