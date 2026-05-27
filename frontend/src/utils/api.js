/**
 * API utility functions for making authenticated requests
 */

// In development, always use the Vite proxy via relative '/api' to avoid CORS when the dev server chooses a different port
const API_BASE_URL = import.meta.env.PROD ? 'https://iks-backend-sq2b.onrender.com/api' : '/api'

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token')
}

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  // Check if body is FormData to avoid setting Content-Type header
  const isFormData = options.body instanceof FormData
  
  const headers = {
    'Content-Type': isFormData ? undefined : 'application/json',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  })

  return response
}

/**
 * Verify if user is authenticated by checking token with backend
 * @returns {Promise<Object|null>} - User object or null if not authenticated
 */
export const verifyAuth = async () => {
  try {
    const token = getAuthToken()
    if (!token) {
      return null
    }

    const response = await apiRequest('/auth/me')
    if (response.ok) {
      const data = await response.json()
      return data.user
    }
    return null
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}


