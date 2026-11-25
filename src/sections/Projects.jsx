import portfolioData from '../data/portfolioData'
import './Projects.css'

export default function Projects() {
  const { projectsSection, projects } = portfolioData
  const hasProjects = projects && projects.length > 0

  return (
    <section id="projects" className="projects-section" aria-label="Selected Projects">
      <div className="projects-container">
        {/* Section Header */}
        <header className="projects-header">
          <div className="projects-label-badge">
            <span className="projects-label-dot" aria-hidden="true" />
            <span className="projects-label-text">{projectsSection.sectionLabel}</span>
          </div>
          <h2 className="projects-heading">{projectsSection.heading}</h2>
          <p className="projects-supporting">{projectsSection.supportingDescription}</p>
        </header>

        {/* Content View: Data-Driven Projects Showcase or Editorial Empty State */}
        {hasProjects ? (
          <div className="projects-grid">
            {projects.map((project, index) => {
              const isFeatured = index === 0 && projects.length > 1
              return (
                <article
                  key={project.id || index}
                  className={`project-card ${isFeatured ? 'project-card--featured' : ''}`}
                >
                  {project.image && (
                    <div className="project-thumbnail-wrapper">
                      <img
                        src={project.image}
                        alt={`Screenshot of ${project.title}`}
                        className="project-thumbnail"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="project-body">
                    <div className="project-meta-top">
                      <span className="project-number">0{index + 1}</span>
                      {project.category && (
                        <span className="project-category">{project.category}</span>
                      )}
                    </div>

                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-description">{project.description}</p>

                    {project.technologies && project.technologies.length > 0 && (
                      <ul className="project-tech-list" aria-label="Technologies used">
                        {project.technologies.map((tech, tIdx) => (
                          <li key={tIdx} className="tech-badge">
                            {tech}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Action Links - Only rendered if real URLs are provided */}
                    {(project.githubUrl || project.liveUrl) && (
                      <div className="project-actions">
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link project-link--github"
                            aria-label={`View ${project.title} source code on GitHub`}
                          >
                            <span>Source Code</span>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M6 3L11 3M11 3L11 8M11 3L3 11"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        )}

                        {project.liveUrl && (
                          <a
                            href={project.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link project-link--live"
                            aria-label={`View live demo of ${project.title}`}
                          >
                            <span>Live Demo</span>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M6 3L11 3M11 3L11 8M11 3L3 11"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          /* Sophisticated Editorial Empty State with Audited Generic Lifecycle */
          <div className="projects-empty-canvas" role="region" aria-label="Project Archive Status">
            <div className="empty-canvas-header">
              <div className="canvas-header-left">
                <span className="canvas-status-badge">
                  {projectsSection.emptyState.badge}
                </span>
                <span className="canvas-subtitle">ACADEMIC & PERSONAL INITIATIVES</span>
              </div>
              <span className="canvas-marker" aria-hidden="true">■</span>
            </div>

            <div className="empty-canvas-body">
              <h3 className="empty-canvas-heading">
                {projectsSection.emptyState.heading}
              </h3>
              <p className="empty-canvas-description">
                {projectsSection.emptyState.description}
              </p>
            </div>

            {/* Audited Generic Lifecycle Illustration */}
            <div className="workflow-wrapper">
              <div className="workflow-intro-label">
                <span className="workflow-intro-dot" aria-hidden="true" />
                <span>Typical project lifecycle</span>
              </div>

              <div className="empty-workflow-grid" aria-hidden="true">
                <div className="workflow-card">
                  <div className="workflow-step-num">STAGE / 01</div>
                  <div className="workflow-step-title">Problem Discovery</div>
                  <p className="workflow-step-desc">Identifying real-world engineering challenges & use cases.</p>
                  <div className="workflow-status-tag">Phase I / Concept</div>
                </div>

                <div className="workflow-card">
                  <div className="workflow-step-num">STAGE / 02</div>
                  <div className="workflow-step-title">Architecture & Build</div>
                  <p className="workflow-step-desc">Iterative engineering, algorithmic rigor & clean code.</p>
                  <div className="workflow-status-tag">Phase II / Architecture</div>
                </div>

                <div className="workflow-card">
                  <div className="workflow-step-num">STAGE / 03</div>
                  <div className="workflow-step-title">Deployment & Review</div>
                  <p className="workflow-step-desc">Testing, documentation & production release.</p>
                  <div className="workflow-status-tag">Phase III / Review</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
