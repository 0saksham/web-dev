import bcrypt from 'bcryptjs'

/**
 * Setup script to create admin password hash
 * Run: node scripts/setupAdmin.js
 */

const adminPassword = 'Admin@123'

bcrypt.hash(adminPassword, 10)
  .then(hash => {
    console.log('\n=== Admin Account Setup ===\n')
    console.log('Email: admin@iksuniversity.edu')
    console.log('Password: Admin@123')
    console.log('\nHashed Password:')
    console.log(hash)
    console.log('\nCopy the hash above to backend/models/users.js\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })



