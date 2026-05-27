import { useState } from 'react'
import { apiRequest } from '../utils/api'
import { campusLabels, branchLabels } from '../utils/campusValidation'
import './EventList.css'

const EventList = ({ events, loading, user, onEdit, onDelete, onRefresh }) => {
  const [expandedEvent, setExpandedEvent] = useState(null)
  const [statusHistory, setStatusHistory] = useState({})
  const [submittingEvent, setSubmittingEvent] = useState(null)

  const getStatusBadgeClass = (status) => {
    const classes = {
      draft: 'status-draft',
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    }
    return classes[status] || 'status-default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
    return labels[status] || status
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSubmitEvent = async (eventId) => {
    if (!window.confirm('Submit this event for approval? You will not be able to edit it until it is reviewed.')) {
      return
    }

    setSubmittingEvent(eventId)
    try {
      const response = await apiRequest(`/events/${eventId}/submit`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        onRefresh()
      } else {
        alert(data.error || 'Failed to submit event')
      }
    } catch (err) {
      alert('Network error. Please try again.')
      console.error('Submit event error:', err)
    } finally {
      setSubmittingEvent(null)
    }
  }

  const toggleEventDetails = async (eventId) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null)
    } else {
      setExpandedEvent(eventId)
      // Fetch status history if not already loaded
      if (!statusHistory[eventId]) {
        try {
          const response = await apiRequest(`/events/${eventId}`)
          const data = await response.json()
          if (response.ok && data.event) {
            setStatusHistory(prev => ({
              ...prev,
              [eventId]: data.event.status_history || []
            }))
          }
        } catch (err) {
          console.error('Error fetching event details:', err)
        }
      }
    }
  }
  
  const handleDownloadClick = async (e, mediaId, fileName) => {
    e.preventDefault()
    
    try {
      // Get the auth token
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        alert('You must be logged in to download files')
        return
      }
      
      // Create a temporary link and use it to download
      const downloadUrl = `/api/media/${mediaId}/download`
      const response = await fetch(`https://iks-backend-sq2b.onrender.com/api${downloadUrl}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to download file')
        return
      }
      
      // Create blob from response and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download file. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="event-list-loading">
        <p>Loading events...</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="event-list-empty">
        <p>No events found. Create your first event to get started!</p>
      </div>
    )
  }

  return (
    <div className="event-list">
      {events.map(event => (
        <div key={event.id} className="event-card">
          <div className="event-card-header">
            <div className="event-title-section">
              <h3>{event.title}</h3>
              <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                {getStatusLabel(event.status)}
              </span>
            </div>
            <div className="event-actions">
              {event.status === 'draft' && event.created_by === user?.id && (
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handleSubmitEvent(event.id)}
                  disabled={submittingEvent === event.id}
                  title="Submit for Approval"
                >
                  {submittingEvent === event.id ? 'Submitting...' : 'Submit'}
                </button>
              )}
              {event.status === 'rejected' && (
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => onEdit(event)}
                  title="Edit Rejected Event"
                >
                  Edit
                </button>
              )}
              {event.created_by === user?.id && (
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => onDelete(event.id)}
                  title="Delete Event"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="event-card-body">
            {event.description && (
              <p className="event-description">{event.description}</p>
            )}

            <div className="event-details-grid">
              <div className="event-detail">
                <strong>Start:</strong> {formatDate(event.start_date)}
              </div>
              {event.end_date && (
                <div className="event-detail">
                  <strong>End:</strong> {formatDate(event.end_date)}
                </div>
              )}
              {event.duration && (
                <div className="event-detail">
                  <strong>Duration:</strong> {event.duration} minutes
                </div>
              )}
              {event.credits && (
                <div className="event-detail">
                  <strong>Credits:</strong> {event.credits}
                </div>
              )}
              {event.campus && (
                <div className="event-detail">
                  <strong>Campus:</strong> {campusLabels[event.campus] || event.campus}
                </div>
              )}
              {event.branch && (
                <div className="event-detail">
                  <strong>Branch:</strong> {branchLabels[event.branch] || event.branch}
                </div>
              )}
              <div className="event-detail">
                <strong>Created:</strong> {formatDate(event.created_at)}
              </div>
              {event.submitted_at && (
                <div className="event-detail">
                  <strong>Submitted:</strong> {formatDate(event.submitted_at)}
                </div>
              )}
              {event.submitted_by && event.submitter_name && (
                <div className="event-detail">
                  <strong>Submitted by:</strong> {event.submitter_name}
                </div>
              )}
            </div>

            <button
              className="toggle-details-btn"
              onClick={() => toggleEventDetails(event.id)}
            >
              {expandedEvent === event.id ? 'Hide' : 'Show'} Status & Remarks
            </button>

            {expandedEvent === event.id && (
              <div className="event-status-section">
                <h4>Status History & Admin Remarks</h4>
                
                {/* Show submission info if available */}
                {event.submitted_at && (
                  <div className="submission-info">
                    <p><strong>Submitted for Approval:</strong> {formatDate(event.submitted_at)}</p>
                    {event.submitter_name && (
                      <p><strong>Submitted by:</strong> {event.submitter_name}</p>
                    )}
                  </div>
                )}
                
                {statusHistory[event.id] && statusHistory[event.id].length > 0 ? (
                  <div className="status-history">
                    {statusHistory[event.id].map((status, index) => (
                      <div key={status.id || index} className="status-entry">
                        <div className="status-entry-header">
                          <span className={`status-badge ${getStatusBadgeClass(status.status)}`}>
                            {getStatusLabel(status.status)}
                          </span>
                          <span className="status-date">
                            {formatDate(status.reviewed_at)}
                          </span>
                        </div>
                        {status.reviewer_name && (
                          <p className="status-reviewer">
                            {status.status === 'pending' ? 'Submitted by' : 'Reviewed by'}: <strong>{status.reviewer_name}</strong>
                            {status.reviewer_email && ` (${status.reviewer_email})`}
                          </p>
                        )}
                        {status.remarks && (
                          <div className="status-remarks">
                            <strong>Remarks:</strong>
                            <p>{status.remarks}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-status-history">No status history available</p>
                )}
                
                {/* Media Files */}
                {event.media && event.media.length > 0 && (
                  <div className="media-section">
                    <h5>Attached Files</h5>
                    <div className="media-grid">
                      {event.media.map(item => (
                        <div key={item.id} className="media-item">
                          {item.media_type === 'image' ? (
                            <img 
                              src={item.file_path} 
                              alt={item.file_name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : item.media_type === 'video' ? (
                            <video controls>
                              <source src={item.file_path} type={item.mime_type} />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <div className="file-download-container">
                              <div className="file-info">
                                <span className="file-name">{item.file_name}</span>
                                <span className="file-size">{(item.file_size / 1024).toFixed(2)} KB</span>
                              </div>
                              <button 
                                className="btn btn-secondary btn-small"
                                onClick={(e) => handleDownloadClick(e, item.id, item.file_name)}
                              >
                                Download
                              </button>
                            </div>
                          )}
                          <div className="media-info" style={{ display: 'none' }}>
                            <p><strong>Name:</strong> {item.file_name}</p>
                            <p><strong>Type:</strong> {item.media_type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default EventList


