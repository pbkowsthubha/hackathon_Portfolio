import portfolioData from '../data/portfolioData'
import './Achievements.css'

export default function Achievements() {
  const { achievementsSection } = portfolioData
  const { achievements, certifications } = achievementsSection

  const hasAchievements = achievements.items && achievements.items.length > 0
  const hasCertifications = certifications.items && certifications.items.length > 0

  return (
    <section id="achievements" className="achievements-section" aria-label="Achievements and Certifications">
      <div className="achievements-container">
        {/* Section Header */}
        <header className="achievements-header">
          <div className="achievements-label-badge">
            <span className="achievements-label-dot" aria-hidden="true" />
            <span className="achievements-label-text">{achievementsSection.sectionLabel}</span>
          </div>
          <h2 className="achievements-heading">{achievementsSection.heading}</h2>
        </header>

        {/* Two-Column Editorial Group */}
        <div className="achievements-grid">
          {/* Group A: Achievements */}
          <div className="achievement-group">
            <div className="group-header">
              <h3 className="group-title">{achievements.title}</h3>
              <span className="group-count">0{achievements.items.length}</span>
            </div>

            {hasAchievements ? (
              <div className="items-list">
                {achievements.items.map((item, idx) => (
                  <article key={idx} className="achievement-card">
                    <h4 className="item-title">{item.title}</h4>
                    <p className="item-description">{item.description}</p>
                    <div className="item-meta">
                      {item.issuer && <span className="item-issuer">{item.issuer}</span>}
                      {item.date && <span className="item-date">{item.date}</span>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="editorial-empty-card" role="region" aria-label="Achievements status">
                <div className="empty-badge">VERIFICATION PENDING</div>
                <p className="empty-text">{achievements.emptyMessage}</p>
              </div>
            )}
          </div>

          {/* Group B: Certifications */}
          <div className="achievement-group">
            <div className="group-header">
              <h3 className="group-title">{certifications.title}</h3>
              <span className="group-count">0{certifications.items.length}</span>
            </div>

            {hasCertifications ? (
              <div className="items-list">
                {certifications.items.map((cert, idx) => (
                  <article key={idx} className="achievement-card">
                    <h4 className="item-title">{cert.name}</h4>
                    <div className="item-meta">
                      {cert.issuer && <span className="item-issuer">{cert.issuer}</span>}
                      {cert.issueDate && <span className="item-date">{cert.issueDate}</span>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="editorial-empty-card" role="region" aria-label="Certifications status">
                <div className="empty-badge">CREDENTIALS PENDING</div>
                <p className="empty-text">{certifications.emptyMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
