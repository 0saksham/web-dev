import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'
import { hashPassword, comparePassword } from './utils/password.js'
import { generateToken, verifyToken } from './utils/jwt.js'
import { authenticate, authorize } from './middleware/auth.js'
import { initDatabase } from './database/db.js'
import { User } from './models/User.js'
import { Event } from './models/Event.js'
import { EventMedia } from './models/EventMedia.js'
import { EventStatus } from './models/EventStatus.js'
import { Notification } from './models/Notification.js'
import { Conversation } from './models/Conversation.js'
import { validateCampusBranch, getFixedCampus } from './utils/campusValidation.js'
import { upload, getMediaType, getRelativePath } from './utils/fileUpload.js'
import { canTransitionStatus, canSubmitEvent } from './utils/eventWorkflow.js'
import { validateUserData, validateEventData, sanitizeInput, validateFileUpload, validateContactData } from './utils/validation.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || '0.0.0.0'

// Initialize database
initDatabase()

// Serve uploaded files statically
app.use('/uploads', express.static(join(__dirname, 'uploads')))

// Helper function to check if role allows self-registration
const canSelfRegister = (role) => {
  const allowedRoles = ['campus-in-charge', 'spoc']
  return allowedRoles.includes(role)
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use(limiter)

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE ? `${process.env.MAX_FILE_SIZE}b` : '10mb' }))
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE ? `${process.env.MAX_FILE_SIZE}b` : '10mb' }))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'IKS GEHU Portal API is running',
    timestamp: new Date().toISOString()
  })
})

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body

  // Validate input data
  const contactData = { name, email, subject, message };
  const contactValidation = validateContactData(contactData);
  if (!contactValidation.valid) {
    return res.status(400).json({
      error: `Contact form validation failed: ${contactValidation.errors.join(', ')}`,
      details: contactValidation.errors
    });
  }

  // In a real application, you would save this to a database
  // For now, we'll just log it and return success
  console.log('Contact form submission:', {
    name,
    email,
    subject,
    message,
    timestamp: new Date().toISOString()
  })

  res.json({ 
    success: true, 
    message: 'Thank you for your message. We will get back to you soon!' 
  })
})

// Authentication Routes

/**
 * Register a new user
 * Only Campus In-Charge and SPOC can self-register
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, campus, branch } = req.body

    // Validate input data
    const userDataValidation = validateUserData({ email, password, name, role, campus, branch });
    if (!userDataValidation.valid) {
      return res.status(400).json({
        error: `Validation failed: ${userDataValidation.errors.join(', ')}`,
        details: userDataValidation.errors
      });
    }

    // Check if role allows self-registration
    if (!canSelfRegister(role)) {
      return res.status(403).json({
        error: 'Self-registration is not allowed for this role. Please contact administrator.'
      })
    }

    // Handle campus selection
    let finalCampus = campus
    const fixedCampus = getFixedCampus(role)
    if (fixedCampus) {
      finalCampus = fixedCampus
    }

    // Validate campus and branch
    const validation = validateCampusBranch(role, finalCampus, branch)
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      })
    }

    // Check if email already exists
    if (await User.emailExists(email)) {
      return res.status(409).json({
        error: 'Email already registered. Please use a different email or login.'
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role,
      name,
      campus: finalCampus,
      branch: branch || null
    })

    // Generate token
    const sanitizedUser = User.sanitize(newUser)
    const token = generateToken(sanitizedUser)

    console.log('User registered:', {
      email: sanitizedUser.email,
      role: sanitizedUser.role,
      campus: sanitizedUser.campus,
      branch: sanitizedUser.branch,
      timestamp: new Date().toISOString()
    })

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: sanitizedUser
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Registration failed. Please try again.'
    })
  }
})

/**
 * Login user
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body

    // Minimal validation for login (do not enforce registration complexity rules)
    const errors = []
    if (!email || !password || !role) {
      errors.push('Email, password, and role are required')
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        errors.push('Invalid email format')
      }
      const validRoles = ['campus-in-charge', 'spoc', 'admin-office']
      if (!validRoles.includes(role)) {
        errors.push('Invalid role')
      }
    }
    if (errors.length > 0) {
      return res.status(400).json({
        error: `Validation failed: ${errors.join(', ')}`,
        details: errors
      })
    }

    // Find user
    const user = await User.findByEmail(email)
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      })
    }

    // Verify role matches
    if (user.role !== role) {
      return res.status(403).json({
        error: 'Role mismatch. Please select the correct role.'
      })
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      })
    }

    // Generate token
    const userWithoutPassword = User.sanitize(user)
    const token = generateToken(userWithoutPassword)

    console.log('User logged in:', {
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString()
    })

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed. Please try again.'
    })
  }
})

/**
 * Verify token and get current user
 */
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    const userWithoutPassword = User.sanitize(user)
    res.json({
      success: true,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Failed to get user information'
    })
  }
})

// Event Management Routes

/**
 * Get all events (with role-based filtering)
 */
app.get('/api/events', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Normalize query params: treat 'all' and empty values as no filter
    const normalize = (v) => (v && v !== 'all' ? v : null)
    const filters = {
      userRole: user.role,
      userCampus: user.campus,
      userBranch: user.branch,
      status: normalize(req.query.status),
      campus: normalize(req.query.campus),
      branch: normalize(req.query.branch),
      created_by: normalize(req.query.created_by),
      date_from: normalize(req.query.date_from),
      date_to: normalize(req.query.date_to),
      limit: req.query.limit ? parseInt(req.query.limit) : null
    }

    const events = await Event.findAll(filters)
    res.json({
      success: true,
      events
    })
  } catch (error) {
    console.error('Get events error:', error)
    res.status(500).json({
      error: 'Failed to fetch events'
    })
  }
})

/**
 * Get event by ID
 */
app.get('/api/events/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    // Role-based access control
    const user = await User.findById(req.user.id)
    if (user.role === 'campus-in-charge' && event.campus !== user.campus) {
      return res.status(403).json({
        error: 'Access denied'
      })
    }
    if (user.role === 'spoc' && (event.campus !== user.campus || event.branch !== user.branch)) {
      return res.status(403).json({
        error: 'Access denied'
      })
    }

    // Get event media
    const media = await EventMedia.findByEventId(req.params.id)
    
    // Get status history
    const statusHistory = await EventStatus.findByEventId(req.params.id)

    res.json({
      success: true,
      event: {
        ...event,
        media,
        status_history: statusHistory
      }
    })
  } catch (error) {
    console.error('Get event error:', error)
    res.status(500).json({
      error: 'Failed to fetch event'
    })
  }
})

/**
 * Create new event
 * Always creates as draft - users cannot directly publish
 */
app.post('/api/events', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { title, description, duration, credits, start_date, end_date, campus, branch, status } = req.body

    // Determine final event status first for context-aware validation
    let eventStatus = 'draft'
    if (status && user.role === 'admin-office') {
      eventStatus = status
    } else if (status && status !== 'draft') {
      return res.status(403).json({
        error: 'Only administrators can set status other than draft. Please create as draft and submit for approval.'
      })
    }

    // Validation: if draft, bypass strict validation to allow saving WIP
    if (eventStatus !== 'draft') {
      const eventData = { title, description, duration, credits, start_date, end_date, campus, branch, status: eventStatus };
      const eventValidation = validateEventData(eventData);
      if (!eventValidation.valid) {
        return res.status(400).json({
          error: 'Event validation failed',
          details: eventValidation.errors
        })
      }
    }

    // For draft, title and start_date are optional
    // But we'll allow creation with minimal data
    const eventTitle = title || 'Untitled Event'
    const eventStartDate = start_date || new Date().toISOString()

    // Use user's campus/branch if not provided
    const eventCampus = campus || user.campus
    const eventBranch = branch || user.branch

    let event
    try {
      event = await Event.create({
        title: eventTitle,
        description,
        duration,
        credits,
        start_date: eventStartDate,
        end_date,
        status: eventStatus,
        created_by: user.id,
        campus: eventCampus,
        branch: eventBranch
      })
    } catch (dbError) {
      console.error('Create event DB error:', dbError)
      return res.status(400).json({
        error: 'Event creation failed',
        details: dbError.message || String(dbError)
      })
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully as draft',
      event
    })
  } catch (error) {
    console.error('Create event error:', error)
    res.status(500).json({
      error: 'Failed to create event',
      details: error.message || String(error)
    })
  }
})

/**
 * Submit event for approval (Draft â†’ Pending)
 */
app.post('/api/events/:id/submit', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Only creator can submit their own event
    if (event.created_by !== user.id) {
      return res.status(403).json({
        error: 'Only the event creator can submit for approval'
      })
    }

    // Validate event can be submitted
    const validation = canSubmitEvent(event)
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      })
    }

    // Check status transition
    const transitionCheck = canTransitionStatus(event.status, 'pending', user.role)
    if (!transitionCheck.allowed) {
      return res.status(400).json({
        error: transitionCheck.error
      })
    }

    // Update event to pending status
    const updatedEvent = await Event.update(req.params.id, {
      status: 'pending',
      submitted_by: user.id
    })

    res.json({
      success: true,
      message: 'Event submitted for approval successfully',
      event: updatedEvent
    })
  } catch (error) {
    console.error('Submit event error:', error)
    res.status(500).json({
      error: 'Failed to submit event'
    })
  }
})

/**
 * Update event status (Approve/Reject)
 */
app.post('/api/events/:id/status', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Only admin-office can approve/reject events
    if (user.role !== 'admin-office') {
      return res.status(403).json({
        error: 'Only administrators can update event status'
      })
    }

    const { status, remarks } = req.body
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be "approved" or "rejected"'
      })
    }
    
    if (!remarks) {
      return res.status(400).json({
        error: 'Remarks are required'
      })
    }

    // Check status transition
    const transitionCheck = canTransitionStatus(event.status, status, user.role)
    if (!transitionCheck.allowed) {
      return res.status(400).json({
        error: transitionCheck.error
      })
    }

    const updatedEvent = await Event.update(req.params.id, {
      status,
      remarks,
      reviewed_by: user.id
    })

    res.json({
      success: true,
      message: `Event ${status} successfully`,
      event: updatedEvent
    })
  } catch (error) {
    console.error('Update event status error:', error)
    res.status(500).json({
      error: 'Failed to update event status'
    })
  }
})

/**
 * Update event
 */
app.put('/api/events/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Only creator or admin can update
    if (event.created_by !== user.id && user.role !== 'admin-office') {
      return res.status(403).json({
        error: 'Access denied'
      })
    }

    const updates = {}
    const allowedFields = ['title', 'description', 'duration', 'credits', 'start_date', 'end_date', 'status', 'campus', 'branch']
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }
    
    // Validate updates
    const eventValidation = validateEventData(updates);
    if (!eventValidation.valid) {
      return res.status(400).json({
        error: 'Event validation failed',
        details: eventValidation.errors
      });
    }

    // Enforce status transition rules for non-admin users
    if (updates.status && user.role !== 'admin-office') {
      const transitionCheck = canTransitionStatus(event.status, updates.status, user.role)
      if (!transitionCheck.allowed) {
        return res.status(400).json({
          error: transitionCheck.error
        })
      }
    }

    // If user is editing a rejected event, reset status to draft
    if (event.status === 'rejected' && event.created_by === user.id && user.role !== 'admin-office' && !updates.status) {
      updates.status = 'draft'
    }

    // Prevent non-admin users from setting status to approved
    if (updates.status === 'approved' && user.role !== 'admin-office') {
      return res.status(403).json({
        error: 'Only administrators can approve events. Please submit for review.'
      })
    }

    // If admin is updating status, include remarks
    if (user.role === 'admin-office' && updates.status) {
      updates.reviewed_by = user.id
      updates.remarks = req.body.remarks || null
    }

    const updatedEvent = await Event.update(req.params.id, updates)

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    })
  } catch (error) {
    console.error('Update event error:', error)
    res.status(500).json({
      error: 'Failed to update event'
    })
  }
})

/**
 * Delete event
 */
app.delete('/api/events/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Only creator or admin can delete
    if (event.created_by !== user.id && user.role !== 'admin-office') {
      return res.status(403).json({
        error: 'Access denied'
      })
    }

    await Event.delete(req.params.id)

    res.json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Delete event error:', error)
    res.status(500).json({
      error: 'Failed to delete event'
    })
  }
})

// Notification Routes

/**
 * Get user's notifications
 */
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const filters = {
      is_read: req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    }
    
    const notifications = await Notification.findByUser(req.user.id, filters)
    res.json({
      success: true,
      notifications
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      error: 'Failed to fetch notifications'
    })
  }
})

/**
 * Get unread notification count
 */
app.get('/api/notifications/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id)
    res.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({
      error: 'Failed to fetch notification count'
    })
  }
})

/**
 * Mark notification as read
 */
app.post('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    await Notification.markAsRead(req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

/**
 * Mark all notifications as read
 */
app.post('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ error: 'Failed to mark all as read' })
  }
})

/**
 * Admin: List or lookup users by id or role
 */
app.get('/api/admin/users', authenticate, authorize('admin-office'), async (req, res) => {
  try {
    const { id, role } = req.query
    
    if (id) {
      const user = await User.findById(id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      return res.json({ user: User.sanitize(user) })
    }
    
    const filters = {}
    if (role) {
      filters.role = role
    }
    const users = await User.findAll(filters)
    res.json({ users })
  } catch (error) {
    console.error('Admin users lookup error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

/**
 * Admin: Get single user by id
 */
app.get('/api/admin/users/:id', authenticate, authorize('admin-office'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user: User.sanitize(user) })
  } catch (error) {
    console.error('Admin user fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

/**
 * Upload file to event
 */
app.post('/api/events/:id/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      })
    }

    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Only creator or admin can add media
    if (event.created_by !== user.id && user.role !== 'admin-office') {
      return res.status(403).json({
        error: 'Access denied'
      })
    }

    // Validate file upload
    const fileValidation = validateFileUpload(req.file);
    if (!fileValidation.valid) {
      return res.status(400).json({
        error: 'File validation failed',
        details: fileValidation.errors
      });
    }
    
    const mediaType = getMediaType(req.file.mimetype)
    const relativePath = getRelativePath(req.file.path)
    const fileUrl = `/uploads${relativePath.split('/uploads')[1]}`

    const media = await EventMedia.create({
      event_id: req.params.id,
      media_type: mediaType,
      file_name: req.file.originalname,
      file_path: fileUrl,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: user.id
    })

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      media
    })
  } catch (error) {
    console.error('Upload file error:', error)
    res.status(500).json({
      error: error.message || 'Failed to upload file'
    })
  }
})

/**
 * Add media to event (legacy endpoint for manual entry)
 */
app.post('/api/events/:id/media', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Only creator or admin can add media
    if (event.created_by !== user.id && user.role !== 'admin-office') {
      return res.status(403).json({
        error: 'Access denied'
      })
    }

    const { media_type, file_name, file_path, file_size, mime_type } = req.body

    if (!media_type || !file_name || !file_path) {
      return res.status(400).json({
        error: 'Media type, file name, and file path are required'
      })
    }
    
    // Validate file data
    if (file_size && typeof file_size !== 'number') {
      return res.status(400).json({
        error: 'File size must be a number'
      });
    }
    
    const validMediaTypes = ['image', 'video', 'document'];
    if (!validMediaTypes.includes(media_type)) {
      return res.status(400).json({
        error: 'Invalid media type'
      });
    }
    
    // Validate file name length
    if (file_name.length > 255) {
      return res.status(400).json({
        error: 'File name is too long'
      });
    }
    
    // Validate file path
    if (typeof file_path !== 'string' || !file_path.startsWith('/uploads/')) {
      return res.status(400).json({
        error: 'File path must start with /uploads/'
      });
    }

    const media = await EventMedia.create({
      event_id: req.params.id,
      media_type,
      file_name,
      file_path,
      file_size,
      mime_type,
      uploaded_by: user.id
    })

    res.status(201).json({
      success: true,
      message: 'Media added successfully',
      media
    })
  } catch (error) {
    console.error('Add media error:', error)
    res.status(500).json({
      error: 'Failed to add media'
    })
  }
})

/**
 * Delete media from event
 */
app.delete('/api/events/:id/media/:mediaId', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    const media = await EventMedia.findById(req.params.mediaId)
    if (!media || media.event_id !== req.params.id) {
      return res.status(404).json({
        error: 'Media not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Only creator or admin can delete media
    if (event.created_by !== user.id && user.role !== 'admin-office') {
      return res.status(403).json({
        error: 'Access denied'
      })
    }

    await EventMedia.delete(req.params.mediaId)

    res.json({
      success: true,
      message: 'Media deleted successfully'
    })
  } catch (error) {
    console.error('Delete media error:', error)
    res.status(500).json({
      error: 'Failed to delete media'
    })
  }
})

/**
 * Update event status (Admin only)
 */
app.post('/api/events/:id/status', authenticate, authorize('admin-office'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({
        error: 'Event not found'
      })
    }

    const { status, remarks } = req.body
    const user = await User.findById(req.user.id)

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      })
    }
    
    // Validate status
    if (!isValidStatus(status)) {
      return res.status(400).json({
        error: 'Invalid status provided'
      })
    }
    
    // Validate remarks if provided
    if (remarks && typeof remarks !== 'string') {
      return res.status(400).json({
        error: 'Remarks must be a string'
      })
    }
    
    if (remarks && remarks.length > 1000) {
      return res.status(400).json({
        error: 'Remarks must be no more than 1000 characters'
      })
    }

    const updatedEvent = await Event.update(req.params.id, {
      status,
      reviewed_by: user.id,
      remarks
    })

    // Create notification for the event creator
    try {
      const eventCreator = await User.findById(updatedEvent.created_by)
      if (eventCreator) {
        let notificationTitle, notificationMessage, notificationType
        
        if (status === 'approved') {
          notificationTitle = 'Event Approved'
          notificationMessage = `Your event "${updatedEvent.title}" has been approved by an administrator. ${remarks ? `Remarks: ${remarks}` : ''}`
          notificationType = 'success'
        } else if (status === 'rejected') {
          notificationTitle = 'Event Rejected'
          notificationMessage = `Your event "${updatedEvent.title}" has been rejected by an administrator. ${remarks ? `Remarks: ${remarks}` : 'No remarks provided.'}`
          notificationType = 'error'
        } else {
          notificationTitle = 'Event Status Updated'
          notificationMessage = `Your event "${updatedEvent.title}" status has been updated to ${status} by an administrator. ${remarks ? `Remarks: ${remarks}` : ''}`
          notificationType = 'info'
        }
        
        await Notification.create({
          user_id: eventCreator.id,
          event_id: updatedEvent.id,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType
        })
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError)
      // Don't fail the entire operation if notification creation fails
    }

    res.json({
      success: true,
      message: 'Event status updated successfully',
      event: updatedEvent
    })
  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({
      error: 'Failed to update event status'
    })
  }
})

/**
 * Get user notifications
 */
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const filters = {
      is_read: req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined,
      type: req.query.type || null,
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    }

    const notifications = await Notification.findByUser(req.user.id, filters)
    
    res.json({
      success: true,
      notifications
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      error: 'Failed to fetch notifications'
    })
  }
})

/**
 * Mark notification as read
 */
app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
    
    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found'
      })
    }

    // Check if notification belongs to user
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied'
      })
    }

    const updatedNotification = await Notification.markAsRead(req.params.id)
    
    res.json({
      success: true,
      notification: updatedNotification
    })
  } catch (error) {
    console.error('Mark notification as read error:', error)
    res.status(500).json({
      error: 'Failed to update notification'
    })
  }
})

/**
 * Mark all notifications as read
 */
app.put('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id)
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    })
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    res.status(500).json({
      error: 'Failed to update notifications'
    })
  }
})

/**
 * Get unread notifications count
 */
app.get('/api/notifications/unread-count', authenticate, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id)
    
    res.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({
      error: 'Failed to get unread count'
    })
  }
})

/**
 * Download media file (Secure access with role-based control)
 */
app.get('/api/media/:mediaId/download', authenticate, async (req, res) => {
  try {
    const media = await EventMedia.findById(req.params.mediaId)
    if (!media) {
      return res.status(404).json({
        error: 'Media file not found'
      })
    }

    // Get the event to check access
    const event = await Event.findById(media.event_id)
    if (!event) {
      return res.status(404).json({
        error: 'Associated event not found'
      })
    }

    const user = await User.findById(req.user.id)
    
    // Role-based access control
    if (user.role === 'campus-in-charge') {
      // Campus In-Charge can access events from their campus
      if (event.campus !== user.campus) {
        return res.status(403).json({
          error: 'Access denied - media belongs to different campus'
        })
      }
    } else if (user.role === 'spoc') {
      // SPOC can access events from their campus and branch
      if (event.campus !== user.campus || event.branch !== user.branch) {
        return res.status(403).json({
          error: 'Access denied - media belongs to different branch'
        })
      }
    }
    // Admin can access all media files

    const filePath = join(__dirname, `.${media.file_path}`)
    if (!existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found on server'
      })
    }

    // Log the download attempt
    console.log(`File download: ${media.file_name} by user ${user.email} (${user.role})`)
    
    // Send file with proper headers
    res.download(filePath, media.file_name, (err) => {
      if (err) {
        console.error('File download error:', err)
        res.status(500).json({
          error: 'Failed to download file'
        })
      }
    })
    
  } catch (error) {
    console.error('Download media error:', error)
    res.status(500).json({
      error: 'Failed to download media'
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!' 
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found' 
  })
})

// Production-specific configurations
if (process.env.NODE_ENV === 'production') {
  // Serve static files from frontend build
  app.use(express.static(join(__dirname, '../frontend/dist')))
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../frontend/dist/index.html'))
  })
  
  // Add security headers for production
  app.use((req, res, next) => {
    // Prevent XSS attacks
    res.setHeader('X-XSS-Protection', '1; mode=block')
    
    // Prevent loading content in frames from other domains
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    
    // Force HTTPS in production
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff')
    
    next()
  })
}

// =================== COMMUNITY CONVERSATIONS ROUTES ===================

/**
 * Get all conversations (public access, but must be authenticated)
 */
app.get('/api/conversations', authenticate, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50
    const offset = req.query.offset ? parseInt(req.query.offset) : 0
    
    const conversations = await Conversation.findAll(limit, offset)
    const totalCount = await Conversation.getTotalCount()
    
    res.json({
      success: true,
      conversations,
      total: totalCount,
      limit,
      offset
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    res.status(500).json({
      error: 'Failed to fetch conversations'
    })
  }
})

/**
 * Get recent conversations (live chat feed)
 */
app.get('/api/conversations/recent', authenticate, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100
    
    const conversations = await Conversation.findRecent(limit)
    
    res.json({
      success: true,
      conversations
    })
  } catch (error) {
    console.error('Get recent conversations error:', error)
    res.status(500).json({
      error: 'Failed to fetch recent conversations'
    })
  }
})

/**
 * Create a new conversation message
 */
app.post('/api/conversations', authenticate, async (req, res) => {
  try {
    const { message } = req.body
    const user = await User.findById(req.user.id)
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      })
    }
    
    if (message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message cannot be empty'
      })
    }
    
    if (message.length > 1000) {
      return res.status(400).json({
        error: 'Message is too long. Maximum 1000 characters allowed.'
      })
    }
    
    // Map role to designation
    const designationMap = {
      'campus-in-charge': 'Campus In-Charge',
      'spoc': 'SPOC',
      'admin-office': 'Admin Office'
    }
    
    const conversation = await Conversation.create({
      user_id: user.id,
      message: message.trim(),
      username: user.name,
      designation: designationMap[user.role] || user.role
    })
    
    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      conversation
    })
  } catch (error) {
    console.error('Create conversation error:', error)
    res.status(500).json({
      error: 'Failed to post message'
    })
  }
})

/**
 * Get single conversation by ID
 */
app.get('/api/conversations/:id', authenticate, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      })
    }
    
    res.json({
      success: true,
      conversation
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    res.status(500).json({
      error: 'Failed to fetch conversation'
    })
  }
})

/**
 * Update conversation message (only by author)
 */
app.put('/api/conversations/:id', authenticate, async (req, res) => {
  try {
    const { message } = req.body
    
    const conversation = await Conversation.findById(req.params.id)
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      })
    }
    
    // Only author can edit
    if (conversation.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied. Only the message author can edit.'
      })
    }
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      })
    }
    
    if (message.trim().length === 0) {
      return res.status(400).json({
        error: 'Message cannot be empty'
      })
    }
    
    if (message.length > 1000) {
      return res.status(400).json({
        error: 'Message is too long. Maximum 1000 characters allowed.'
      })
    }
    
    const updatedConversation = await Conversation.update(req.params.id, {
      message: message.trim()
    })
    
    res.json({
      success: true,
      message: 'Message updated successfully',
      conversation: updatedConversation
    })
  } catch (error) {
    console.error('Update conversation error:', error)
    res.status(500).json({
      error: 'Failed to update message'
    })
  }
})

/**
 * Delete conversation (only by author or admin)
 */
app.delete('/api/conversations/:id', authenticate, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found'
      })
    }
    
    const user = await User.findById(req.user.id)
    
    // Only author or admin can delete
    if (conversation.user_id !== req.user.id && user.role !== 'admin-office') {
      return res.status(403).json({
        error: 'Access denied'
      })
    }
    
    await Conversation.delete(req.params.id)
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    })
  } catch (error) {
    console.error('Delete conversation error:', error)
    res.status(500).json({
      error: 'Failed to delete message'
    })
  }
})

/**
 * Search conversations
 */
app.get('/api/conversations/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Search query (q) is required'
      })
    }
    
    if (q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters'
      })
    }
    
    const conversations = await Conversation.search(q.trim())
    
    res.json({
      success: true,
      conversations,
      query: q
    })
  } catch (error) {
    console.error('Search conversations error:', error)
    res.status(500).json({
      error: 'Failed to search conversations'
    })
  }
})

app.listen(PORT, HOST, () => {
  console.log(`ðŸš€ Server is running on http://${HOST}:${PORT}`)
  console.log(`ðŸ“¡ API Health Check: http://${HOST}:${PORT}/api/health`)
  
  if (process.env.NODE_ENV === 'production') {
    console.log('ðŸ”’ Production mode: Security headers enabled')
    console.log('ðŸ“ Static files served from frontend/dist')
  }
})


