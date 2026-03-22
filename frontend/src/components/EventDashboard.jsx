import { useState, useEffect } from 'react'
import { apiRequest } from '../utils/api'
import EventForm from './EventForm'
import EventList from './EventList'
import EventReporting from './EventReporting'
import './EventDashboard.css'

const EventDashboard = ({ user }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [activeTab, setActiveTab] = useState('manage') // 'manage' or 'report'

  useEffect(() => {
    fetchEvents()
  }, [filterStatus])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }

      const response = await apiRequest(`/events?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setEvents(data.events || [])
      } else {
        setError(data.error || 'Failed to fetch events')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Fetch events error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = () => {
    setEditingEvent(null)
    setShowCreateForm(true)
  }

  const handleEditEvent = (event) => {
    // Only allow editing rejected events
    if (event.status === 'rejected') {
      setEditingEvent(event)
      setShowCreateForm(true)
    }
  }

  const handleFormClose = () => {
    setShowCreateForm(false)
    setEditingEvent(null)
  }

  const handleFormSuccess = () => {
    setShowCreateForm(false)
    setEditingEvent(null)
    fetchEvents()
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      const response = await apiRequest(`/events/${eventId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        fetchEvents()
      } else {
        alert(data.error || 'Failed to delete event')
      }
    } catch (err) {
      alert('Network error. Please try again.')
      console.error('Delete event error:', err)
    }
  }

  return (
    <div className="event-dashboard">
      <div className="event-dashboard-header">
        <div>
          <h2>IKS Events Management</h2>
          <p>Create and manage your events</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreateEvent}>
          + Create New Event
        </button>
      </div>

      {/* Tabs for Management and Reporting */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Event Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Reporting & Analytics
        </button>
      </div>

      {activeTab === 'manage' && (
        <>
          <div className="event-filters">
            <label>Filter by Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Events</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {showCreateForm && (
            <EventForm
              user={user}
              event={editingEvent}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
          )}

          <EventList
            events={events}
            loading={loading}
            user={user}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onRefresh={fetchEvents}
          />
        </>
      )}

      {activeTab === 'report' && (
        <EventReporting />
      )}
    </div>
  )
}

export default EventDashboard

