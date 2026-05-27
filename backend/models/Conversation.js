import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database/db.js'

export class Conversation {
  // Create a new conversation message
  static async create(conversationData) {
    try {
      const db = getDatabase()
      const id = uuidv4()
      const { user_id, message, username, designation } = conversationData

      const result = await db.query(
        `INSERT INTO conversations (id, user_id, message, username, designation, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [id, user_id, message, username, designation]
      )

      return result.rows[0]
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Get all conversations (paginated)
  static async findAll(limit = 50, offset = 0) {
    try {
      const db = getDatabase()
      const result = await db.query(
        `SELECT id, user_id, message, username, designation, created_at, updated_at
         FROM conversations
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      )

      return result.rows
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

  // Get conversations by user
  static async findByUserId(userId) {
    try {
      const db = getDatabase()
      const result = await db.query(
        `SELECT id, user_id, message, username, designation, created_at, updated_at
         FROM conversations
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      )

      return result.rows
    } catch (error) {
      console.error('Error fetching user conversations:', error)
      throw error
    }
  }

  // Get single conversation by ID
  static async findById(id) {
    try {
      const db = getDatabase()
      const result = await db.query(
        `SELECT id, user_id, message, username, designation, created_at, updated_at
         FROM conversations
         WHERE id = $1`,
        [id]
      )

      return result.rows[0]
    } catch (error) {
      console.error('Error fetching conversation:', error)
      throw error
    }
  }

  // Get recent conversations (for real-time updates)
  static async findRecent(limit = 100) {
    try {
      const db = getDatabase()
      const result = await db.query(
        `SELECT id, user_id, message, username, designation, created_at, updated_at
         FROM conversations
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      )

      return result.rows
    } catch (error) {
      console.error('Error fetching recent conversations:', error)
      throw error
    }
  }

  // Update conversation message
  static async update(id, updates) {
    try {
      const db = getDatabase()
      const allowedFields = ['message']
      const updateFields = []
      const updateValues = []
      let paramCount = 1

      for (const field of allowedFields) {
        if (field in updates) {
          updateFields.push(`${field} = $${paramCount}`)
          updateValues.push(updates[field])
          paramCount++
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update')
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      updateValues.push(id)

      const result = await db.query(
        `UPDATE conversations
         SET ${updateFields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        updateValues
      )

      return result.rows[0]
    } catch (error) {
      console.error('Error updating conversation:', error)
      throw error
    }
  }

  // Delete conversation
  static async delete(id) {
    try {
      const db = getDatabase()
      const result = await db.query(
        `DELETE FROM conversations WHERE id = $1 RETURNING id`,
        [id]
      )

      return result.rows[0]
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }

  // Get total conversation count
  static async getTotalCount() {
    try {
      const db = getDatabase()
      const result = await db.query(
        `SELECT COUNT(*) as count FROM conversations`
      )

      return parseInt(result.rows[0].count, 10)
    } catch (error) {
      console.error('Error getting conversation count:', error)
      throw error
    }
  }

  // Search conversations
  static async search(query) {
    try {
      const db = getDatabase()
      const result = await db.query(
        `SELECT id, user_id, message, username, designation, created_at, updated_at
         FROM conversations
         WHERE message ILIKE $1 OR username ILIKE $1 OR designation ILIKE $1
         ORDER BY created_at DESC`,
        [`%${query}%`]
      )

      return result.rows
    } catch (error) {
      console.error('Error searching conversations:', error)
      throw error
    }
  }
}
