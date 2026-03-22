import { useState, useEffect, useRef } from 'react'
import { apiRequest } from '../utils/api'
import { campusLabels, branchLabels } from '../utils/campusValidation'
import './EventForm.css'

const EventForm = ({ user, event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    credits: '',
    start_date: '',
    end_date: '',
    campus: user?.campus || '',
    branch: user?.branch || ''
  })
  const [files, setFiles] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const fileInputRef = useRef(null)

  const isEditMode = !!event

  // Allowed file types
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff']
  const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/avi', 'video/x-matroska', 'video/x-flv']
  const ALLOWED_DOC_TYPES = [
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
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        duration: event.duration || '',
        credits: event.credits || '',
        start_date: event.start_date ? event.start_date.slice(0, 16) : '',
        end_date: event.end_date ? event.end_date.slice(0, 16) : '',
        campus: event.campus || user?.campus || '',
        branch: event.branch || user?.branch || ''
      })
      // Load existing media files
      if (event.media && event.media.length > 0) {
        setUploadedFiles(event.media)
      }
    } else {
      // Set default campus/branch from user
      setFormData(prev => ({
        ...prev,
        campus: user?.campus || '',
        branch: user?.branch || ''
      }))
    }
  }, [event, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const getFileType = (file) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image'
    if (ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video'
    if (ALLOWED_DOC_TYPES.includes(file.type)) return 'document'
    return 'unknown'
  }

  const validateFile = (file) => {
    const fileType = getFileType(file)
    if (fileType === 'unknown') {
      return { valid: false, error: `File type not supported. Allowed: Images, Videos, PDF/DOC` }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds 50MB limit` }
    }
    return { valid: true }
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const validFiles = []
    const errors = []

    selectedFiles.forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: getFileType(file),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        })
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    })

    if (errors.length > 0) {
      setError(errors.join('; '))
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (fileId) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId)
      // Revoke object URL for images
      const removed = prev.find(f => f.id === fileId)
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return updated
    })
  }

  const removeUploadedFile = async (fileId) => {
    try {
      const response = await apiRequest(`/events/${event?.id}/media/${fileId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
      }
    } catch (err) {
      console.error('Error removing file:', err)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateForm = (isDraft = false) => {
    if (!isDraft) {
      if (!formData.title.trim()) {
        setError('Title is required')
        return false
      }

      if (!formData.start_date) {
        setError('Start date is required')
        return false
      }
    }

    if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
      setError('End date must be after start date')
      return false
    }

    if (formData.duration && (isNaN(formData.duration) || formData.duration < 0)) {
      setError('Duration must be a positive number')
      return false
    }

    if (formData.credits && (isNaN(formData.credits) || formData.credits < 0)) {
      setError('Credits must be a positive number')
      return false
    }

    // Validate start date is not in the past
    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        setError('Start date cannot be in the past');
        return false;
      }
    }

    return true
  }

  const uploadFiles = async (eventId) => {
    const uploadPromises = files.map(async (fileObj) => {
      const formData = new FormData()
      formData.append('file', fileObj.file)
      formData.append('media_type', fileObj.type)

      const response = await apiRequest(`/events/${eventId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return data.media
      }
      throw new Error('File upload failed')
    })

    try {
      await Promise.all(uploadPromises)
      setFiles([]) // Clear uploaded files
    } catch (err) {
      console.error('Error uploading files:', err)
      throw err
    }
  }

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault()
    setError('')

    if (!validateForm(isDraft)) {
      return
    }

    if (isDraft) {
      setSavingDraft(true)
    } else {
      setLoading(true)
    }

    try {
      const eventData = {
        title: formData.title.trim() || 'Untitled Event',
        description: formData.description.trim() || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        credits: formData.credits ? parseFloat(formData.credits) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        campus: formData.campus || null,
        branch: formData.branch || null,
        status: 'draft' // Always create/update as draft
      }

      let response
      let eventId

      if (isEditMode) {
        // Update existing event
        response = await apiRequest(`/events/${event.id}`, {
          method: 'PUT',
          body: JSON.stringify(eventData)
        })
        eventId = event.id

        if (response.ok) {
          // If not draft and event was updated successfully, submit for approval
          if (!isDraft && event.status === 'draft') {
            const submitResponse = await apiRequest(`/events/${event.id}/submit`, {
              method: 'POST'
            })
            const submitData = await submitResponse.json()
            if (!submitResponse.ok) {
              setError(submitData.error || 'Failed to submit event for approval')
              setLoading(false)
              setSavingDraft(false)
              return
            }
          }
        }
      } else {
        // Create new event (always as draft)
        response = await apiRequest('/events', {
          method: 'POST',
          body: JSON.stringify(eventData)
        })
        
        const data = await response.json()
        
        if (response.ok) {
          eventId = data.event.id

          // If not draft, submit for approval after creation
          if (!isDraft) {
            const submitResponse = await apiRequest(`/events/${eventId}/submit`, {
              method: 'POST'
            })
            const submitData = await submitResponse.json()
            if (!submitResponse.ok) {
              setError(submitData.error || 'Event created but failed to submit for approval')
              setLoading(false)
              setSavingDraft(false)
              return
            }
          }
        }
      }

      if (response.ok) {
        // Upload files if any
        if (files.length > 0 && eventId) {
          try {
            await uploadFiles(eventId)
          } catch (err) {
            console.error('File upload error:', err)
            // Don't fail the whole operation if file upload fails
          }
        }
        onSuccess()
      } else {
        // In case of error, we need to get the error data from the response
        const errorData = await response.json().catch(() => ({}));
        // Show detailed error if available, otherwise generic message
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          setError(`${errorData.error}: ${errorData.details.join(', ')}`);
        } else {
          setError(errorData.error || 'Failed to save event')
        }
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Save event error:', err)
    } finally {
      setLoading(false)
      setSavingDraft(false)
    }
  }

  const handleSaveDraft = (e) => {
    handleSubmit(e, true)
  }

  return (
    <div className="event-form-overlay">
      <div className="event-form-modal">
        <div className="event-form-header">
          <h3>{isEditMode ? 'Edit Event' : 'Create New Event'}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form className="event-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Event Title {!isEditMode && '*'}</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required={!isEditMode}
              placeholder={isEditMode ? "Enter event title (optional for draft)" : "Enter event title"}
              maxLength={200}
            />
            <small className="form-hint">Maximum 200 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Event Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Enter detailed event description..."
              maxLength={2000}
            />
            <small className="form-hint">
              {formData.description.length}/2000 characters
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date">Start Date & Time {!isEditMode && '*'}</label>
              <input
                type="datetime-local"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required={!isEditMode}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_date">End Date & Time</label>
              <input
                type="datetime-local"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                min={formData.start_date}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 120"
              />
            </div>

            <div className="form-group">
              <label htmlFor="credits">Credits</label>
              <input
                type="number"
                id="credits"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          {user?.role === 'campus-in-charge' && (
            <div className="form-group">
              <label htmlFor="campus">Campus</label>
              <input
                type="text"
                id="campus"
                name="campus"
                value={campusLabels[formData.campus] || formData.campus}
                disabled
                className="disabled-input"
              />
            </div>
          )}

          {user?.role === 'spoc' && (
            <>
              <div className="form-group">
                <label htmlFor="campus">Campus</label>
                <input
                  type="text"
                  id="campus"
                  name="campus"
                  value={campusLabels[formData.campus] || formData.campus}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="branch">Branch</label>
                <input
                  type="text"
                  id="branch"
                  name="branch"
                  value={branchLabels[formData.branch] || formData.branch}
                  disabled
                  className="disabled-input"
                />
              </div>
            </>
          )}

          {/* File Upload Section */}
          <div className="form-group file-upload-section">
            <label>Event Files (Images, Videos, Documents)</label>
            <div className="file-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="file-upload" className="file-upload-label">
                <span className="upload-icon">📎</span>
                <span>Click to upload or drag and drop</span>
                <small>Images, Videos, PDF, DOC (Max 50MB per file)</small>
              </label>
            </div>

            {/* New Files Preview */}
            {files.length > 0 && (
              <div className="files-preview">
                <h4>New Files ({files.length})</h4>
                <div className="files-grid">
                  {files.map((fileObj) => (
                    <div key={fileObj.id} className="file-item">
                      {fileObj.preview ? (
                        <img src={fileObj.preview} alt={fileObj.name} className="file-preview-image" />
                      ) : (
                        <div className="file-icon">
                          {fileObj.type === 'video' ? '🎥' : '📄'}
                        </div>
                      )}
                      <div className="file-info">
                        <p className="file-name">{fileObj.name}</p>
                        <p className="file-size">{formatFileSize(fileObj.size)}</p>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeFile(fileObj.id)}
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Files (Edit Mode) */}
            {isEditMode && uploadedFiles.length > 0 && (
              <div className="files-preview">
                <h4>Existing Files ({uploadedFiles.length})</h4>
                <div className="files-grid">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="file-item">
                      {file.media_type === 'image' && file.file_path ? (
                        <img src={file.file_path} alt={file.file_name} className="file-preview-image" />
                      ) : (
                        <div className="file-icon">
                          {file.media_type === 'video' ? '🎥' : '📄'}
                        </div>
                      )}
                      <div className="file-info">
                        <p className="file-name">{file.file_name}</p>
                        {file.file_size && <p className="file-size">{formatFileSize(file.file_size)}</p>}
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeUploadedFile(file.id)}
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading || savingDraft}
            >
              Cancel
            </button>
            {!isEditMode && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleSaveDraft}
                disabled={loading || savingDraft}
              >
                {savingDraft ? 'Saving Draft...' : 'Save as Draft'}
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || savingDraft}
            >
              {loading ? 'Submitting...' : (isEditMode ? (event?.status === 'draft' ? 'Update & Submit for Review' : 'Update Event') : 'Submit for Review')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventForm

