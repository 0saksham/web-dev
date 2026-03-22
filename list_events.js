import { initDatabase, getDatabase } from './backend/database/db.js'

try {
  initDatabase()
  const db = getDatabase()
  
  const events = db.prepare('SELECT title FROM events').all()
  console.log('Current events in database:')
  events.forEach(e => console.log(`- ${e.title}`))
  
} catch (error) {
  console.error(error)
}
