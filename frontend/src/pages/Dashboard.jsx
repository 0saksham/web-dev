import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRole, roleLabels, roles, clearRole, saveRole } from '../utils/roleStorage'
import { verifyAuth, apiRequest } from '../utils/api'
import { campusLabels, branchLabels } from '../utils/campusValidation'
import EventDashboard from '../components/EventDashboard'
import AdminDashboard from '../components/AdminDashboard'
import EventReporting from '../components/EventReporting'
import { useScrollReveal } from '../hooks/useAnimations'
import './Dashboard.css'

const roleConfig = {
  [roles.CAMPUS_IN_CHARGE]: {
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    icon: '🏫',
    color: '#6366f1',
  },
  [roles.SPOC]: {
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    icon: '👤',
    color: '#0ea5e9',
  },
  [roles.ADMIN_OFFICE]: {
    gradient: 'linear-gradient(135deg, #f97316, #f59e0b)',
    icon: '🏢',
    color: '#f97316',
  },
}

const Dashboard = () => {
  const { roleType } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adminStats, setAdminStats] = useState({
    totalEvents: 0,
    pending: 0,
    notifications: 0
  })
  useScrollReveal()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedRole = getRole()
        if (!storedRole || storedRole !== roleType) {
          navigate('/')
          return
        }

        const authenticatedUser = await verifyAuth()
        if (!authenticatedUser) {
          localStorage.removeItem('auth_token')
          navigate(`/auth/${roleType}`)
          return
        }

        if (authenticatedUser.role !== roleType) {
          saveRole(authenticatedUser.role)
          navigate(`/dashboard/${authenticatedUser.role}`)
          return
        }

        saveRole(authenticatedUser.role)
        setUser(authenticatedUser)
        if (authenticatedUser.role === roles.ADMIN_OFFICE) {
          loadAdminStats(authenticatedUser)
        }
      } catch (error) {
        console.error('Dashboard auth check error:', error)
        localStorage.removeItem('auth_token')
        navigate(`/auth/${roleType}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [roleType, navigate])

  const loadAdminStats = async (authedUser) => {
    try {
      const eventsRes = await apiRequest('/events')
      const eventsData = await eventsRes.json()
      if (eventsRes.ok) {
        const list = eventsData.events || []
        const totalEvents = list.length
        const pending = list.filter(ev => ev.status === 'pending').length
        setAdminStats(prev => ({ ...prev, totalEvents, pending }))
      }
      const notifRes = await apiRequest('/notifications/unread-count')
      const notifData = await notifRes.json()
      if (notifRes.ok) {
        setAdminStats(prev => ({ ...prev, notifications: notifData.count || 0 }))
      }
    } catch (e) {
      // Silently ignore errors for stats 
    }
  }

  const refreshStats = () => {
    if (user) loadAdminStats(user)
  }

  const handleLogout = () => {
    clearRole()
    localStorage.removeItem('auth_token')
    navigate('/')
  }

  const getRoleLabel = () => roleLabels[roleType] || 'User'

  const getDashboardContent = () => {
    const content = {
      [roles.CAMPUS_IN_CHARGE]: {
        title: 'Campus Management Dashboard',
        description: 'Manage campus operations, student services, and administrative tasks',
        features: [
          { icon: '📅', title: 'Event Scheduling', desc: 'Plan and manage campus events' },
          { icon: '📊', title: 'Reports & Analytics', desc: 'View detailed performance reports' },
          { icon: '👥', title: 'Student Management', desc: 'Manage student records and services' },
          { icon: '🏛️', title: 'Campus Resources', desc: 'Allocate and track campus resources' },
        ]
      },
      [roles.SPOC]: {
        title: 'SPOC Dashboard',
        description: 'Coordinate and communicate as the single point of contact',
        features: [
          { icon: '📡', title: 'Communication Hub', desc: 'Central hub for all communications' },
          { icon: '📋', title: 'Request Management', desc: 'Handle and track requests' },
          { icon: '📂', title: 'Document Sharing', desc: 'Share and manage documents' },
          { icon: '📈', title: 'Status Tracking', desc: 'Monitor progress and statuses' },
        ]
      },
      [roles.ADMIN_OFFICE]: {
        title: 'Admin Office Dashboard',
        description: 'Administrative oversight and system management',
        features: [
          { icon: '⚙️', title: 'System Administration', desc: 'Configure and manage system settings' },
          { icon: '👤', title: 'User Management', desc: 'Manage user accounts and permissions' },
          { icon: '🔧', title: 'System Configuration', desc: 'Fine-tune system parameters' },
          { icon: '📜', title: 'Audit Logs', desc: 'Review system activity logs' },
        ]
      }
    }
    return content[roleType] || { title: 'Dashboard', description: '', features: [] }
  }

  const config = roleConfig[roleType] || roleConfig[roles.CAMPUS_IN_CHARGE]
  const dashboardContent = getDashboardContent()

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {/* ========== HERO BANNER ========== */}
      <div className="dash-hero" style={{ background: config.gradient }}>
        <div className="dash-hero-pattern" />
        <div className="container">
          <div className="dash-hero-content">
            <div className="dash-hero-left">
              <div className="dash-hero-badge">
                <span className="dash-hero-icon">{config.icon}</span>
                {getRoleLabel()}
              </div>
              <h1>{dashboardContent.title}</h1>
              <p>{dashboardContent.description}</p>
            </div>
            <button className="dash-logout-btn" onClick={handleLogout}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container dash-main">
        {/* ========== WELCOME CARD ========== */}
        <div className="welcome-card glass-card scroll-reveal">
          <div className="welcome-avatar" style={{ background: config.gradient }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="welcome-info">
            <h2>Welcome Back{user?.name ? `, ${user.name}` : ''}! 👋</h2>
            <p>You are logged in as <strong>{getRoleLabel()}</strong></p>
            <div className="welcome-meta">
              {user?.email && <span className="meta-item">📧 {user.email}</span>}
              {user?.campus && <span className="meta-item">🏛️ {campusLabels[user.campus]}</span>}
              {user?.branch && <span className="meta-item">📍 {branchLabels[user.branch]}</span>}
            </div>
          </div>
        </div>

        {/* ========== ROLE-SPECIFIC CONTENT ========== */}
        {roleType === roles.CAMPUS_IN_CHARGE || roleType === roles.SPOC ? (
          <EventDashboard user={user} />
        ) : roleType === roles.ADMIN_OFFICE ? (
          <>
            <div className="admin-stats-grid scroll-reveal">
              {[
                { value: adminStats.totalEvents, label: 'Total Events', icon: '📊', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
                { value: adminStats.pending, label: 'Pending Approvals', icon: '⏳', gradient: 'linear-gradient(135deg, #f97316, #f59e0b)' },
                { value: adminStats.notifications, label: 'Notifications', icon: '🔔', gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' },
              ].map((stat, i) => (
                <div key={i} className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ background: stat.gradient }}>{stat.icon}</div>
                  <div className="admin-stat-info">
                    <span className="admin-stat-value">{stat.value}</span>
                    <span className="admin-stat-label">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <AdminDashboard user={user} onEventUpdate={refreshStats} />
          </>
        ) : (
          <div className="features-grid stagger-children">
            {dashboardContent.features.map((feature, index) => (
              <div key={index} className="feature-card scroll-reveal" style={{ transitionDelay: `${index * 0.08}s` }}>
                <div className="feature-icon-wrap" style={{ background: config.gradient }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
                <button className="btn btn-primary btn-small">
                  Access
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
