import bcrypt from 'bcryptjs'

/**
 * Script to create a hashed password for admin account
 * Run this to generate a password hash for the pre-created admin
 * Usage: node scripts/createAdmin.js
 */

const password = 'Admin@123' // Default admin password

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err)
    return
  }
  console.log('Hashed password for Admin@123:')
  console.log(hash)
  console.log('\nCopy this hash to backend/models/users.js for the preCreatedAdmins array')
})



