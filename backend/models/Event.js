import { getDatabase } from '../database/db.js'

// Lazy import EventStatus to avoid circular dependency
let EventStatusClass = null
const getEventStatus = async () => {
  if (!EventStatusClass) {
    const module = await import('./EventStatus.js')
    EventStatusClass = module.EventStatus
  }
  return EventStatusClass
}

/**
 * Event Model
 */
export class Event {
  /**
   * Find event by ID
   */
  static findById(id) {
    const db = getDatabase()
    return db.prepare(`
      SELECT e.*, 
        u.name as creator_name, 
        u.email as creator_email,
        submitter.name as submitter_name,
        submitter.email as submitter_email,
        es.remarks as latest_remarks
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users submitter ON e.submitted_by = submitter.id
      LEFT JOIN event_status es ON es.id = (
        SELECT id FROM event_status 
        WHERE event_id = e.id 
        ORDER BY reviewed_at DESC, rowid DESC
        LIMIT 1
      )
      WHERE e.id = ?
    `).get(id)
  }

  /**
   * Create a new event
   */
  static create(eventData) {
    const db = getDatabase()
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Determine status and submission metadata
    const status = eventData.status || 'draft'
    const submittedAt = status === 'pending' ? new Date().toISOString() : null
    const submittedBy = status === 'pending' ? eventData.created_by : null
    
    db.prepare(`
      INSERT INTO events (
        id, title, description, duration, credits, start_date, end_date,
        status, created_by, campus, branch, submitted_at, submitted_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      eventData.title,
      eventData.description || null,
      eventData.duration || null,
      eventData.credits || null,
      eventData.start_date,
      eventData.end_date || null,
      status,
      eventData.created_by,
      eventData.campus || null,
      eventData.branch || null,
      submittedAt,
      submittedBy
    )
    
    // Create initial status entry (async, but we'll handle it)
    getEventStatus().then(EventStatus => {
      EventStatus.create({
        event_id: id,
        status: eventData.status || 'draft',
        reviewed_by: eventData.created_by
      })
    }).catch(err => console.error('Error creating initial status:', err))
    
    return this.findById(id)
  }

  /**
   * Update event
   */
  static update(id, updates) {
    const db = getDatabase()
    const allowedFields = ['title', 'description', 'duration', 'credits', 'start_date', 'end_date', 'status', 'campus', 'branch']
    const fields = []
    const values = []
    
    // Handle submission metadata
    if (updates.status === 'pending') {
      // Check if this is a new submission (transitioning from draft)
      const currentEvent = this.findById(id)
      if (currentEvent && currentEvent.status === 'draft') {
        fields.push('submitted_at = ?')
        values.push(new Date().toISOString())
        
        if (updates.submitted_by) {
          fields.push('submitted_by = ?')
          values.push(updates.submitted_by)
        }
      }
    }
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    
    if (fields.length === 0) {
      return this.findById(id)
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    
    // If status changed, create new status entry
    if (updates.status) {
      getEventStatus().then(EventStatus => {
        EventStatus.create({
          event_id: id,
          status: updates.status,
          reviewed_by: updates.reviewed_by || updates.submitted_by || null,
          remarks: updates.remarks || null
        })
      }).catch(err => console.error('Error creating status entry:', err))
    }
    
    return this.findById(id)
  }

  /**
   * Delete event
   */
  static delete(id) {
    const db = getDatabase()
    return db.prepare('DELETE FROM events WHERE id = ?').run(id)
  }

  /**
   * Get events with role-based filtering
   */
  static findAll(filters = {}) {
    const db = getDatabase()
    let query = `
      SELECT e.*, 
        u.name as creator_name, 
        u.email as creator_email,
        submitter.name as submitter_name,
        submitter.email as submitter_email,
        es.remarks as latest_remarks
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users submitter ON e.submitted_by = submitter.id
      LEFT JOIN event_status es ON es.id = (
        SELECT id FROM event_status 
        WHERE event_id = e.id 
        ORDER BY reviewed_at DESC, rowid DESC
        LIMIT 1
      )
      WHERE 1=1
    `
    const params = []
    
    // Role-based data segregation
    if (filters.userRole === 'campus-in-charge') {
      // Campus In-Charge can see events from their campus only
      if (filters.userCampus) {
        query += ' AND e.campus = ?'
        params.push(filters.userCampus)
      }
    } else if (filters.userRole === 'spoc') {
      // SPOC can see events from their campus and branch
      if (filters.userCampus) {
        query += ' AND e.campus = ?'
        params.push(filters.userCampus)
      }
      if (filters.userBranch) {
        query += ' AND e.branch = ?'
        params.push(filters.userBranch)
      }
    }
    // Admin can see all events (no additional filters)
    
    if (filters.status) {
      query += ' AND e.status = ?'
      params.push(filters.status)
    }
    
    if (filters.campus) {
      query += ' AND e.campus = ?'
      params.push(filters.campus)
    }
    
    if (filters.branch) {
      query += ' AND e.branch = ?'
      params.push(filters.branch)
    }
    
    if (filters.created_by) {
      query += ' AND e.created_by = ?'
      params.push(filters.created_by)
    }
    
    if (filters.date_from) {
      query += ' AND e.start_date >= ?'
      params.push(filters.date_from)
    }
    
    if (filters.date_to) {
      query += ' AND e.end_date <= ?'
      params.push(filters.date_to)
    }
    
    query += ' ORDER BY e.created_at DESC'
    
    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }
    
    return db.prepare(query).all(...params)
  }

  /**
   * Get events by creator
   */
  static findByCreator(userId) {
    return this.findAll({ created_by: userId })
  }

  /**
   * Get events by status
   */
  static findByStatus(status, userRole = null, userCampus = null, userBranch = null) {
    return this.findAll({ 
      status, 
      userRole, 
      userCampus, 
      userBranch 
    })
  }
}

// EventStatus imported dynamically to avoid circular dependency

