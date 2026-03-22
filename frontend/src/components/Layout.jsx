import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  const isAuthPage = location.pathname.startsWith('/auth/')
  const isRegisterPage = location.pathname.startsWith('/register/')
  const isDashboardPage = location.pathname.startsWith('/dashboard/')

  const isActive = (path) => location.pathname === path

  return (
    <div className="layout">
      <header className="header">
        <div className="header-glow" />
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              <div className="logo-icon-wrap">
                <img src="/images/logo.png" alt="IKS GEHU Logo" className="logo-img" />
              </div>
              <div className="logo-text">
                <h1>IKS <span className="gradient-text">GEHU</span></h1>
                <span className="logo-tagline">Indian Knowledge Systems</span>
              </div>
            </Link>
            {!isAuthPage && !isRegisterPage && !isDashboardPage && (
              <nav className="nav">
                <Link 
                  to="/" 
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                >
                  <span className="nav-link-text">Home</span>
                </Link>
                <Link 
                  to="/iks" 
                  className={`nav-link ${isActive('/iks') ? 'active' : ''}`}
                >
                  <span className="nav-link-text">IKS</span>
                </Link>
                <Link 
                  to="/about" 
                  className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                >
                  <span className="nav-link-text">About</span>
                </Link>
                <Link 
                  to="/contact" 
                  className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
                >
                  <span className="nav-link-text">Contact</span>
                </Link>
              </nav>
            )}
            {!isAuthPage && !isRegisterPage && (
              <button className="menu-toggle" aria-label="Toggle menu">
                <span></span>
                <span></span>
                <span></span>
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="main-content">
        {children}
      </main>
      {!isAuthPage && !isRegisterPage && (
        <footer className="footer">
          <div className="footer-glow" />
          <div className="container">
            <div className="footer-content">
              <div className="footer-brand">
                <Link to="/" className="footer-logo">
                  <img src="/images/logo.png" alt="IKS GEHU" className="footer-logo-img" />
                  <span>IKS GEHU Portal</span>
                </Link>
                <p className="footer-description">
                  Indian Knowledge Systems initiative by Graphic Era Hill University — 
                  preserving and promoting India's rich intellectual heritage.
                </p>
              </div>
              <div className="footer-links">
                <h4>Quick Links</h4>
                <Link to="/">Home</Link>
                <Link to="/iks">IKS</Link>
                <Link to="/about">About</Link>
                <Link to="/contact">Contact</Link>
              </div>
              <div className="footer-links">
                <h4>Campuses</h4>
                <span>Dehradun</span>
                <span>Haldwani</span>
                <span>Bhimtal</span>
              </div>
            </div>
            <div className="footer-bottom">
              <p>© 2026 IKS GEHU Portal. Crafted with ❤️ for Graphic Era Hill University.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default Layout
