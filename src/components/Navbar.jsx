import { useState, useEffect } from 'react'
import './Navbar.css'

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact', isAction: true },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen((prev) => !prev)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <a href="#home" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-name">KOWSTHUBHA</span>
          <span className="brand-dot" aria-hidden="true">.</span>
        </a>

        {/* Desktop Navigation */}
        <nav
          id="primary-navigation"
          className={`navbar-nav ${isOpen ? 'navbar-nav--open' : ''}`}
          aria-label="Primary Navigation"
        >
          <ul className="nav-list">
            {NAV_LINKS.map((link) => (
              <li key={link.label} className="nav-item">
                <a
                  href={link.href}
                  className={`nav-link ${link.isAction ? 'nav-link--contact' : ''}`}
                  onClick={closeMenu}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          className={`mobile-toggle-btn ${isOpen ? 'mobile-toggle-btn--active' : ''}`}
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          <span className="toggle-icon-bar" aria-hidden="true"></span>
          <span className="toggle-icon-bar" aria-hidden="true"></span>
          <span className="toggle-icon-bar" aria-hidden="true"></span>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="mobile-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  )
}
