import { getDatabase } from '../database/db.js'

/**
 * Event Status Model
 */
export class EventStatus {
  /**
   * Find status by ID
   */
  static async findById(id) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE es.id = $1
    `, [id])
    return res.rows[0] || null
  }

  /**
   * Create new status entry
   */
  static async create(statusData) {
    const db = getDatabase()
    const id = `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    await db.query(`
      INSERT INTO event_status (id, event_id, status, remarks, reviewed_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      id,
      statusData.event_id,
      statusData.status,
      statusData.remarks || null,
      statusData.reviewed_by || null
    ])
    
    return this.findById(id)
  }

  /**
   * Get all status history for an event
   */
  static async findByEventId(eventId) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE es.event_id = $1
      ORDER BY es.reviewed_at DESC
    `, [eventId])
    return res.rows
  }

  /**
   * Get current status for an event
   */
  static async getCurrentStatus(eventId) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE es.event_id = $1
      ORDER BY es.reviewed_at DESC
      LIMIT 1
    `, [eventId])
    return res.rows[0] || null
  }

  /**
   * Get status history by status type
   */
  static async findByEventAndStatus(eventId, status) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE es.event_id = $1 AND es.status = $2
      ORDER BY es.reviewed_at DESC
    `, [eventId, status])
    return res.rows
  }

  /**
   * Get all status entries with filters
   */
  static async findAll(filters = {}) {
    const db = getDatabase()
    let query = `
      SELECT es.*, u.name as reviewer_name, u.email as reviewer_email
      FROM event_status es
      LEFT JOIN users u ON es.reviewed_by = u.id
      WHERE 1=1
    `
    const params = []
    let i = 1
    
    if (filters.event_id) {
      query += ` AND es.event_id = $${i++}`
      params.push(filters.event_id)
    }
    
    if (filters.status) {
      query += ` AND es.status = $${i++}`
      params.push(filters.status)
    }
    
    if (filters.reviewed_by) {
      query += ` AND es.reviewed_by = $${i++}`
      params.push(filters.reviewed_by)
    }
    
    query += ' ORDER BY es.reviewed_at DESC'
    
    const res = await db.query(query, params)
    return res.rows
  }
}



