import { useState } from 'react'
import portfolioData from '../data/portfolioData'
import './Contact.css'

export default function Contact() {
  const { contact } = portfolioData

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const [errors, setErrors] = useState({})
  const [validationSuccess, setValidationSuccess] = useState(false)

  const validate = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required.'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message content cannot be empty.'
    }

    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
    if (validationSuccess) {
      setValidationSuccess(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const formErrors = validate()

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      setValidationSuccess(false)
    } else {
      setErrors({})
      setValidationSuccess(true)
    }
  }

  const handleReset = () => {
    setFormData({ name: '', email: '', message: '' })
    setErrors({})
    setValidationSuccess(false)
  }

  return (
    <section id="contact" className="contact-section" aria-label="Contact Section">
      <div className="contact-container">
        {/* Section Header */}
        <header className="contact-header">
          <div className="contact-label-badge">
            <span className="contact-label-dot" aria-hidden="true" />
            <span className="contact-label-text">{contact.sectionLabel}</span>
          </div>
          <h2 className="contact-heading">{contact.heading}</h2>
          <p className="contact-supporting">{contact.description}</p>
        </header>

        {/* Contact Content Grid */}
        <div className="contact-grid">
          {/* Left Column: Context & Communications Info */}
          <div className="contact-info-col">
            <div className="contact-info-card">
              <div className="info-card-header">
                <span className="info-title">COMMUNICATION CHANNELS</span>
                <span className="info-marker" aria-hidden="true">■</span>
              </div>

              <div className="info-identity">
                <span className="identity-name">{portfolioData.personalInfo.name}</span>
                <span className="identity-title">{portfolioData.personalInfo.professionalIdentity}</span>
              </div>

              <p className="info-availability">
                Open for academic discussions, engineering inquiries, and collaborative learning opportunities.
              </p>

              {/* Conditional Email Action - rendered only if genuine email is present */}
              {contact.email ? (
                <div className="direct-email-block">
                  <span className="email-label">DIRECT EMAIL</span>
                  <a href={`mailto:${contact.email}`} className="email-link">
                    {contact.email}
                  </a>
                </div>
              ) : (
                <div className="channel-note-block">
                  <span className="channel-note-tag">STATUS</span>
                  <p className="channel-note-text">
                    Direct email and external messaging handles will be posted upon verification.
                  </p>
                </div>
              )}

              {/* Conditional Social Links - rendered only if genuine socials exist */}
              {contact.socials && contact.socials.length > 0 && (
                <div className="socials-block">
                  <span className="socials-label">PROFILES</span>
                  <div className="socials-links-list">
                    {contact.socials.map((social, sIdx) => (
                      <a
                        key={sIdx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-pill"
                      >
                        {social.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Honest Contact Form with Validation */}
          <div className="contact-form-col">
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="form-disclaimer-badge">
                <span className="disclaimer-dot" aria-hidden="true" />
                <span>CLIENT-SIDE VALIDATION ONLY · NO BACKEND CONNECTED</span>
              </div>

              {/* Name Field */}
              <div className={`form-group ${errors.name ? 'form-group--error' : ''}`}>
                <label htmlFor="contact-name" className="form-label">
                  Full Name <span className="required-star">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Smith"
                  className="form-input"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <span id="name-error" className="form-error-msg" role="alert">
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Email Field */}
              <div className={`form-group ${errors.email ? 'form-group--error' : ''}`}>
                <label htmlFor="contact-email" className="form-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="form-input"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && (
                  <span id="email-error" className="form-error-msg" role="alert">
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Message Field */}
              <div className={`form-group ${errors.message ? 'form-group--error' : ''}`}>
                <label htmlFor="contact-message" className="form-label">
                  Message <span className="required-star">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter your message here..."
                  className="form-textarea"
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                />
                {errors.message && (
                  <span id="message-error" className="form-error-msg" role="alert">
                    {errors.message}
                  </span>
                )}
              </div>

              {/* Validation Success Feedback */}
              {validationSuccess && (
                <div className="validation-feedback-box" role="status">
                  <div className="feedback-header">
                    <span className="feedback-badge">VALIDATION SUCCESS</span>
                  </div>
                  <p className="feedback-message">
                    Your details are valid, but message delivery has not been configured yet.
                  </p>
                  <button
                    type="button"
                    className="feedback-reset-btn"
                    onClick={handleReset}
                  >
                    Reset Form
                  </button>
                </div>
              )}

              {/* Action Button: Honestly labeled Validate Message */}
              <button type="submit" className="contact-submit-btn">
                <span>Validate Message</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M13.3334 4L6.00008 11.3333L2.66675 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
