import { getDatabase } from '../database/db.js'

/**
 * Notification Model
 */
export class Notification {
  /**
   * Create a new notification
   */
  static create(notificationData) {
    const db = getDatabase()
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    db.prepare(`
      INSERT INTO notifications (
        id, user_id, event_id, title, message, type
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      notificationData.user_id,
      notificationData.event_id || null,
      notificationData.title,
      notificationData.message,
      notificationData.type || 'info'
    )
    
    return this.findById(id)
  }

  /**
   * Find notification by ID
   */
  static findById(id) {
    const db = getDatabase()
    return db.prepare(`
      SELECT n.*, 
        u.name as user_name,
        u.email as user_email,
        e.title as event_title
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN events e ON n.event_id = e.id
      WHERE n.id = ?
    `).get(id)
  }

  /**
   * Get notifications for a user
   */
  static findByUser(userId, filters = {}) {
    const db = getDatabase()
    let query = `
      SELECT n.*, 
        u.name as user_name,
        u.email as user_email,
        e.title as event_title
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN events e ON n.event_id = e.id
      WHERE n.user_id = ?
    `
    const params = [userId]
    
    if (filters.is_read !== undefined) {
      query += ' AND n.is_read = ?'
      params.push(filters.is_read ? 1 : 0)
    }
    
    if (filters.type) {
      query += ' AND n.type = ?'
      params.push(filters.type)
    }
    
    query += ' ORDER BY n.created_at DESC'
    
    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(filters.limit)
    }
    
    return db.prepare(query).all(...params)
  }

  /**
   * Mark notification as read
   */
  static markAsRead(id) {
    const db = getDatabase()
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id)
    return this.findById(id)
  }

  /**
   * Mark all notifications for user as read
   */
  static markAllAsRead(userId) {
    const db = getDatabase()
    return db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId)
  }

  /**
   * Delete notification
   */
  static delete(id) {
    const db = getDatabase()
    return db.prepare('DELETE FROM notifications WHERE id = ?').run(id)
  }

  /**
   * Get unread count for user
   */
  static getUnreadCount(userId) {
    const db = getDatabase()
    const result = db.prepare(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(userId)
    return result.count
  }
}