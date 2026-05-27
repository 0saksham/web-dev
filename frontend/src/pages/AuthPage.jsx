import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getRole, roleLabels, roles, clearRole, canSelfRegister, saveRole } from '../utils/roleStorage'
import ParticleBackground from '../components/ParticleBackground'
import './AuthPage.css'

const bgImages = ['/images/gehu.jpg', '/images/GEU.jpg', '/images/bheemtal.webp', '/images/haldwani.webp']

const AuthPage = () => {
  const { roleType } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const storedRole = getRole()
    if (!storedRole || storedRole !== roleType) {
      navigate('/')
      return
    }
  }, [roleType, navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('https://iks-backend-sq2b.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: roleType }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.token) localStorage.setItem('auth_token', data.token)
        const nextRole = data?.user?.role || roleType
        if (nextRole) saveRole(nextRole)
        navigate(`/dashboard/${nextRole}`)
      } else {
        setError(data.error || 'Invalid credentials. Please try again.')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => { clearRole(); navigate('/') }

  const getRoleLabel = () => roleLabels[roleType] || 'User'

  const getRoleDescription = () => {
    const descriptions = {
      [roles.CAMPUS_IN_CHARGE]: 'Sign in to manage campus operations and student services',
      [roles.SPOC]: 'Sign in as the single point of contact for your organization',
      [roles.ADMIN_OFFICE]: 'Sign in to access administrative and system management tools'
    }
    return descriptions[roleType] || 'Sign in to continue'
  }

  return (
    <div className="auth-page">
      {/* Animated background */}
      <div className="auth-bg-slideshow">
        {bgImages.map((src, i) => (
          <div key={i} className={`auth-bg-slide ${i === bgIndex ? 'active' : ''}`}>
            <img src={src} alt="" />
          </div>
        ))}
        <div className="auth-bg-overlay" />
        <ParticleBackground count={30} color="rgba(255, 255, 255, 0.4)" />
      </div>

      <div className="auth-grid">
        {/* Left side - branding */}
        <div className="auth-brand fade-in">
          <div className="auth-brand-content">
            <img src="/images/logo.png" alt="IKS GEHU" className="auth-brand-logo" />
            <h2>IKS <span className="gradient-text">GEHU</span></h2>
            <p>Indian Knowledge Systems — Graphic Era Hill University</p>
            <div className="auth-brand-features">
              <div className="auth-feature">
                <span className="auth-feature-icon">🎯</span>
                <span>Streamlined Campus Management</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">📊</span>
                <span>Real-time Event Tracking</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">🔒</span>
                <span>Secure Role-based Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - form */}
        <div className="auth-form-side">
          <div className="auth-container glass-card fade-in">
            <button className="back-button" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Role Selection
            </button>
            
            <div className="auth-header">
              <h1>Sign In</h1>
              <p className="role-label">{getRoleLabel()}</p>
              <p className="role-description">{getRoleDescription()}</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button 
                type="submit" 
                className="btn btn-primary btn-large btn-block"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="auth-footer">
                {canSelfRegister(roleType) ? (
                  <p>
                    Don't have an account?{' '}
                    <Link to={`/register/${roleType}`} className="register-link">
                      Create Account
                    </Link>
                  </p>
                ) : (
                  <p className="admin-note">
                    Admin accounts are pre-created. Contact system administrator for access.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
