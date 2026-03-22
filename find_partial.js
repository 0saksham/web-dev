import { initDatabase, getDatabase } from './backend/database/db.js'

try {
  initDatabase()
  const db = getDatabase()
  
  console.log('Searching for any event with "Weekly" or "sync" in title...')
  const events = db.prepare("SELECT id, title FROM events WHERE title LIKE '%Weekly%' OR title LIKE '%sync%'").all()
  
  if (events.length === 0) {
    console.log('No matching events found.')
  } else {
    events.forEach(e => console.log(`- ${e.title} (ID: ${e.id})`))
  }
  
} catch (error) {
  console.error(error)
}
