import { initDatabase, getDatabase } from './backend/database/db.js'

try {
  // Initialize database connection
  initDatabase()
  const db = getDatabase()
  
  const titlesToDelete = [
    'Admin Weekly Meeting',
    'Robotics Workshop 2026',
    'Weekly sync up for IKS admin team'
  ]
  
  console.log('Searching for events to delete...')
  
  // Find events by title
  const placeholders = titlesToDelete.map(() => '?').join(',')
  const eventsToDelete = db.prepare(`SELECT id, title FROM events WHERE title IN (${placeholders})`).all(...titlesToDelete)
  
  if (eventsToDelete.length === 0) {
    console.log('No matching events found to delete.')
  } else {
    console.log(`Found ${eventsToDelete.length} events to delete:`)
    eventsToDelete.forEach(event => console.log(`- ${event.title} (ID: ${event.id})`))
    
    // Delete events
    const deleteStmt = db.prepare('DELETE FROM events WHERE id = ?')
    
    // Also delete associated event_status entries
    const deleteStatusStmt = db.prepare('DELETE FROM event_status WHERE event_id = ?')
    
    // Also delete associated notifications
    const deleteNotifStmt = db.prepare('DELETE FROM notifications WHERE event_id = ?')
    
    let deletedCount = 0
    
    db.transaction(() => {
      for (const event of eventsToDelete) {
        deleteStmt.run(event.id)
        deleteStatusStmt.run(event.id)
        deleteNotifStmt.run(event.id)
        deletedCount++
      }
    })()
    
    console.log(`Successfully deleted ${deletedCount} events and their associated data.`)
  }
  
} catch (error) {
  console.error('Error deleting events:', error)
}
