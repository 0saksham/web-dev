import { getDatabase } from '../database/db.js'

/**
 * User Model
 */
export class User {
  /**
   * Find user by email
   */
  static findByEmail(email) {
    const db = getDatabase()
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase())
  }

  /**
   * Find user by ID
   */
  static findById(id) {
    const db = getDatabase()
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  }

  /**
   * Create a new user
   */
  static create(userData) {
    const db = getDatabase()
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { password, ...insertData } = userData
    
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, campus, branch, phone, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      insertData.email.toLowerCase(),
      password, // Already hashed
      insertData.name,
      insertData.role,
      insertData.campus || null,
      insertData.branch || null,
      insertData.phone || null,
      insertData.address || null
    )
    
    return this.findById(id)
  }

  /**
   * Check if email exists
   */
  static emailExists(email) {
    const db = getDatabase()
    const result = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get(email.toLowerCase())
    return result.count > 0
  }

  /**
   * Update user
   */
  static update(id, updates) {
    const db = getDatabase()
    const allowedFields = ['name', 'phone', 'address', 'campus', 'branch']
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
    
    fields.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)
    
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    
    return this.findById(id)
  }

  /**
   * Get users by role
   */
  static findByRole(role) {
    const db = getDatabase()
    return db.prepare('SELECT id, email, name, role, campus, branch, phone, created_at FROM users WHERE role = ?').all(role)
  }

  /**
   * Get users by campus
   */
  static findByCampus(campus) {
    const db = getDatabase()
    return db.prepare('SELECT id, email, name, role, campus, branch, phone, created_at FROM users WHERE campus = ?').all(campus)
  }

  /**
   * Get users by campus and branch (for role-based segregation)
   */
  static findByCampusAndBranch(campus, branch) {
    const db = getDatabase()
    return db.prepare('SELECT id, email, name, role, campus, branch, phone, created_at FROM users WHERE campus = ? AND branch = ?').all(campus, branch)
  }

  /**
   * Get all users (admin only - with role-based filtering)
   */
  static findAll(filters = {}) {
    const db = getDatabase()
    let query = 'SELECT id, email, name, role, campus, branch, phone, created_at FROM users WHERE 1=1'
    const params = []
    
    if (filters.role) {
      query += ' AND role = ?'
      params.push(filters.role)
    }
    
    if (filters.campus) {
      query += ' AND campus = ?'
      params.push(filters.campus)
    }
    
    if (filters.branch) {
      query += ' AND branch = ?'
      params.push(filters.branch)
    }
    
    query += ' ORDER BY created_at DESC'
    
    return db.prepare(query).all(...params)
  }

  /**
   * Remove password from user object
   */
  static sanitize(user) {
    if (!user) return null
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }
}

