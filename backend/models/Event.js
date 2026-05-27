import { getDatabase } from '../database/db.js'

let EventStatusClass = null
const getEventStatus = async () => {
  if (!EventStatusClass) {
    const module = await import('./EventStatus.js')
    EventStatusClass = module.EventStatus
  }
  return EventStatusClass
}

export class Event {
  static async findById(id) {
    const db = getDatabase()
    const res = await db.query(`
      SELECT e.*,
        u.name as creator_name, u.email as creator_email,
        s.name as submitter_name, s.email as submitter_email,
        es.remarks as remarks, es.remarks as latest_remarks
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users s ON e.submitted_by = s.id
      LEFT JOIN event_status es ON es.id = (
        SELECT id FROM event_status WHERE event_id = e.id ORDER BY reviewed_at DESC LIMIT 1
      )
      WHERE e.id = $1
    `, [id])
    return res.rows[0] || null
  }

  static async create(eventData) {
    const db = getDatabase()
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const status = eventData.status || 'draft'
    const submittedAt = status === 'pending' ? new Date().toISOString() : null
    const submittedBy = status === 'pending' ? eventData.created_by : null

    await db.query(`
      INSERT INTO events (id, title, description, duration, credits, start_date, end_date, status, created_by, campus, branch, submitted_at, submitted_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `, [id, eventData.title, eventData.description || null, eventData.duration || null, eventData.credits || null,
        eventData.start_date, eventData.end_date || null, status, eventData.created_by,
        eventData.campus || null, eventData.branch || null, submittedAt, submittedBy])

    getEventStatus().then(ES => ES.create({ event_id: id, status, reviewed_by: eventData.created_by }))
      .catch(err => console.error('Error creating initial status:', err))

    return this.findById(id)
  }

  static async update(id, updates) {
    const db = getDatabase()
    const allowed = ['title', 'description', 'duration', 'credits', 'start_date', 'end_date', 'status', 'campus', 'branch']
    const fields = []
    const values = []
    let i = 1

    if (updates.status === 'pending') {
      const current = await this.findById(id)
      if (current && current.status === 'draft') {
        fields.push(`submitted_at = $${i++}`); values.push(new Date().toISOString())
        if (updates.submitted_by) { fields.push(`submitted_by = $${i++}`); values.push(updates.submitted_by) }
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key)) { fields.push(`${key} = $${i++}`); values.push(value) }
    }

    if (fields.length === 0) return this.findById(id)

    fields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)
    await db.query(`UPDATE events SET ${fields.join(', ')} WHERE id = $${i}`, values)

    if (updates.status) {
      getEventStatus().then(ES => ES.create({
        event_id: id, status: updates.status,
        reviewed_by: updates.reviewed_by || updates.submitted_by || null,
        remarks: updates.remarks || null
      })).catch(err => console.error('Error creating status entry:', err))
    }

    return this.findById(id)
  }

  static async delete(id) {
    const db = getDatabase()
    return db.query('DELETE FROM events WHERE id = $1', [id])
  }

  static async findAll(filters = {}) {
    const db = getDatabase()
    let query = `
      SELECT e.*, u.name as creator_name, u.email as creator_email,
        s.name as submitter_name, s.email as submitter_email, es.remarks as remarks, es.remarks as latest_remarks
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users s ON e.submitted_by = s.id
      LEFT JOIN event_status es ON es.id = (
        SELECT id FROM event_status WHERE event_id = e.id ORDER BY reviewed_at DESC LIMIT 1
      )
      WHERE 1=1
    `
    const params = []
    let i = 1

    if (filters.userRole === 'campus-in-charge' && filters.userCampus) {
      query += ` AND e.campus = $${i++}`; params.push(filters.userCampus)
    } else if (filters.userRole === 'spoc') {
      if (filters.userCampus) { query += ` AND e.campus = $${i++}`; params.push(filters.userCampus) }
      if (filters.userBranch) { query += ` AND e.branch = $${i++}`; params.push(filters.userBranch) }
    }

    if (filters.status) { query += ` AND e.status = $${i++}`; params.push(filters.status) }
    if (filters.campus) { query += ` AND e.campus = $${i++}`; params.push(filters.campus) }
    if (filters.branch) { query += ` AND e.branch = $${i++}`; params.push(filters.branch) }
    if (filters.created_by) { query += ` AND e.created_by = $${i++}`; params.push(filters.created_by) }
    if (filters.date_from) { query += ` AND e.start_date >= $${i++}`; params.push(filters.date_from) }
    if (filters.date_to) { query += ` AND e.end_date <= $${i++}`; params.push(filters.date_to) }

    query += ' ORDER BY e.created_at DESC'
    if (filters.limit) { query += ` LIMIT $${i++}`; params.push(filters.limit) }

    const res = await db.query(query, params)
    return res.rows
  }
}