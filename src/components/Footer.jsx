import portfolioData from '../data/portfolioData'
import './Footer.css'

export default function Footer() {
  const { footer } = portfolioData

  const scrollToTop = (e) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Also update history hash cleanly if desired
    history.pushState(null, '', '#home')
  }

  return (
    <footer className="site-footer" aria-label="Site Footer">
      <div className="footer-container">
        {/* Top Footer Tier */}
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#home" onClick={scrollToTop} className="footer-logo">
              <span className="logo-name">{footer.brandName}</span>
              <span className="logo-dot" aria-hidden="true">.</span>
            </a>
            <p className="footer-identity">
              {portfolioData.personalInfo.professionalIdentity}
            </p>
          </div>

          <nav className="footer-nav" aria-label="Footer Navigation">
            <ul className="footer-nav-list">
              {footer.navLinks.map((link) => (
                <li key={link.label} className="footer-nav-item">
                  <a href={link.href} className="footer-nav-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Footer Tier */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <span>© {footer.currentYear} {footer.brandName}.</span>
            <span className="copyright-rights"> {footer.copyright}</span>
          </div>

          <div className="footer-actions">
            <a
              href="#home"
              onClick={scrollToTop}
              className="back-to-top-btn"
              aria-label="Back to top of page"
            >
              <span>Back to Top</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M8 12.6667V3.33334M8 3.33334L3.33333 8.00001M8 3.33334L12.6667 8.00001"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
