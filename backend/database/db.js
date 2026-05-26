import pg from 'pg'
import { getFixedCampus } from '../utils/campusValidation.js'
import bcrypt from 'bcryptjs'

const { Pool } = pg

let pool = null

export const getDatabase = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  }
  return pool
}

export const initDatabase = async () => {
  try {
    const db = getDatabase()

    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        campus TEXT,
        branch TEXT,
        phone TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        duration INTEGER,
        credits REAL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','rejected','completed','cancelled')),
        created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        campus TEXT,
        branch TEXT,
        submitted_at TIMESTAMP,
        submitted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS event_status (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        remarks TEXT,
        reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS event_media (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        media_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        uploaded_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
      CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
      CREATE INDEX IF NOT EXISTS idx_events_campus ON events(campus);
      CREATE INDEX IF NOT EXISTS idx_events_branch ON events(branch);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    `)

    console.log('✅ Database initialized successfully')
    await initializeAdminUser(db)
    return db
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
}

const initializeAdminUser = async (db) => {
  try {
    // Legacy admin
    const legacyRes = await db.query('SELECT id FROM users WHERE email = $1', ['admin@iksuniversity.edu'])
    if (legacyRes.rows.length === 0) {
      const hashed = await bcrypt.hash('Admin@123', 10)
      const fixedCampus = getFixedCampus('admin-office')
      await db.query(
        'INSERT INTO users (id, email, password, name, role, campus, branch) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        ['admin-1', 'admin@iksuniversity.edu', hashed, 'System Administrator', 'admin-office', fixedCampus, null]
      )
      console.log('✅ Legacy admin created: admin@iksuniversity.edu / Admin@123')
    }

    // Preset admin
    const presetRes = await db.query('SELECT id FROM users WHERE email = $1', ['iks_gehu1@gmail.com'])
    if (presetRes.rows.length === 0) {
      const hashed = await bcrypt.hash('Gehu@1234', 10)
      const fixedCampus = getFixedCampus('admin-office')
      await db.query(
        'INSERT INTO users (id, email, password, name, role, campus, branch) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        ['admin-iks-gehu-1', 'iks_gehu1@gmail.com', hashed, 'IKS GEHU Admin', 'admin-office', fixedCampus, null]
      )
      console.log('✅ Preset admin created: iks_gehu1@gmail.com / Gehu@1234')
    }
  } catch (error) {
    console.error('Error initializing admin user:', error)
  }
}

export const closeDatabase = async () => {
  if (pool) {
    await pool.end()
    pool = null
  }
}