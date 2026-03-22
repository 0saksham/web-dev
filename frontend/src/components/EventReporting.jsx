import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { campusLabels, branchLabels } from '../utils/campusValidation';
import './EventReporting.css';

const EventReporting = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    campus: 'all',
    branch: 'all',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchApprovedEvents();
  }, [filters, user]);

  const fetchApprovedEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      
      // Only fetch approved events
      params.append('status', 'approved');
      
      // For Campus In-Charge and SPOC, only show their events
      if (user && user.role === 'campus-in-charge') {
        params.append('campus', user.campus);
      } else if (user && user.role === 'spoc') {
        params.append('campus', user.campus);
        params.append('branch', user.branch);
      }
      
      // Add filters
      if (filters.campus !== 'all') params.append('campus', filters.campus);
      if (filters.branch !== 'all') params.append('branch', filters.branch);
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
      console.error('Fetch approved events error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalCredits = events.reduce((sum, event) => sum + (event.credits || 0), 0);
  const totalEvents = events.length;
  const eventsByCampus = events.reduce((acc, event) => {
    acc[event.campus] = (acc[event.campus] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="event-reporting">
      <div className="reporting-header">
        <h2>Event Reporting & Analytics</h2>
        <p>View approved events and analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>{totalEvents}</h3>
          <p>Total Events</p>
        </div>
        <div className="summary-card">
          <h3>{totalCredits.toFixed(2)}</h3>
          <p>Total Credits</p>
        </div>
        <div className="summary-card">
          <h3>{Object.keys(eventsByCampus).length}</h3>
          <p>Active Campuses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="reporting-filters">
        <div className="filter-group">
          <label>Campus:</label>
          <select 
            value={filters.campus} 
            onChange={(e) => handleFilterChange('campus', e.target.value)}
            className="filter-select"
            disabled={user && (user.role === 'campus-in-charge' || user.role === 'spoc')}
          >
            {user && (user.role === 'campus-in-charge' || user.role === 'spoc') ? (
              <option value={user.campus}>{campusLabels[user.campus] || user.campus}</option>
            ) : (
              <>
                <option value="all">All Campuses</option>
                {Object.entries(campusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </>
            )}
          </select>
        </div>

        <div className="filter-group">
          <label>Branch:</label>
          <select 
            value={filters.branch} 
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="filter-select"
            disabled={user && user.role === 'spoc'}
          >
            {user && user.role === 'spoc' ? (
              <option value={user.branch}>{branchLabels[user.branch] || user.branch}</option>
            ) : (
              <>
                <option value="all">All Branches</option>
                {Object.entries(branchLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </>
            )}
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
          <p>Loading approved events...</p>
        </div>
      ) : (
        <div className="events-list">
          <div className="events-count">
            Showing {events.length} approved event{events.length !== 1 ? 's' : ''}
          </div>

          <div className="events-grid">
            {events.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-header">
                  <h3 className="event-title">{event.title}</h3>
                  <span className="status-badge status-approved">
                    Approved
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
              <p>No approved events found matching the current filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventReporting;