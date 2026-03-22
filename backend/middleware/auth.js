import { verifyToken, extractToken } from '../utils/jwt.js'

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (req, res, next) => {
  const token = extractToken(req) || req.body.token || req.query.token

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. No token provided.'
    })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired token.'
    })
  }

  // Attach user info to request
  req.user = decoded
  next()
}

/**
 * Middleware to check if user has a specific role
 * @param {string|string[]} allowedRoles - Role(s) allowed to access the route
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.'
      })
    }

    const userRole = req.user.role
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions. Access denied.'
      })
    }

    next()
  }
}

