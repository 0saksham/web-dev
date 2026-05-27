import { useState, useEffect, useRef } from 'react'
import './ConversationRoom.css'

const ConversationRoom = ({ onClose }) => {
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'spoc' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const messagesEndRef = useRef(null)
  const refreshIntervalRef = useRef(null)

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
        setShowLoginForm(false)
      } catch (error) {
        console.error('Error parsing user data:', error)
        setShowLoginForm(true)
      }
    } else {
      setShowLoginForm(true)
    }
  }, [])

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const response = await fetch(
        'https://iks-backend-sq2b.onrender.com/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginData.email,
            password: loginData.password,
            role: loginData.role
          })
        }
      )

      const data = await response.json()

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        setShowLoginForm(false)
        setLoginData({ email: '', password: '', role: 'spoc' })
      } else {
        setLoginError(data.error || 'Invalid credentials')
      }
    } catch (error) {
      console.error('Login error:', error)
      setLoginError('Network error. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch(
        'https://iks-backend-sq2b.onrender.com/api/conversations/recent?limit=100',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch conversations')
      
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError('Failed to load messages')
    }
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversations])

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [])

  // Auto-refresh conversations
  useEffect(() => {
    if (isAutoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchConversations()
      }, 3000) // Refresh every 3 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [isAutoRefresh])

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      setError('Message cannot be empty')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        'https://iks-backend-sq2b.onrender.com/api/conversations',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: newMessage })
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      setNewMessage('')
      await fetchConversations()
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  // Delete message (only own messages or admin)
  const handleDeleteMessage = async (conversationId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `https://iks-backend-sq2b.onrender.com/api/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete message')
      }

      await fetchConversations()
    } catch (err) {
      console.error('Error deleting message:', err)
      setError(err.message || 'Failed to delete message')
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Group messages by date
  const groupedMessages = conversations.reduce((groups, conv) => {
    const date = formatDate(conv.created_at)
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(conv)
    return groups
  }, {})

  return (
    <div className="conversation-room">
      {showLoginForm ? (
        // Login Form
        <div className="conversation-login-container">
          <div className="login-header">
            <h2>Community Room</h2>
            <p className="login-subtitle">Please login to join the conversation</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {loginError && <div className="error-message">{loginError}</div>}

            <div className="form-group">
              <label htmlFor="role">Select Your Role</label>
              <select
                id="role"
                value={loginData.role}
                onChange={(e) => setLoginData({ ...loginData, role: e.target.value })}
                className="role-select"
              >
                <option value="spoc">SPOC (Single Point of Contact)</option>
                <option value="campus-in-charge">Campus In-Charge</option>
                <option value="admin-office">Admin Office</option>
                <option value="iks-office">IKS Office</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email or Phone</label>
              <input
                id="email"
                type="text"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="Enter your email or phone number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loginLoading}
            >
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>

            <div className="login-help">
              <p>Need to register? Contact your Campus In-Charge or SPOC</p>
            </div>
          </form>

          <button onClick={onClose} className="close-btn-login" title="Close">✕</button>
        </div>
      ) : (
        // Conversation Room (authenticated user)
        <>
          <div className="conversation-header">
            <div className="header-content">
              <h2>Community Conversation Room</h2>
              <p className="header-subtitle">Connect with SPOCs, Campus In-Charge, Admin & IKS Office</p>
            </div>
            <div className="header-controls">
              <label className="auto-refresh-toggle">
                <input
                  type="checkbox"
                  checked={isAutoRefresh}
                  onChange={(e) => setIsAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
              <button 
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  setShowLoginForm(true)
                  setUser(null)
                  setLoginData({ email: '', password: '', role: 'spoc' })
                }} 
                className="logout-btn" 
                title="Logout"
              >
                Logout
              </button>
              <button onClick={onClose} className="close-btn" title="Close conversation">✕</button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="messages-container">
            {Object.entries(groupedMessages).length === 0 ? (
              <div className="no-messages">
                <p>No messages yet. Be the first to start the conversation!</p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date}>
                  <div className="date-separator">{date}</div>
                  {msgs.map((conv) => (
                    <div
                      key={conv.id}
                      className={`message-item ${conv.user_id === user.id ? 'own-message' : ''}`}
                    >
                      <div className="message-header">
                        <div className="message-info">
                          <span className="username">{conv.username}</span>
                          <span className="designation">{conv.designation}</span>
                          <span className="timestamp">{formatTime(conv.created_at)}</span>
                        </div>
                        {(conv.user_id === user.id || user.role === 'admin-office') && (
                          <button
                            onClick={() => handleDeleteMessage(conv.id)}
                            className="delete-btn"
                            title="Delete message"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <div className="message-content">{conv.message}</div>
                    </div>
                  ))}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <div className="input-wrapper">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSendMessage(e)
                  }
                }}
                placeholder="Type your message here... (Ctrl+Enter to send)"
                className="message-input"
                disabled={loading}
                maxLength={1000}
              />
              <div className="input-footer">
                <span className="char-count">{newMessage.length}/1000</span>
                <button
                  type="submit"
                  className="send-btn"
                  disabled={loading || !newMessage.trim()}
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default ConversationRoom
