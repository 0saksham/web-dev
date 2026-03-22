import multer from 'multer'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, '../uploads')
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true })
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize by media type
    let subDir = 'general'
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images'
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos'
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document') || file.mimetype.includes('word')) {
      subDir = 'documents'
    }
    
    const destPath = join(uploadsDir, subDir)
    if (!existsSync(destPath)) {
      mkdirSync(destPath, { recursive: true })
    }
    cb(null, destPath)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = file.originalname.split('.').pop()
    cb(null, `event-${uniqueSuffix}.${ext}`)
  }
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/bmp', 'image/tiff'
  ]
  const allowedVideoTypes = [
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/avi', 'video/x-matroska', 'video/x-flv'
  ]
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ]

  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes, ...allowedDocTypes]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only images, videos, and PDF/DOC files are allowed.'), false)
  }
}

// Configure multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

// Get media type from mime type
export const getMediaType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') || 
      mimeType.includes('powerpoint') || mimeType.includes('excel') || mimeType.includes('text/plain') ||
      mimeType.includes('zip') || mimeType.includes('compressed')) {
    return 'document'
  }
  return 'document'
}

// Get relative file path for storage in database
export const getRelativePath = (filePath) => {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const uploadsIndex = normalizedPath.indexOf('/uploads/')
  if (uploadsIndex !== -1) {
    return normalizedPath.substring(uploadsIndex)
  }
  return normalizedPath
}

