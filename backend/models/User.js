import { getDatabase } from '../database/db.js'

export class User {
  static async findByEmail(email) {
    const db = getDatabase()
    const res = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    return res.rows[0] || null
  }

  static async findById(id) {
    const db = getDatabase()
    const res = await db.query('SELECT * FROM users WHERE id = $1', [id])
    return res.rows[0] || null
  }

  static async create(userData) {
    const db = getDatabase()
    const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const { password, ...d } = userData

    await db.query(
      'INSERT INTO users (id, email, password, name, role, campus, branch, phone, address) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, d.email.toLowerCase(), password, d.name, d.role, d.campus || null, d.branch || null, d.phone || null, d.address || null]
    )
    return this.findById(id)
  }

  static async emailExists(email) {
    const db = getDatabase()
    const res = await db.query('SELECT COUNT(*) as count FROM users WHERE email = $1', [email.toLowerCase()])
    return parseInt(res.rows[0].count) > 0
  }

  static async update(id, updates) {
    const db = getDatabase()
    const allowed = ['name', 'phone', 'address', 'campus', 'branch']
    const fields = []
    const values = []
    let i = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key)) {
        fields.push(`${key} = $${i++}`)
        values.push(value)
      }
    }

    if (fields.length === 0) return this.findById(id)

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i}`, values)
    return this.findById(id)
  }

  static async findAll(filters = {}) {
    const db = getDatabase()
    let query = 'SELECT id, email, name, role, campus, branch, phone, created_at FROM users WHERE 1=1'
    const params = []
    let i = 1

    if (filters.role) { query += ` AND role = $${i++}`; params.push(filters.role) }
    if (filters.campus) { query += ` AND campus = $${i++}`; params.push(filters.campus) }
    if (filters.branch) { query += ` AND branch = $${i++}`; params.push(filters.branch) }

    query += ' ORDER BY created_at DESC'
    const res = await db.query(query, params)
    return res.rows
  }

  static sanitize(user) {
    if (!user) return null
    const { password, ...rest } = user
    return rest
  }
}