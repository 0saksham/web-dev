import { getDatabase } from '../database/db.js'

/**
 * Event Media Model
 */
export class EventMedia {
  /**
   * Find media by ID
   */
  static async findById(id) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT em.*, u.name as uploader_name
      FROM event_media em
      LEFT JOIN users u ON em.uploaded_by = u.id
      WHERE em.id = $1
    `, [id])
    return res.rows[0] || null
  }

  /**
   * Create new media entry
   */
  static async create(mediaData) {
    const db = getDatabase()
    const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    await db.query(`
      INSERT INTO event_media (
        id, event_id, media_type, file_name, file_path, file_size, mime_type, uploaded_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      id,
      mediaData.event_id,
      mediaData.media_type,
      mediaData.file_name,
      mediaData.file_path,
      mediaData.file_size || null,
      mediaData.mime_type || null,
      mediaData.uploaded_by
    ])
    
    return this.findById(id)
  }

  /**
   * Get all media for an event
   */
  static async findByEventId(eventId) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT em.*, u.name as uploader_name
      FROM event_media em
      LEFT JOIN users u ON em.uploaded_by = u.id
      WHERE em.event_id = $1
      ORDER BY em.created_at DESC
    `, [eventId])
    return res.rows
  }

  /**
   * Get media by type
   */
  static async findByEventAndType(eventId, mediaType) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT em.*, u.name as uploader_name
      FROM event_media em
      LEFT JOIN users u ON em.uploaded_by = u.id
      WHERE em.event_id = $1 AND em.media_type = $2
      ORDER BY em.created_at DESC
    `, [eventId, mediaType])
    return res.rows
  }

  /**
   * Delete media
   */
  static async delete(id) {
    const db = getDatabase()
    return db.query('DELETE FROM event_media WHERE id = $1', [id])
  }

  /**
   * Delete all media for an event
   */
  static async deleteByEventId(eventId) {
    const db = getDatabase()
    return db.query('DELETE FROM event_media WHERE event_id = $1', [eventId])
  }

  /**
   * Update media info
   */
  static async update(id, updates) {
    const db = getDatabase()
    const allowedFields = ['file_name', 'file_path', 'file_size', 'mime_type']
    const fields = []
    const values = []
    let i = 1
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${i++}`)
        values.push(value)
      }
    }
    
    if (fields.length === 0) {
      return this.findById(id)
    }
    
    values.push(id)
    
    await db.query(`UPDATE event_media SET ${fields.join(', ')} WHERE id = $${i}`, values)
    
    return this.findById(id)
  }
}

