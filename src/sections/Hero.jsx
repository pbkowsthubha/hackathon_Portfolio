import { useState } from 'react'
import portfolioData from '../data/portfolioData'
import './Hero.css'

export default function Hero() {
  const { personalInfo, hero } = portfolioData
  const [imageError, setImageError] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const scrollToAbout = (e) => {
    e.preventDefault()
    const target = document.querySelector(hero.ctaTarget)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="hero-section" aria-label="Hero Introduction">
      <div className="hero-container">
        {/* Left Column: Editorial Content */}
        <div className="hero-content">
          {/* Small Editorial Header Label */}
          <div className="hero-editorial-label">
            <span className="editorial-dot" aria-hidden="true" />
            <span className="editorial-text">{hero.editorialLabel}</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-headline">
            {hero.headline}
          </h1>

          {/* Intro & Academic Descriptions */}
          <div className="hero-bio">
            <p className="hero-greeting">
              {hero.greeting}
            </p>
            <p className="hero-description">
              {hero.professionalDescription}
            </p>
            <p className="hero-supporting">
              {hero.supportingDescription}
            </p>
          </div>

          {/* Primary Action CTA */}
          <div className="hero-actions">
            <a
              href={hero.ctaTarget}
              className="hero-cta-btn"
              onClick={scrollToAbout}
            >
              <span>{hero.ctaText}</span>
              <svg
                className="cta-arrow"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M8 3.33334V12.6667M8 12.6667L12.6667 8.00001M8 12.6667L3.33333 8.00001"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Right Column: Profile Image & Academic Metadata */}
        <div className="hero-visual">
          <div className="hero-frame-wrapper">
            {/* Editorial Caption Tag */}
            <div className="hero-frame-header">
              <span className="frame-caption">{hero.imageCaption}</span>
              <span className="frame-marker" aria-hidden="true">■</span>
            </div>

            {/* Image Frame Container */}
            <div className="hero-image-frame">
              {personalInfo.profilePhoto && !imageError ? (
                <img
                  src={personalInfo.profilePhoto}
                  alt={`Portrait of ${personalInfo.name} - ${personalInfo.professionalIdentity}`}
                  className="hero-profile-image"
                  onError={handleImageError}
                  loading="eager"
                />
              ) : (
                /* Fallback Typography Monogram Placeholder */
                <div className="hero-placeholder" aria-label="Profile image placeholder">
                  <span className="placeholder-monogram">K</span>
                  <span className="placeholder-label">{personalInfo.name}</span>
                </div>
              )}
            </div>

            {/* Academic Metadata Card */}
            <div className="hero-academic-meta" aria-label="Academic Details">
              {hero.academicMetadata.map((item, index) => (
                <div key={index} className="meta-row">
                  <span className="meta-bullet" aria-hidden="true">/</span>
                  <span className="meta-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Indicator */}
      <div className="hero-scroll-indicator">
        <a
          href={hero.ctaTarget}
          onClick={scrollToAbout}
          className="scroll-link"
          aria-label="Scroll down to About section"
        >
          <span className="scroll-label">SCROLL</span>
          <span className="scroll-line" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
