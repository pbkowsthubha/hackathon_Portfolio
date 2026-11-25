import portfolioData from '../data/portfolioData'
import './Skills.css'

export default function Skills() {
  const { skills } = portfolioData

  const hasAnySkills = skills.categories.some(
    (category) => category.items && category.items.length > 0
  )

  return (
    <section id="skills" className="skills-section" aria-label="Technical Skills">
      <div className="skills-container">
        {/* Section Header */}
        <header className="skills-header">
          <div className="skills-label-badge">
            <span className="skills-label-dot" aria-hidden="true" />
            <span className="skills-label-text">{skills.sectionLabel}</span>
          </div>
          <h2 className="skills-heading">{skills.heading}</h2>
        </header>

        {/* Intentional Editorial Status Banner (shown when profile is awaiting skills) */}
        {!hasAnySkills && (
          <div className="skills-status-banner" role="status">
            <div className="status-indicator">
              <span className="status-ping" aria-hidden="true" />
              <span className="status-dot" aria-hidden="true" />
            </div>
            <p className="status-message">{skills.emptyStateMessage}</p>
          </div>
        )}

        {/* Category Grid: Data-Driven architecture */}
        <div className="skills-grid">
          {skills.categories.map((category, index) => {
            const hasItems = category.items && category.items.length > 0

            return (
              <div key={category.id} className="skill-category-card">
                <div className="category-card-header">
                  <span className="category-number">0{index + 1}</span>
                  <h3 className="category-title">{category.title}</h3>
                </div>

                <div className="category-content">
                  {hasItems ? (
                    <ul className="skill-tags-list">
                      {category.items.map((skill, sIdx) => (
                        <li key={sIdx} className="skill-tag">
                          {skill}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="category-empty-state">
                      <span className="empty-badge">PROFILE PENDING</span>
                      <span className="empty-description">Verification in progress</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
