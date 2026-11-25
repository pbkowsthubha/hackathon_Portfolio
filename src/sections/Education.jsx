import portfolioData from '../data/portfolioData'
import './Education.css'

export default function Education() {
  const { education } = portfolioData

  return (
    <section id="education" className="education-section" aria-label="Education History">
      <div className="education-container">
        {/* Section Header */}
        <header className="education-header">
          <div className="education-label-badge">
            <span className="education-label-dot" aria-hidden="true" />
            <span className="education-label-text">{education.sectionLabel}</span>
          </div>
          <h2 className="education-heading">{education.heading}</h2>
        </header>

        {/* Editorial Timeline */}
        <div className="education-timeline">
          {education.entries.map((entry) => (
            <article key={entry.id} className="timeline-item">
              {/* Timeline Track Node */}
              <div className="timeline-track" aria-hidden="true">
                <span className="timeline-node" />
                <span className="timeline-line" />
              </div>

              {/* Education Content Card */}
              <div className="timeline-card">
                <div className="timeline-card-header">
                  <div className="card-primary-info">
                    <span className="education-degree">{entry.degree}</span>
                    <span className="education-status-tag">{entry.timingBadge}</span>
                  </div>
                  <span className="education-marker" aria-hidden="true">■</span>
                </div>

                <div className="education-department">
                  {entry.department}
                </div>

                <div className="education-meta-grid">
                  <div className="meta-block">
                    <span className="meta-label">ACADEMIC STANDING</span>
                    <span className="meta-val">{entry.status}</span>
                  </div>

                  {entry.institution && (
                    <div className="meta-block">
                      <span className="meta-label">INSTITUTION</span>
                      <span className="meta-val">{entry.institution}</span>
                    </div>
                  )}

                  {entry.startYear && (
                    <div className="meta-block">
                      <span className="meta-label">DURATION</span>
                      <span className="meta-val">
                        {entry.startYear} – {entry.expectedGraduation || 'Present'}
                      </span>
                    </div>
                  )}
                </div>

                {entry.focusAreas && (
                  <p className="education-focus">
                    {entry.focusAreas}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
