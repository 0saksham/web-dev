import { getDatabase } from '../database/db.js'

/**
 * Event Media Model
 */
export class EventMedia {
  /**
   * Find media by ID
   */
  static findById(id) {
    const db = getDatabase()
    return db.prepare(`
      SELECT em.*, u.name as uploader_name
      FROM event_media em
      LEFT JOIN users u ON em.uploaded_by = u.id
      WHERE em.id = ?
    `).get(id)
  }

  /**
   * Create new media entry
   */
  static create(mediaData) {
    const db = getDatabase()
    const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    db.prepare(`
      INSERT INTO event_media (
        id, event_id, media_type, file_name, file_path, file_size, mime_type, uploaded_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      mediaData.event_id,
      mediaData.media_type,
      mediaData.file_name,
      mediaData.file_path,
      mediaData.file_size || null,
      mediaData.mime_type || null,
      mediaData.uploaded_by
    )
    
    return this.findById(id)
  }

  /**
   * Get all media for an event
   */
  static findByEventId(eventId) {
    const db = getDatabase()
    return db.prepare(`
      SELECT em.*, u.name as uploader_name
      FROM event_media em
      LEFT JOIN users u ON em.uploaded_by = u.id
      WHERE em.event_id = ?
      ORDER BY em.created_at DESC
    `).all(eventId)
  }

  /**
   * Get media by type
   */
  static findByEventAndType(eventId, mediaType) {
    const db = getDatabase()
    return db.prepare(`
      SELECT em.*, u.name as uploader_name
      FROM event_media em
      LEFT JOIN users u ON em.uploaded_by = u.id
      WHERE em.event_id = ? AND em.media_type = ?
      ORDER BY em.created_at DESC
    `).all(eventId, mediaType)
  }

  /**
   * Delete media
   */
  static delete(id) {
    const db = getDatabase()
    return db.prepare('DELETE FROM event_media WHERE id = ?').run(id)
  }

  /**
   * Delete all media for an event
   */
  static deleteByEventId(eventId) {
    const db = getDatabase()
    return db.prepare('DELETE FROM event_media WHERE event_id = ?').run(eventId)
  }

  /**
   * Update media info
   */
  static update(id, updates) {
    const db = getDatabase()
    const allowedFields = ['file_name', 'file_path', 'file_size', 'mime_type']
    const fields = []
    const values = []
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }
    
    if (fields.length === 0) {
      return this.findById(id)
    }
    
    values.push(id)
    
    db.prepare(`UPDATE event_media SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    
    return this.findById(id)
  }
}

