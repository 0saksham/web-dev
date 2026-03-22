// Validation utility functions
import { campusLabels, branchLabels } from './campusValidation.js'

/**
 * Validate user data for registration/login
 */
export const validateUserData = (data) => {
  const errors = []
  
  if (data.email) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format')
    }
    
    // Validate email length
    if (data.email.length > 255) {
      errors.push('Email must be less than 255 characters')
    }
  }
  
  if (data.password) {
    // Validate password strength
    if (data.password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(data.password)
    const hasLowerCase = /[a-z]/.test(data.password)
    const hasNumbers = /\d/.test(data.password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(data.password)
    
    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      errors.push('Password must contain uppercase, lowercase, number, and special character')
    }
  }
  
  if (data.role) {
    const validRoles = ['campus-in-charge', 'spoc', 'admin-office']
    if (!validRoles.includes(data.role)) {
      errors.push('Invalid role')
    }
  }
  
  if (data.name) {
    if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters long')
    }
    if (data.name.length > 100) {
      errors.push('Name must be less than 100 characters')
    }
    // Check for valid name characters
    if (!/^[a-zA-Z\s'-]+$/.test(data.name)) {
      errors.push('Name contains invalid characters')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate event data
 */
export const validateEventData = (data) => {
  const errors = []
  
  if (data.title) {
    if (data.title.length < 3) {
      errors.push('Title must be at least 3 characters long')
    }
    if (data.title.length > 200) {
      errors.push('Title must be less than 200 characters')
    }
    // Sanitize title - remove potentially harmful characters
    if (/<script|javascript:|on\w+=/i.test(data.title)) {
      errors.push('Title contains invalid characters')
    }
  }
  
  if (data.description) {
    if (data.description.length < 10) {
      errors.push('Description must be at least 10 characters long')
    }
    if (data.description.length > 5000) {
      errors.push('Description must be less than 5000 characters')
    }
    // Sanitize description - remove potentially harmful characters
    if (/<script|javascript:|on\w+=/i.test(data.description)) {
      errors.push('Description contains invalid characters')
    }
  }
  
  if (data.duration !== undefined && data.duration !== null) {
    if (typeof data.duration !== 'number' || data.duration <= 0) {
      errors.push('Duration must be a positive number')
    }
    if (data.duration > 365) {
      errors.push('Duration cannot be more than 365 days')
    }
  }
  
  if (data.credits !== undefined && data.credits !== null) {
    if (typeof data.credits !== 'number' || data.credits < 0 || data.credits > 100) {
      errors.push('Credits must be a number between 0 and 100')
    }
  }
  
  if (data.start_date) {
    const startDate = new Date(data.start_date)
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format')
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (startDate < today) {
        errors.push('Start date cannot be in the past')
      }
    }
  }
  
  if (data.end_date) {
    const endDate = new Date(data.end_date)
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end date format')
    }
  }
  
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    if (startDate > endDate) {
      errors.push('End date must be after start date')
    }
  }
  
  if (data.campus) {
    if (!Object.keys(campusLabels).includes(data.campus)) {
      errors.push('Invalid campus provided')
    }
  }
  
  if (data.branch) {
    if (!Object.keys(branchLabels).includes(data.branch)) {
      errors.push('Invalid branch')
    }
  }
  
  if (data.status) {
    const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled']
    if (!validStatuses.includes(data.status)) {
      errors.push('Invalid status')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate status transition
 */
export const isValidStatus = (status) => {
  const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled']
  return validStatuses.includes(status)
}

/**
 * Sanitize input data
 */
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potentially harmful characters
    return input.replace(/<script|javascript:|on\w+=/gi, '')
  }
  return input
}

/**
 * Validate contact form data
 */
export const validateContactData = (data) => {
  const errors = []
  
  if (data.name) {
    if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters long')
    }
    if (data.name.length > 100) {
      errors.push('Name must be less than 100 characters')
    }
    // Check for valid name characters
    if (!/^[a-zA-Z\s'-]+$/.test(data.name)) {
      errors.push('Name contains invalid characters')
    }
  }
  
  if (data.email) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format')
    }
    
    // Validate email length
    if (data.email.length > 255) {
      errors.push('Email must be less than 255 characters')
    }
  }
  
  if (data.subject) {
    if (data.subject.length < 3) {
      errors.push('Subject must be at least 3 characters long')
    }
    if (data.subject.length > 200) {
      errors.push('Subject must be less than 200 characters')
    }
    // Sanitize subject - remove potentially harmful characters
    if (/<script|javascript:|on\w+=/i.test(data.subject)) {
      errors.push('Subject contains invalid characters')
    }
  }
  
  if (data.message) {
    if (data.message.length < 5) {
      errors.push('Message must be at least 5 characters long')
    }
    if (data.message.length > 1000) {
      errors.push('Message must be less than 1000 characters')
    }
    // Sanitize message - remove potentially harmful characters
    if (/<script|javascript:|on\w+=/i.test(data.message)) {
      errors.push('Message contains invalid characters')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate file upload data
 */
export const validateFileUpload = (file) => {
  const errors = []
  
  if (!file) {
    errors.push('File is required')
    return {
      valid: false,
      errors
    }
  }
  
  if (file.size > 50 * 1024 * 1024) {
    errors.push('File size must be less than 50MB')
  }
  
  // Validate file type based on mime type
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/avi', 'video/x-matroska', 'video/x-flv',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'application/zip', 'application/x-rar-compressed'
  ]
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('File type not allowed')
  }
  
  // Validate file name length
  if (file.originalname.length > 255) {
    errors.push('File name is too long')
  }
  
  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.sh', '.php', '.js', '.vbs', '.scr']
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))
  if (dangerousExtensions.includes(fileExtension)) {
    errors.push('File type not allowed')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
