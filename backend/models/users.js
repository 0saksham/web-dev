import bcrypt from 'bcryptjs'
import { getFixedCampus } from '../utils/campusValidation.js'

// In-memory user storage
// In production, replace this with a database (MongoDB, PostgreSQL, etc.)
let users = []

// Pre-created admin accounts (only these can access Admin Office)
// Default password: Admin@123
// To generate a new hash, run: node backend/scripts/setupAdmin.js
const initializeAdmins = async () => {
  const adminPassword = 'Admin@123'
  const hashedPassword = await bcrypt.hash(adminPassword, 10)
  
  return [
    {
      id: 'admin-1',
      email: 'admin@iksuniversity.edu',
      password: hashedPassword,
      role: 'admin-office',
      name: 'System Administrator',
      campus: getFixedCampus('admin-office'), // Dehradun (fixed)
      branch: null, // Admin doesn't need branch
      createdAt: new Date().toISOString()
    }
  ]
}

// Initialize with pre-created admins
let adminsInitialized = false

export const initializeUsers = async () => {
  if (!adminsInitialized) {
    const preCreatedAdmins = await initializeAdmins()
    users = [...preCreatedAdmins]
    adminsInitialized = true
    console.log('✅ Pre-created admin accounts initialized')
    console.log('   Email: admin@iksuniversity.edu')
    console.log('   Password: Admin@123')
  }
}

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Object|null} - User object or null
 */
export const findUserByEmail = (email) => {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null
}

/**
 * Find user by ID
 * @param {string} id - User ID
 * @returns {Object|null} - User object or null
 */
export const findUserById = (id) => {
  return users.find(user => user.id === id) || null
}

/**
 * Create a new user
 * @param {Object} userData - User data (email, password, role, name, campus, branch)
 * @returns {Object} - Created user object (without password)
 */
export const createUser = (userData) => {
  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: userData.email.toLowerCase(),
    password: userData.password, // Already hashed
    role: userData.role,
    name: userData.name,
    campus: userData.campus || null,
    branch: userData.branch || null,
    createdAt: new Date().toISOString()
  }
  users.push(newUser)
  
  // Return user without password
  const { password, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

/**
 * Check if email already exists
 * @param {string} email - User email
 * @returns {boolean} - True if email exists
 */
export const emailExists = (email) => {
  return users.some(user => user.email.toLowerCase() === email.toLowerCase())
}

/**
 * Get all users (for admin purposes)
 * @returns {Array} - Array of users without passwords
 */
export const getAllUsers = () => {
  return users.map(({ password, ...user }) => user)
}

/**
 * Check if role allows self-registration
 * @param {string} role - User role
 * @returns {boolean} - True if role allows self-registration
 */
export const canSelfRegister = (role) => {
  const allowedRoles = ['campus-in-charge', 'spoc']
  return allowedRoles.includes(role)
}

