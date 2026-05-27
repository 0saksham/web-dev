import { getDatabase } from '../database/db.js'

/**
 * Notification Model
 */
export class Notification {
  /**
   * Create a new notification
   */
  static async create(notificationData) {
    const db = getDatabase()
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    await db.query(`
      INSERT INTO notifications (
        id, user_id, event_id, title, message, type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      id,
      notificationData.user_id,
      notificationData.event_id || null,
      notificationData.title,
      notificationData.message,
      notificationData.type || 'info'
    ])
    
    return this.findById(id)
  }

  /**
   * Find notification by ID
   */
  static async findById(id) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT n.*, 
        u.name as user_name,
        u.email as user_email,
        e.title as event_title
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN events e ON n.event_id = e.id
      WHERE n.id = $1
    `, [id])
    return res.rows[0] || null
  }

  /**
   * Get notifications for a user
   */
  static async findByUser(userId, filters = {}) {
    const db = getDatabase()
    let query = `
      SELECT n.*, 
        u.name as user_name,
        u.email as user_email,
        e.title as event_title
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN events e ON n.event_id = e.id
      WHERE n.user_id = $1
    `
    const params = [userId]
    let i = 2
    
    if (filters.is_read !== undefined) {
      query += ` AND n.is_read = $${i++}`
      params.push(filters.is_read ? 1 : 0)
    }
    
    if (filters.type) {
      query += ` AND n.type = $${i++}`
      params.push(filters.type)
    }
    
    query += ' ORDER BY n.created_at DESC'
    
    if (filters.limit) {
      query += ` LIMIT $${i++}`
      params.push(filters.limit)
    }
    
    const res = await db.query(query, params)
    return res.rows
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id) {
    const db = getDatabase()
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = $1', [id])
    return this.findById(id)
  }

  /**
   * Mark all notifications for user as read
   */
  static async markAllAsRead(userId) {
    const db = getDatabase()
    return db.query('UPDATE notifications SET is_read = 1 WHERE user_id = $1', [userId])
  }

  /**
   * Delete notification
   */
  static async delete(id) {
    const db = getDatabase()
    return db.query('DELETE FROM notifications WHERE id = $1', [id])
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND is_read = 0
    `, [userId])
    return res.rows[0]?.count || 0
  }
}