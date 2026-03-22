import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, and role
 * @returns {string} - JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} - Token or null
 */
export const extractToken = (req) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}

