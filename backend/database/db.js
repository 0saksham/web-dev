import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getFixedCampus } from '../utils/campusValidation.js'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = process.env.DB_PATH || join(__dirname, 'iks_portal.db')

let db = null

/**
 * Initialize database connection
 */
export const initDatabase = () => {
  try {
    db = new Database(DB_PATH)
    db.pragma('foreign_keys = ON') // Enable foreign key constraints
    
    // Create tables
    const schemaPath = join(__dirname, 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')
    db.exec(schema)
    
    // Migrate existing events table to add submission fields if they don't exist
    try {
      db.exec(`
        ALTER TABLE events ADD COLUMN submitted_at DATETIME;
      `)
    } catch (err) {
      // Column might already exist, ignore error
      if (!err.message.includes('duplicate column name')) {
        console.warn('Migration warning:', err.message)
      }
    }
    
    try {
      db.exec(`
        ALTER TABLE events ADD COLUMN submitted_by TEXT;
      `)
    } catch (err) {
      // Column might already exist, ignore error
      if (!err.message.includes('duplicate column name')) {
        console.warn('Migration warning:', err.message)
      }
    }
    
    // Add foreign key for submitted_by if column exists
    try {
      // SQLite doesn't support adding foreign keys to existing columns easily
      // This is handled by the schema creation
    } catch (err) {
      // Ignore
    }

    // Migration: remove invalid foreign keys on events.campus and events.branch
    // Older schema referenced users(campus)/(branch) which are not UNIQUE, causing 'foreign key mismatch'
    try {
      const fkRows = db.prepare("PRAGMA foreign_key_list('events')").all()
      const hasInvalidFK = fkRows.some(r => r.table === 'users' && (r.from === 'campus' || r.from === 'branch'))
      if (hasInvalidFK) {
        console.warn('⚠️  Detected invalid foreign keys on events.campus/branch. Performing migration...')
        db.exec('BEGIN IMMEDIATE TRANSACTION;')
        // Create a new table without the invalid FKs (keep created_by and submitted_by FKs)
        db.exec(`
          CREATE TABLE IF NOT EXISTS events_new (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            duration INTEGER,
            credits REAL,
            start_date DATETIME NOT NULL,
            end_date DATETIME,
            status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled')),
            created_by TEXT NOT NULL,
            campus TEXT,
            branch TEXT,
            submitted_at DATETIME,
            submitted_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
          );

          INSERT INTO events_new (
            id, title, description, duration, credits, start_date, end_date, status,
            created_by, campus, branch, submitted_at, submitted_by, created_at, updated_at
          )
          SELECT 
            id, title, description, duration, credits, start_date, end_date, status,
            created_by, campus, branch, submitted_at, submitted_by, created_at, updated_at
          FROM events;

          DROP TABLE events;
          ALTER TABLE events_new RENAME TO events;

          -- Recreate indexes
          CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
          CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
          CREATE INDEX IF NOT EXISTS idx_events_campus ON events(campus);
          CREATE INDEX IF NOT EXISTS idx_events_branch ON events(branch);
          CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
          CREATE INDEX IF NOT EXISTS idx_events_submitted_at ON events(submitted_at);
          CREATE INDEX IF NOT EXISTS idx_events_submitted_by ON events(submitted_by);
        `)
        db.exec('COMMIT;')
        console.log('✅ Migration completed: removed invalid foreign keys on events.campus/branch')
      }
    } catch (migrateErr) {
      try { db.exec('ROLLBACK;') } catch {}
      console.error('Migration error (events FK cleanup):', migrateErr)
    }
    
    console.log('✅ Database initialized successfully')
    
    // Initialize admin user(s) if not exists
    initializeAdminUser()
    
    return db
  } catch (error) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
}

/**
 * Get database instance
 */
export const getDatabase = () => {
  if (!db) {
    return initDatabase()
  }
  return db
}

/**
 * Initialize admin user
 */
const initializeAdminUser = async () => {
  try {
    // Legacy default admin
    const legacyEmail = 'admin@iksuniversity.edu'
    const hasLegacy = db.prepare('SELECT id FROM users WHERE email = ?').get(legacyEmail)
    if (!hasLegacy) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10)
      const adminId = 'admin-1'
      const fixedCampus = getFixedCampus('admin-office')
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, campus, branch)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        adminId,
        legacyEmail,
        hashedPassword,
        'System Administrator',
        'admin-office',
        fixedCampus,
        null
      )
      console.log('✅ Admin user created (legacy)')
      console.log('   Email: admin@iksuniversity.edu')
      console.log('   Password: Admin@123')
    }

    // New preset admin for IKS GEHU
    const presetEmail = 'iks_gehu1@gmail.com'
    const hasPreset = db.prepare('SELECT id FROM users WHERE email = ?').get(presetEmail)
    if (!hasPreset) {
      const presetPassword = 'Gehu@1234'
      const hashedPreset = await bcrypt.hash(presetPassword, 10)
      const presetId = 'admin-iks-gehu-1'
      const fixedCampus = getFixedCampus('admin-office')
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, campus, branch)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        presetId,
        presetEmail,
        hashedPreset,
        'IKS GEHU Admin',
        'admin-office',
        fixedCampus,
        null
      )
      console.log('✅ Admin user created (preset)')
      console.log('   Email: iks_gehu1@gmail.com')
      console.log('   Password: Gehu@1234')
    }
  } catch (error) {
    console.error('Error initializing admin user:', error)
  }
}

/**
 * Close database connection
 */
export const closeDatabase = () => {
  if (db) {
    db.close()
    db = null
  }
}

