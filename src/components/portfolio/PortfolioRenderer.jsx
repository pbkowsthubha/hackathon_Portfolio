import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDefaultDesign, getFontStack, SECTION_LABELS } from '../../data/designThemes'
import './PortfolioRenderer.css'

const RADIUS_MAP = {
  none: '0px',
  sm: '6px',
  md: '12px',
  lg: '20px',
}

const SPACING_MAP = {
  compact: { section: '3rem', gap: '1.25rem' },
  normal: { section: '4.5rem', gap: '1.75rem' },
  spacious: { section: '6rem', gap: '2.25rem' },
}

function getCategoryGlyph(category = '') {
  const lower = category.toLowerCase()
  if (lower.includes('language')) return '</>'
  if (lower.includes('framework') || lower.includes('librar')) return '{ }'
  if (lower.includes('tool') || lower.includes('platform')) return '⚙'
  return '◆'
}

export default function PortfolioRenderer({ portfolio, designOverride = null, isPreview = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')

  const design = designOverride || portfolio?.design || getDefaultDesign('modern-editorial')
  const { colors, typography, components, layout } = design

  const hiddenList = Array.isArray(layout?.hiddenSections) ? layout.hiddenSections : []
  const hiddenSet = new Set(hiddenList)
  const sectionOrder = Array.isArray(layout?.sectionOrder) ? layout.sectionOrder : []
  const sectionOrderKey = sectionOrder.join('|')

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) return undefined
    const orderedIds = sectionOrderKey ? sectionOrderKey.split('|') : []
    const sectionIds = ['pr-home', ...orderedIds.map((s) => `pr-${s}`), 'pr-contact']
    const elements = sectionIds.map((id) => document.getElementById(id)).filter(Boolean)
    if (elements.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible?.target?.id) {
          setActiveSection(visible.target.id.replace(/^pr-/, ''))
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0.05 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sectionOrderKey])

  if (!portfolio) return null

  const profile = portfolio.profile || {}
  const socialLinks = profile.socialLinks || {}
  const displayName = profile.fullName || portfolio.fullName || portfolio.username || 'Creator'
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const projects = Array.isArray(portfolio.projects) ? portfolio.projects : []
  const orderedProjects = [...projects].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  const skills = Array.isArray(portfolio.skills) ? portfolio.skills : []
  const education = Array.isArray(portfolio.education) ? portfolio.education : []
  const achievements = Array.isArray(portfolio.achievements) ? portfolio.achievements : []
  const certifications = Array.isArray(portfolio.certifications) ? portfolio.certifications : []
  const publishedBlogs = (Array.isArray(portfolio.blogPosts) ? portfolio.blogPosts : []).filter(
    (p) => p.status === 'published'
  )

  const spacingTokens = SPACING_MAP[components?.spacing] || SPACING_MAP.normal
  const radiusToken = RADIUS_MAP[components?.borderRadius] ?? RADIUS_MAP.sm

  const cssVars = {
    '--pr-bg': colors?.background || '#F6F5F0',
    '--pr-surface': colors?.secondary || '#E9E7DF',
    '--pr-primary': colors?.primary || '#171717',
    '--pr-text': colors?.text || '#171717',
    '--pr-accent': colors?.accent || '#315BEA',
    '--pr-font-body': getFontStack(typography?.fontFamily),
    '--pr-font-heading': getFontStack(typography?.headingFont),
    '--pr-radius': radiusToken,
    '--pr-section-pad': spacingTokens.section,
    '--pr-gap': spacingTokens.gap,
  }

  const visibleNavSections = sectionOrder.filter((sec) => {
    if (hiddenSet.has(sec)) return false
    if (sec === 'blog' && publishedBlogs.length === 0) return false
    return true
  })

  const skillsByCategory = skills.reduce((acc, sk) => {
    const cat = sk.category || 'Other Skills'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(sk)
    return acc
  }, {})

  const scrollToSection = (e, targetId) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    setActiveSection(targetId.replace(/^pr-/, ''))
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const formatDate = (iso) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const renderSection = (sectionId, orderIdx) => {
    if (hiddenSet.has(sectionId)) return null
    const sectionNum = String(orderIdx + 1).padStart(2, '0')

    switch (sectionId) {
      case 'about':
        return (
          <section key="about" id="pr-about" className="pr-section">
            <div className="pr-section-head">
              <span className="pr-kicker">{sectionNum} / ABOUT</span>
              <h2 className="pr-section-title">About Me</h2>
            </div>
            {profile.about || profile.introduction ? (
              <div className="pr-about-grid">
                <div className="pr-card pr-about-narrative">
                  <p className="pr-about-lead">{profile.about || profile.introduction}</p>
                </div>
                <aside className="pr-card pr-about-facts">
                  <div className="pr-fact-row">
                    <span className="pr-fact-label">Role</span>
                    <span className="pr-fact-val">{profile.professionalTitle || 'Creator & Developer'}</span>
                  </div>
                  {profile.location && (
                    <div className="pr-fact-row">
                      <span className="pr-fact-label">Location</span>
                      <span className="pr-fact-val">{profile.location}</span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="pr-fact-row">
                      <span className="pr-fact-label">Email</span>
                      <a href={`mailto:${profile.email}`} className="pr-inline-link">{profile.email}</a>
                    </div>
                  )}
                  {(socialLinks.github || socialLinks.linkedin || socialLinks.website) && (
                    <div className="pr-fact-row">
                      <span className="pr-fact-label">Profiles</span>
                      <div className="pr-social-chips">
                        {socialLinks.github && (
                          <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="pr-social-chip">GitHub ↗</a>
                        )}
                        {socialLinks.linkedin && (
                          <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="pr-social-chip">LinkedIn ↗</a>
                        )}
                        {socialLinks.website && (
                          <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="pr-social-chip">Website ↗</a>
                        )}
                      </div>
                    </div>
                  )}
                </aside>
              </div>
            ) : (
              <div className="pr-card">
                <p className="pr-empty-note">Creator biography has not been added yet.</p>
              </div>
            )}
          </section>
        )

      case 'projects':
        return (
          <section key="projects" id="pr-projects" className="pr-section">
            <div className="pr-section-head">
              <span className="pr-kicker">{sectionNum} / SELECTED WORK</span>
              <h2 className="pr-section-title">Projects Showcase</h2>
            </div>
            {orderedProjects.length > 0 ? (
              <div className={`pr-projects-layout pr-projects--${layout?.projectLayout || 'grid'}`}>
                {orderedProjects.map((proj, idx) => {
                  const isFeaturedCard =
                    (layout?.projectLayout || 'grid') === 'grid' && idx === 0 && orderedProjects.length > 1
                  return (
                    <article
                      key={proj.id}
                      className={`pr-card pr-project-card ${isFeaturedCard ? 'pr-project-card--featured' : ''}`}
                    >
                      <div className="pr-project-media">
                        {proj.image ? (
                          <img src={proj.image} alt={proj.title} className="pr-project-img" />
                        ) : (
                          <div className="pr-project-placeholder">
                            <span className="pr-ph-index">{String(idx + 1).padStart(2, '0')}</span>
                            <span className="pr-ph-title">{proj.category || 'Project'}</span>
                          </div>
                        )}
                      </div>

                      <div className="pr-project-body">
                        <div className="pr-card-meta-row">
                          <span className="pr-badge">{proj.category || 'Project'}</span>
                          {proj.featured && <span className="pr-featured-pill">Featured</span>}
                          {proj.completionDate && <span className="pr-muted">{proj.completionDate}</span>}
                        </div>

                        <h3 className="pr-card-title">{proj.title}</h3>
                        <p className="pr-card-desc">{proj.description}</p>

                        {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                          <div className="pr-tags">
                            {proj.technologies.map((t) => (
                              <span key={t} className="pr-tag">{t}</span>
                            ))}
                          </div>
                        )}

                        {(proj.liveUrl || proj.githubUrl) && (
                          <div className="pr-card-actions">
                            {proj.liveUrl && (
                              <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="pr-btn pr-btn--sm">
                                Live Demo ↗
                              </a>
                            )}
                            {proj.githubUrl && (
                              <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="pr-btn-secondary pr-btn--sm">
                                Source Code ↗
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
              <div className="pr-card">
                <p className="pr-empty-note">No projects added yet.</p>
              </div>
            )}
          </section>
        )

      case 'skills':
        return (
          <section key="skills" id="pr-skills" className="pr-section">
            <div className="pr-section-head">
              <span className="pr-kicker">{sectionNum} / CAPABILITIES</span>
              <h2 className="pr-section-title">Technical Skills</h2>
            </div>
            {skills.length > 0 ? (
              <div className="pr-skills-grid">
                {Object.entries(skillsByCategory).map(([cat, items]) => (
                  <div key={cat} className="pr-card pr-skill-card">
                    <div className="pr-skill-card-head">
                      <div className="pr-skill-title-wrap">
                        <span className="pr-skill-glyph" aria-hidden="true">{getCategoryGlyph(cat)}</span>
                        <h3 className="pr-card-title">{cat}</h3>
                      </div>
                      <span className="pr-muted">{items.length}</span>
                    </div>
                    <div className="pr-skill-pills">
                      {items.map((sk) => (
                        <div key={sk.id} className="pr-skill-pill" title={sk.description || sk.name}>
                          <span className="pr-skill-name">{sk.name}</span>
                          {sk.description && <span className="pr-skill-note">{sk.description}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pr-card">
                <p className="pr-empty-note">No technical skills listed yet.</p>
              </div>
            )}
          </section>
        )

      case 'education':
        return (
          <section key="education" id="pr-education" className="pr-section">
            <div className="pr-section-head">
              <span className="pr-kicker">{sectionNum} / ACADEMICS</span>
              <h2 className="pr-section-title">Education</h2>
            </div>
            {education.length > 0 ? (
              <div className="pr-timeline">
                {education.map((edu, idx) => (
                  <div key={edu.id} className="pr-timeline-item">
                    <div className="pr-timeline-rail" aria-hidden="true">
                      <span className="pr-timeline-dot" />
                      {idx < education.length - 1 && <span className="pr-timeline-stem" />}
                    </div>
                    <div className="pr-card pr-timeline-card">
                      <div className="pr-card-meta-row">
                        <span className="pr-badge">
                          {edu.currentlyStudying
                            ? `${edu.startYear} — Present`
                            : `${edu.startYear}${edu.endYear ? ` — ${edu.endYear}` : ''}`}
                        </span>
                        {edu.currentlyStudying && (
                          <span className="pr-featured-pill">Currently Enrolled</span>
                        )}
                        {edu.grade && <span className="pr-muted">Grade: {edu.grade}</span>}
                      </div>
                      <h3 className="pr-card-title">{edu.degree} in {edu.fieldOfStudy}</h3>
                      <p className="pr-card-subtitle">
                        {edu.institution}{edu.location ? ` · ${edu.location}` : ''}
                      </p>
                      {edu.description && <p className="pr-card-desc">{edu.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pr-card">
                <p className="pr-empty-note">No education history added yet.</p>
              </div>
            )}
          </section>
        )

      case 'achievements':
        return (
          <section key="achievements" id="pr-achievements" className="pr-section">
            <div className="pr-section-head">
              <span className="pr-kicker">{sectionNum} / HONORS</span>
              <h2 className="pr-section-title">Achievements</h2>
            </div>
            {achievements.length > 0 ? (
              <div className="pr-cards-2col">
                {achievements.map((ach) => (
                  <article key={ach.id} className="pr-card pr-showcase-card">
                    <div className="pr-card-meta-row">
                      <span className="pr-badge">{ach.category || 'Achievement'}</span>
                      {ach.date && <span className="pr-muted">{ach.date}</span>}
                    </div>
                    <h3 className="pr-card-title">{ach.title}</h3>
                    {ach.issuer && <p className="pr-card-subtitle">Issued by {ach.issuer}</p>}
                    <p className="pr-card-desc">{ach.description}</p>
                    {ach.evidenceUrl && (
                      <div className="pr-card-actions">
                        <a href={ach.evidenceUrl} target="_blank" rel="noopener noreferrer" className="pr-inline-link">
                          View Evidence ↗
                        </a>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="pr-card">
                <p className="pr-empty-note">No achievements recorded yet.</p>
              </div>
            )}
          </section>
        )

      case 'certifications':
        return (
          <section key="certifications" id="pr-certifications" className="pr-section">
            <div className="pr-section-head">
              <span className="pr-kicker">{sectionNum} / CREDENTIALS</span>
              <h2 className="pr-section-title">Certifications</h2>
            </div>
            {certifications.length > 0 ? (
              <div className="pr-cards-2col">
                {certifications.map((cert) => (
                  <article key={cert.id} className="pr-card pr-showcase-card">
                    <div className="pr-card-meta-row">
                      <span className="pr-badge">Verified Credential</span>
                      {cert.issueDate && <span className="pr-muted">Issued {cert.issueDate}</span>}
                    </div>
                    <h3 className="pr-card-title">{cert.name}</h3>
                    <p className="pr-card-subtitle">{cert.issuer}</p>
                    {cert.credentialId && (
                      <div className="pr-cred-id-row">
                        <span className="pr-muted">Credential ID:</span>
                        <code className="pr-cred-code">{cert.credentialId}</code>
                      </div>
                    )}
                    {cert.verificationUrl && (
                      <div className="pr-card-actions">
                        <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer" className="pr-inline-link">
                          Verify Credential ↗
                        </a>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="pr-card">
                <p className="pr-empty-note">No certifications listed yet.</p>
              </div>
            )}
          </section>
        )

      case 'blog':
        if (publishedBlogs.length === 0) return null
        return (
          <section key="blog" id="pr-blog" className="pr-section">
            <div className="pr-section-head pr-section-head--row">
              <div>
                <span className="pr-kicker">{sectionNum} / WRITING</span>
                <h2 className="pr-section-title">Published Articles</h2>
              </div>
              {!isPreview && (
                <Link to={`/p/${portfolio.username}/blog`} className="pr-inline-link">
                  View All Articles ({publishedBlogs.length}) →
                </Link>
              )}
            </div>
            <div className="pr-cards-2col">
              {publishedBlogs.slice(0, 4).map((post, idx) => (
                <article
                  key={post.id}
                  className={`pr-card pr-blog-card ${idx === 0 && publishedBlogs.length > 1 ? 'pr-blog-card--featured' : ''}`}
                >
                  {post.coverImage ? (
                    <div className="pr-blog-cover">
                      <img src={post.coverImage} alt={post.title} className="pr-blog-img" />
                    </div>
                  ) : (
                    <div className="pr-blog-placeholder">
                      <span className="pr-ph-title">{post.category}</span>
                    </div>
                  )}
                  <div className="pr-blog-body">
                    <div className="pr-card-meta-row">
                      <span className="pr-badge">{post.category}</span>
                      <span className="pr-muted">{post.readingTime || 1} min read</span>
                      {post.publishedAt && <span className="pr-muted">{formatDate(post.publishedAt)}</span>}
                    </div>
                    <h3 className="pr-card-title">{post.title}</h3>
                    <p className="pr-card-desc">{post.excerpt}</p>
                    {!isPreview && (
                      <div className="pr-card-actions">
                        <Link to={`/p/${portfolio.username}/blog/${post.slug}`} className="pr-inline-link">
                          Read Article →
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )

      default:
        return null
    }
  }

  return (
    <div
      className="pr-root"
      style={cssVars}
      data-theme={design.themeId || 'modern-editorial'}
      data-btn-style={components?.buttonStyle || 'solid'}
      data-card-style={components?.cardStyle || 'bordered'}
      data-hero-layout={layout?.heroLayout || 'split'}
      data-nav-style={layout?.navStyle || 'standard'}
    >
      {/* Sticky Navigation */}
      <header className="pr-nav">
        <div className="pr-nav-inner">
          <a
            href="#pr-home"
            className="pr-brand"
            onClick={(e) => scrollToSection(e, 'pr-home')}
          >
            <span>{displayName.toUpperCase()}</span>
            <span className="pr-brand-dot" aria-hidden="true">.</span>
          </a>

          <button
            type="button"
            className="pr-mobile-nav-btn"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle portfolio navigation"
          >
            <span className="pr-menu-line" />
            <span className="pr-menu-line" />
            <span className="pr-menu-line" />
          </button>

          <nav
            className={`pr-nav-links ${mobileMenuOpen ? 'pr-nav-links--open' : ''}`}
            aria-label="Portfolio sections"
          >
            {visibleNavSections.slice(0, 5).map((sec) => (
              <a
                key={sec}
                href={`#pr-${sec}`}
                onClick={(e) => scrollToSection(e, `pr-${sec}`)}
                className={`pr-nav-link ${activeSection === sec ? 'pr-nav-link--active' : ''}`}
              >
                {SECTION_LABELS[sec]?.split(' ')[0] || sec}
              </a>
            ))}
            <a
              href="#pr-contact"
              onClick={(e) => scrollToSection(e, 'pr-contact')}
              className={`pr-nav-link ${activeSection === 'contact' ? 'pr-nav-link--active' : ''}`}
            >
              Contact
            </a>
            {!isPreview && publishedBlogs.length > 0 && (
              <Link to={`/p/${portfolio.username}/blog`} className="pr-nav-link pr-nav-link--accent">
                Blog ({publishedBlogs.length})
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="pr-home" className="pr-hero">
        <div className="pr-hero-inner">
          <div className="pr-hero-text">
            <div className="pr-role-pill">
              <span className="pr-role-dot" aria-hidden="true" />
              <span>{profile.professionalTitle || 'Creator & Software Builder'}</span>
            </div>

            <h1 className="pr-hero-title">{displayName}</h1>

            <p className="pr-hero-intro">
              {profile.introduction ||
                'Designing and building thoughtful digital products, systems, and experiences.'}
            </p>

            {(profile.location || socialLinks.github || socialLinks.linkedin) && (
              <div className="pr-hero-meta">
                {profile.location && <span className="pr-hero-loc">Based in {profile.location}</span>}
                {socialLinks.github && (
                  <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="pr-inline-link">
                    GitHub ↗
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="pr-inline-link">
                    LinkedIn ↗
                  </a>
                )}
              </div>
            )}

            <div className="pr-hero-actions">
              {!hiddenSet.has('projects') && (
                <a
                  href="#pr-projects"
                  onClick={(e) => scrollToSection(e, 'pr-projects')}
                  className="pr-btn"
                >
                  Explore My Work →
                </a>
              )}
              <a
                href="#pr-contact"
                onClick={(e) => scrollToSection(e, 'pr-contact')}
                className="pr-btn-secondary"
              >
                Contact Me
              </a>
            </div>
          </div>

          <div className="pr-hero-media">
            {profile.profileImage ? (
              <div className="pr-avatar-frame">
                <img src={profile.profileImage} alt={displayName} className="pr-hero-avatar" />
              </div>
            ) : (
              <div className="pr-avatar-monogram" aria-hidden="true">
                <span>{initials || 'PS'}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ordered Dynamic Sections */}
      <main className="pr-main">
        {sectionOrder.map((sec, idx) => renderSection(sec, idx))}

        {/* Closing Contact Section */}
        <section id="pr-contact" className="pr-section pr-contact-section">
          <div className="pr-card pr-contact-card">
            <div className="pr-contact-info">
              <span className="pr-kicker">GET IN TOUCH</span>
              <h2 className="pr-contact-title">Let&apos;s connect and collaborate.</h2>
              <p className="pr-card-desc">
                {profile.location
                  ? `Currently based in ${profile.location}. Open to meaningful conversations and opportunities.`
                  : 'Open to meaningful conversations, projects, and collaborations.'}
              </p>
            </div>

            <div className="pr-contact-actions">
              {profile.email && (
                <a href={`mailto:${profile.email}`} className="pr-btn">
                  Email Me →
                </a>
              )}
              {socialLinks.github && (
                <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="pr-btn-secondary">
                  GitHub ↗
                </a>
              )}
              {socialLinks.linkedin && (
                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="pr-btn-secondary">
                  LinkedIn ↗
                </a>
              )}
              {socialLinks.website && (
                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="pr-btn-secondary">
                  Website ↗
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Polished Footer */}
      <footer className="pr-footer">
        <div className="pr-footer-inner">
          <div className="pr-footer-brand">
            <strong>{displayName}</strong>
            <span className="pr-muted">@{portfolio.username}</span>
          </div>

          <div className="pr-footer-links">
            <a href="#pr-home" onClick={(e) => scrollToSection(e, 'pr-home')} className="pr-nav-link">
              Top
            </a>
            {visibleNavSections.slice(0, 4).map((sec) => (
              <a
                key={sec}
                href={`#pr-${sec}`}
                onClick={(e) => scrollToSection(e, `pr-${sec}`)}
                className="pr-nav-link"
              >
                {SECTION_LABELS[sec]?.split(' ')[0] || sec}
              </a>
            ))}
            {!isPreview && (
              <Link to="/" className="pr-inline-link">Portfolio Studio</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
