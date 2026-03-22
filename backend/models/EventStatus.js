import { getDatabase } from '../database/db.js'

/**
 * Event Status Model
 */
export class EventStatus {
  /**
   * Find status by ID
   */
  static findById(id) {
    const db = getDatabase()
    return db.prepare(`
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE es.id = ?
    `).get(id)
  }

  /**
   * Create new status entry
   */
  static create(statusData) {
    const db = getDatabase()
    const id = `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    db.prepare(`
      INSERT INTO event_status (id, event_id, status, remarks, reviewed_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      statusData.event_id,
      statusData.status,
      statusData.remarks || null,
      statusData.reviewed_by || null
    )
    
    return this.findById(id)
  }

  /**
   * Get all status history for an event
   */
  static findByEventId(eventId) {
    const db = getDatabase()
    return db.prepare(`
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE es.event_id = ?
      ORDER BY es.reviewed_at DESC
    `).all(eventId)
  }

  /**
   * Get current status for an event
   */
  static getCurrentStatus(eventId) {
    const db = getDatabase()
    return db.prepare(`
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE es.event_id = ?
      ORDER BY es.reviewed_at DESC
      LIMIT 1
    `).get(eventId)
  }

  /**
   * Get status history by status type
   */
  static findByEventAndStatus(eventId, status) {
    const db = getDatabase()
    return db.prepare(`
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE es.event_id = ? AND es.status = ?
      ORDER BY es.reviewed_at DESC
    `).all(eventId, status)
  }

  /**
   * Get all status entries with filters
   */
  static findAll(filters = {}) {
    const db = getDatabase()
    let query = `
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE 1=1
    `
    const params = []
    
    if (filters.event_id) {
      query += ' AND es.event_id = ?'
      params.push(filters.event_id)
    }
    
    if (filters.status) {
      query += ' AND es.status = ?'
      params.push(filters.status)
    }
    
    if (filters.reviewed_by) {
      query += ' AND es.reviewed_by = ?'
      params.push(filters.reviewed_by)
    }
    
    query += ' ORDER BY es.reviewed_at DESC'
    
    return db.prepare(query).all(...params)
  }
}

