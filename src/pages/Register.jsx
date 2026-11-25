import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { storageService, STORAGE_KEYS } from '../services/storageService'
import './Login.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const platformSettings = storageService.get(STORAGE_KEYS.SETTINGS, {})
  const registrationDisabled = platformSettings?.registrationEnabled === false

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required.'
    }

    if (!formData.username.trim()) {
      errs.username = 'Username is required.'
    } else if (!usernameRegex.test(formData.username.trim())) {
      errs.username = 'Username must be 3-20 characters (letters, numbers, underscores, hyphens).'
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.'
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email format.'
    }

    if (!formData.password) {
      errs.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.'
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }

    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const validationErrors = validate()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      await register({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setServerError(err.message || 'Registration failed.')
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
            <span className="auth-tag">START BUILDING</span>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Join as a creator to begin building your distinctive portfolio.</p>
          </div>

          <div className="auth-disclaimer-box" role="note">
            <span className="disclaimer-title">PROTOTYPE DISCLAIMER</span>
            <p className="disclaimer-text">
              Demo authentication only. Your account is stored in this browser's localStorage and is not secured by a backend.
            </p>
          </div>

          {registrationDisabled && (
            <div className="auth-error-banner" role="alert">
              New creator registration is currently disabled by the platform administrator. Existing creators can still sign in.
            </div>
          )}

          {serverError && (
            <div className="auth-error-banner" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="reg-fullname" className="form-label">Full Name</label>
              <input
                id="reg-fullname"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Alex Smith"
                className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                aria-invalid={Boolean(errors.fullName)}
                required
              />
              {errors.fullName && <span className="form-error-msg">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-username" className="form-label">Username (Portfolio URL handle)</label>
              <input
                id="reg-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g. alexsmith"
                className={`form-input ${errors.username ? 'input-error' : ''}`}
                aria-invalid={Boolean(errors.username)}
                required
              />
              {errors.username && <span className="form-error-msg">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email Address</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                aria-invalid={Boolean(errors.email)}
                required
              />
              {errors.email && <span className="form-error-msg">{errors.email}</span>}
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="reg-password" className="form-label">Password (Min. 8 characters)</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="toggle-pwd-btn"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                aria-invalid={Boolean(errors.password)}
                required
              />
              {errors.password && <span className="form-error-msg">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                aria-invalid={Boolean(errors.confirmPassword)}
                required
              />
              {errors.confirmPassword && <span className="form-error-msg">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" disabled={loading || registrationDisabled} className="btn-auth-submit">
              {registrationDisabled ? 'Registration Disabled' : loading ? 'Creating Account...' : 'Create Creator Account'}
            </button>
          </form>

          <div className="auth-card-footer">
            <span>Already have an account? </span>
            <Link to="/login" className="auth-link">Sign in here</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
