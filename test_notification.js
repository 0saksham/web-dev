
import { initDatabase } from './backend/database/db.js'
import { Notification } from './backend/models/Notification.js'
import { User } from './backend/models/User.js'

// Mock database path for testing if needed, or rely on default
// process.env.DB_PATH = './backend/database/iks.db' 

try {
  initDatabase()
  
  // Create a dummy user if not exists (or find one)
  let user = User.findByEmail('admin@iks.com')
  if (!user) {
    console.log('Creating dummy admin user...')
    user = User.create({
      email: 'admin@iks.com',
      password: 'password',
      name: 'Admin User',
      role: 'admin-office'
    })
  }
  
  console.log('User ID:', user.id)
  
  // Create a notification
  console.log('Creating notification...')
  const notif = Notification.create({
    user_id: user.id,
    title: 'Test Notification',
    message: 'This is a test notification',
    type: 'info'
  })
  console.log('Notification created:', notif.id)
  
  // Check unread count
  const count = Notification.getUnreadCount(user.id)
  console.log('Unread count:', count)
  
  if (count > 0) {
    console.log('SUCCESS: Notification count is dynamic')
  } else {
    console.log('FAILURE: Notification count is 0')
  }
  
  // Clean up
  Notification.delete(notif.id)
  
} catch (error) {
  console.error('Test failed:', error)
}
