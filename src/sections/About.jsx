import portfolioData from '../data/portfolioData'
import './About.css'

export default function About() {
  const { about } = portfolioData

  return (
    <section id="about" className="about-section" aria-label="About Me">
      <div className="about-container">
        {/* Section Header */}
        <header className="about-header">
          <div className="about-label-badge">
            <span className="about-label-dot" aria-hidden="true" />
            <span className="about-label-text">{about.sectionLabel}</span>
          </div>
          <h2 className="about-heading">{about.heading}</h2>
        </header>

        {/* Editorial Content Grid */}
        <div className="about-grid">
          {/* Narrative Column */}
          <div className="about-narrative">
            <div className="narrative-accent-bar" aria-hidden="true" />
            <div className="narrative-content">
              <p className="narrative-lead">{about.introduction}</p>
              <p className="narrative-supporting">{about.supportingContent}</p>
            </div>
          </div>

          {/* Academic Snapshot Card */}
          <aside className="about-academic-card" aria-label="Academic Information">
            <div className="academic-card-header">
              <div className="card-header-titles">
                <span className="card-title">{about.academicPanel.title}</span>
                <span className="card-subtitle">{about.academicPanel.subtitle}</span>
              </div>
              <span className="card-marker" aria-hidden="true">■</span>
            </div>

            <dl className="academic-list">
              {about.academicPanel.details.map((item, index) => (
                <div key={index} className="academic-item">
                  <dt className="academic-term">{item.label}</dt>
                  <dd className="academic-description">{item.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </section>
  )
}
