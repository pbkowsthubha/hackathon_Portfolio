import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim() || !password) {
      setError('Please provide both your email/username and password.')
      return
    }

    setLoading(true)
    try {
      const user = await login(identifier, password)
      let destination = user.role === 'admin' ? '/admin' : '/dashboard'
      if (location.state?.from?.pathname) {
        if (user.role === 'admin' && location.state.from.pathname.startsWith('/admin')) {
          destination = location.state.from.pathname
        } else if (user.role === 'creator' && !location.state.from.pathname.startsWith('/admin')) {
          destination = location.state.from.pathname
        }
      }
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to log in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <span>PORTFOLIO STUDIO</span>
          <span className="brand-dot">.</span>
        </Link>
        <Link to="/" className="auth-back-home">
          <span aria-hidden="true">←</span>
          <span>Back to Home</span>
        </Link>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-tag">ACCOUNT ACCESS</span>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to manage and edit your portfolio.</p>
          </div>

          <div className="auth-disclaimer-box" role="note">
            <span className="disclaimer-title">PROTOTYPE DISCLAIMER</span>
            <p className="disclaimer-text">
              Demo authentication only. Your account is stored in this browser's localStorage and is not secured by a backend.
            </p>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-identifier" className="form-label">Email address or Username</label>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="login-password" className="form-label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="toggle-pwd-btn"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="form-input"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-auth-submit">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-card-footer">
            <span>Don't have an account yet? </span>
            <Link to="/signup" className="auth-link">Create your portfolio</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
