import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { campusLabels, branchLabels } from '../utils/campusValidation';
import ErrorBoundary from './ErrorBoundary';
import './AdminDashboard.css';

const AdminDashboard = ({ onEventUpdate }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userLookupLoading, setUserLookupLoading] = useState(false);
  const [userLookupError, setUserLookupError] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userIdQuery, setUserIdQuery] = useState('');
  const [userRoleQuery, setUserRoleQuery] = useState('all');
  const [filters, setFilters] = useState({
    campus: 'all',
    branch: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      
      // Add filters
      if (filters.campus !== 'all') params.append('campus', filters.campus);
      if (filters.branch !== 'all') params.append('branch', filters.branch);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);

      const response = await apiRequest(`/events?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch events error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventUpdate = () => {
    fetchEvents();
    if (onEventUpdate) {
      onEventUpdate();
    }
  };

  const fetchUsers = async () => {
    try {
      setUserLookupLoading(true);
      setUserLookupError('');
      setUserResults([]);
      const params = new URLSearchParams();
      if (userIdQuery.trim()) params.append('id', userIdQuery.trim());
      if (userRoleQuery !== 'all') params.append('role', userRoleQuery);
      const response = await apiRequest(`/admin/users?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        if (data.user) {
          setUserResults([data.user]);
        } else {
          setUserResults(Array.isArray(data.users) ? data.users : []);
        }
      } else {
        setUserLookupError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setUserLookupError('Network error. Please try again.');
    } finally {
      setUserLookupLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const handleBackToList = () => {
    setSelectedEvent(null);
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-unknown';
    const statusClasses = {
      draft: 'status-draft',
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return statusClasses[status] || 'status-unknown';
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (selectedEvent) {
    return (
      <ErrorBoundary onReset={handleBackToList}>
        <EventDetailView 
          event={selectedEvent} 
          onBack={handleBackToList} 
          onUpdate={handleEventUpdate}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h2>IKS Admin Dashboard</h2>
        <p>Manage all events across all campuses and branches</p>
      </div>

      <div className="admin-filters" style={{ marginBottom: '10px' }}>
        <div className="filter-group">
          <label>User ID:</label>
          <input
            type="text"
            value={userIdQuery}
            onChange={(e) => setUserIdQuery(e.target.value)}
            placeholder="Enter user id"
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label>User Role:</label>
          <select
            value={userRoleQuery}
            onChange={(e) => setUserRoleQuery(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="campus-in-charge">Campus In-Charge</option>
            <option value="spoc">SPOC</option>
            <option value="admin-office">Admin Office</option>
          </select>
        </div>
        <div className="filter-group">
          <label>&nbsp;</label>
          <button className="btn btn-primary" onClick={fetchUsers} disabled={userLookupLoading}>
            {userLookupLoading ? 'Searching...' : 'Search Users'}
          </button>
        </div>
      </div>

      {userLookupError && (
        <div className="error-message">
          {userLookupError}
        </div>
      )}

      {userResults.length > 0 && (
        <div className="events-list" style={{ marginBottom: '20px' }}>
          <div className="events-count">
            Showing {userResults.length} user{userResults.length !== 1 ? 's' : ''}
          </div>
          <div className="events-grid">
            {userResults.map(u => (
              <div key={u.id} className="event-card">
                <div className="event-header">
                  <h3 className="event-title">{u.name || u.email}</h3>
                  <span className="status-badge">{u.role}</span>
                </div>
                <div className="event-details">
                  <div className="event-meta">
                    <div className="meta-item">
                      <strong>ID:</strong> {u.id}
                    </div>
                    <div className="meta-item">
                      <strong>Email:</strong> {u.email}
                    </div>
                    {u.campus && (
                      <div className="meta-item">
                        <strong>Campus:</strong> {campusLabels[u.campus] || u.campus}
                      </div>
                    )}
                    {u.branch && (
                      <div className="meta-item">
                        <strong>Branch:</strong> {branchLabels[u.branch] || u.branch}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <div className="filter-group">
          <label>Campus:</label>
          <select 
            value={filters.campus} 
            onChange={(e) => handleFilterChange('campus', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Campuses</option>
            {Object.entries(campusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Branch:</label>
          <select 
            value={filters.branch} 
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Branches</option>
            {Object.entries(branchLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date From:</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Date To:</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="filter-input"
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <p>Loading events...</p>
        </div>
      ) : (
        <div className="events-list">
          <div className="events-count">
            Showing {events.length} event{events.length !== 1 ? 's' : ''}
          </div>

          <div className="events-grid">
            {events.map(event => (
              <div 
                key={event.id} 
                className="event-card"
                onClick={() => handleEventClick(event)}
              >
                <div className="event-header">
                  <h3 className="event-title">{event.title}</h3>
                  <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                    {formatStatus(event.status)}
                  </span>
                </div>
                
                <div className="event-details">
                  <p className="event-description">
                    {event.description ? event.description.substring(0, 100) + '...' : 'No description provided'}
                  </p>
                  
                  <div className="event-meta">
                    <div className="meta-item">
                      <strong>Campus:</strong> {campusLabels[event.campus] || event.campus}
                    </div>
                    {event.branch && (
                      <div className="meta-item">
                        <strong>Branch:</strong> {branchLabels[event.branch] || event.branch}
                      </div>
                    )}
                    <div className="meta-item">
                      <strong>Dates:</strong> {formatDate(event.start_date)} - {formatDate(event.end_date)}
                    </div>
                    <div className="meta-item">
                      <strong>Duration:</strong> {event.duration} hours
                    </div>
                    <div className="meta-item">
                      <strong>Credits:</strong> {event.credits}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {events.length === 0 && !loading && (
            <div className="no-events">
              <p>No events found matching the current filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EventDetailView = ({ event, onBack, onUpdate }) => {
  const [media, setMedia] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Safety check for event prop
  if (!event) {
    return (
      <div className="event-detail-view">
        <div className="error-message">Error: No event data provided.</div>
        <button className="btn btn-secondary" onClick={onBack}>Back to List</button>
      </div>
    );
  }

  useEffect(() => {
    fetchEventDetails();
  }, [event.id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      
      const response = await apiRequest(`/events/${event.id}`);
      const data = await response.json();

      if (response.ok) {
        setMedia(Array.isArray(data?.event?.media) ? data.event.media : []);
        setStatusHistory(Array.isArray(data?.event?.status_history) ? data.event.status_history : []);
      }
    } catch (err) {
      console.error('Fetch event details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-unknown';
    const statusClasses = {
      draft: 'status-draft',
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return statusClasses[status] || 'status-unknown';
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="event-detail-view">
        <button className="btn btn-secondary back-btn" onClick={onBack}>
          â† Back to Events
        </button>
        <div className="loading-state">
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = async () => {
    if (!reviewStatus) {
      setReviewError('Please select an action (Approve or Reject)');
      return;
    }
    
    if (!reviewRemarks.trim()) {
      setReviewError('Remarks are required for all actions');
      return;
    }
    
    const action = reviewStatus === 'approved' ? 'approve' : 'reject';
    const confirmMessage = `Are you sure you want to ${action} this event? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsProcessing(true);
    setReviewError('');
    
    try {
      const response = await apiRequest(`/events/${event.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: reviewStatus,
          remarks: reviewRemarks
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh the event details
        fetchEventDetails();
        setReviewStatus('');
        setReviewRemarks('');
        alert(`Event ${reviewStatus} successfully!`);
        if (onUpdate) onUpdate();
      } else {
        setReviewError(data.error || 'Failed to update event status');
      }
    } catch (err) {
      setReviewError('Network error. Please try again.');
      console.error('Review submission error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const canReview = event.status === 'pending';

  const handleFileDownload = async (mediaId, fileName) => {
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
  };

  return (
    <div className="event-detail-view">
      <button className="btn btn-secondary back-btn" onClick={onBack}>
        â† Back to Events
      </button>

      <div className="event-detail-header">
        <h2>{event.title}</h2>
        <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
          {formatStatus(event.status)}
        </span>
      </div>

      <div className="event-detail-content">
        <div className="event-info">
          <div className="info-section">
            <h3>Event Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Description:</strong>
                <p>{event.description || 'No description provided'}</p>
              </div>
              <div className="info-item">
                <strong>Campus:</strong>
                <p>{campusLabels[event.campus] || event.campus}</p>
              </div>
              {event.branch && (
                <div className="info-item">
                  <strong>Branch:</strong>
                  <p>{branchLabels[event.branch] || event.branch}</p>
                </div>
              )}
              <div className="info-item">
                <strong>Dates:</strong>
                <p>{formatDate(event.start_date)} - {formatDate(event.end_date)}</p>
              </div>
              <div className="info-item">
                <strong>Duration:</strong>
                <p>{event.duration} hours</p>
              </div>
              <div className="info-item">
                <strong>Credits:</strong>
                <p>{event.credits}</p>
              </div>
              <div className="info-item">
                <strong>Created By:</strong>
                <p>{event.creator_name || event.created_by}</p>
              </div>
              {(event.remarks || event.latest_remarks) && (
                <div className="info-item">
                  <strong>Remarks:</strong>
                  <p>{event.remarks || event.latest_remarks}</p>
                </div>
              )}
            </div>
          </div>

          {media.length > 0 && (
            <div className="info-section">
              <h3>Media</h3>
              <div className="media-grid">
                {media.map(item => (
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
                          onClick={() => handleFileDownload(item.id, item.file_name)}
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

          {statusHistory.length > 0 && (
            <div className="info-section">
              <h3>Status History</h3>
              <div className="status-history">
                {statusHistory.map((status, index) => (
                  <div key={index} className="status-item">
                    <div className="status-info">
                      <span className={`status-badge ${getStatusBadgeClass(status.status)}`}>
                        {formatStatus(status.status)}
                      </span>
                      <span className="status-date">{formatDate(status.reviewed_at)}</span>
                    </div>
                    {status.remarks && (
                      <div className="status-remarks">
                        <strong>Remarks:</strong> {status.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Review Section */}
          {canReview && (
            <div className="info-section admin-review-section">
              <h3>Admin Review</h3>
              <div className="admin-review-form">
                <div className="review-controls">
                  <button 
                    className={`btn ${reviewStatus === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setReviewStatus('approved')}
                    disabled={isProcessing}
                  >
                    Approve
                  </button>
                  <button 
                    className={`btn ${reviewStatus === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setReviewStatus('rejected')}
                    disabled={isProcessing}
                  >
                    Reject
                  </button>
                </div>
                
                <div className="review-remarks">
                  <label htmlFor="review-remarks">Remarks (Required):</label>
                  <textarea
                    id="review-remarks"
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="Provide your remarks for this decision..."
                    rows={4}
                    disabled={isProcessing}
                  />
                </div>
                
                {reviewError && (
                  <div className="error-message">
                    {reviewError}
                  </div>
                )}
                
                <button 
                  className="btn btn-primary" 
                  onClick={handleReviewSubmit}
                  disabled={isProcessing || !reviewStatus || !reviewRemarks.trim()}
                >
                  {isProcessing ? 'Processing...' : 'Submit Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

