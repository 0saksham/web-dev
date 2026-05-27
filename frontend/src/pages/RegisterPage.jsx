import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getRole, roleLabels, roles, clearRole, canSelfRegister, saveRole } from '../utils/roleStorage'
import {
  getAllowedCampuses,
  isBranchRequired,
  isCampusSelectionRequired,
  getFixedCampus,
  campuses,
  campusLabels,
  branches,
  branchLabels
} from '../utils/campusValidation'
import './RegisterPage.css'

const RegisterPage = () => {
  const { roleType } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    campus: '',
    branch: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Set fixed campus for roles with a single allowed campus (e.g., SPOC)
    const allowed = getAllowedCampuses(roleType)
    if (allowed.length === 1) {
      setFormData(prev => ({ ...prev, campus: allowed[0] }))
    } else {
      // Reset campus if multiple choices
      setFormData(prev => ({ ...prev, campus: '' }))
    }
  }, [roleType])

  useEffect(() => {
    // Verify role is set and matches the route
    const storedRole = getRole()
    if (!storedRole || storedRole !== roleType) {
      navigate('/')
      return
    }

    // Check if role allows self-registration
    if (!canSelfRegister(roleType)) {
      navigate(`/auth/${roleType}`)
      return
    }
  }, [roleType, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return false
    }

    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (!formData.password) {
      setError('Password is required')
      return false
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    // Validate campus
    if (isCampusSelectionRequired(roleType)) {
      if (!formData.campus) {
        setError('Please select a campus')
        return false
      }
      const allowedCampuses = getAllowedCampuses(roleType)
      if (!allowedCampuses.includes(formData.campus)) {
        setError('Invalid campus selection for your role')
        return false
      }
    }

    // Validate branch (required for SPOC)
    if (isBranchRequired(roleType)) {
      if (!formData.branch) {
        setError('Please select a branch')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('https://iks-backend-sq2b.onrender.com/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: roleType,
          campus: formData.campus || null,
          branch: formData.branch || null
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store auth token
        if (data.token) {
          localStorage.setItem('auth_token', data.token)
        }
        // Use backend-confirmed role and sync storage
        const nextRole = data?.user?.role || roleType
        if (nextRole) {
          saveRole(nextRole)
        }
        // Navigate to dashboard
        navigate(`/dashboard/${nextRole}`)
      } else {
        setError(data.error || 'Registration failed. Please try again.')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`/auth/${roleType}`)
  }

  const getRoleLabel = () => {
    return roleLabels[roleType] || 'User'
  }

  return (
    <div className="register-page">
      <div className="container">
        <div className="register-container card fade-in">
          <button className="back-button" onClick={handleBack}>
            â† Back to Login
          </button>
          
          <div className="register-header">
            <h1>Create Account</h1>
            <p className="role-label">{getRoleLabel()}</p>
            <p className="register-description">
              Create your account to get started
            </p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                autoComplete="name"
              />
            </div>

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

            {isCampusSelectionRequired(roleType) && (
              <div className="form-group">
                <label htmlFor="campus">
                  Campus {getAllowedCampuses(roleType).length === 1 && '(Fixed)'}
                </label>
                <select
                  id="campus"
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  required
                  disabled={getAllowedCampuses(roleType).length === 1}
                >
                  <option value="">Select Campus</option>
                  {getAllowedCampuses(roleType).map(campus => (
                    <option key={campus} value={campus}>
                      {campusLabels[campus]}
                    </option>
                  ))}
                </select>
                {getAllowedCampuses(roleType).length === 1 && (
                  <small className="form-hint">
                    Campus is fixed for {roleLabels[roleType]}
                  </small>
                )}
              </div>
            )}

            {isBranchRequired(roleType) && (
              <div className="form-group">
                <label htmlFor="branch">Branch *</label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Branch</option>
                  {Object.entries(branchLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <small className="form-hint">Branch selection is mandatory for SPOC</small>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password (min. 8 characters)"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <small className="form-hint">Password must be at least 8 characters long</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary btn-large btn-block"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="register-footer">
              <p>
                Already have an account?{' '}
                <Link to={`/auth/${roleType}`} className="login-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage


