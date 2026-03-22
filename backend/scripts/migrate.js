/**
 * Database Migration Script for Production
 * This script handles database initialization and migrations for production deployment
 */

import { initDatabase, getDatabase } from '../database/db.js';
import bcrypt from 'bcryptjs';
import { getFixedCampus } from '../utils/campusValidation.js';

const runMigrations = async () => {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Initialize database
    const db = initDatabase();
    
    // Create tables (this will use the schema.sql file)
    console.log('✅ Database tables created/verified');
    
    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@iksuniversity.edu';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
    
    if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminId = `admin-${Date.now()}`;
      const fixedCampus = getFixedCampus('admin-office');
      
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, campus, branch, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        adminId,
        adminEmail,
        hashedPassword,
        'System Administrator',
        'admin-office',
        fixedCampus,
        null
      );
      
      console.log('✅ Admin user created');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Default Password: ${adminPassword}`);
    } else {
      console.log('✅ Admin user already exists, skipping creation');
    }
    
    // Check if campus-in-charge user exists
    const existingCampusInCharge = db.prepare('SELECT id FROM users WHERE email = ?').get('campus-in-charge@iksuniversity.edu');
    
    if (!existingCampusInCharge) {
      // Create campus-in-charge user
      const campusInChargePassword = 'Campus@123';
      const hashedCampusInChargePassword = await bcrypt.hash(campusInChargePassword, 10);
      const campusInChargeId = `campus-charge-${Date.now()}`;
      
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, campus, branch, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        campusInChargeId,
        'campus-in-charge@iksuniversity.edu',
        hashedCampusInChargePassword,
        'Campus In-Charge',
        'campus-in-charge',
        'haldwani',
        null
      );
      
      console.log('✅ Campus In-Charge user created');
      console.log('   Email: campus-in-charge@iksuniversity.edu');
      console.log('   Default Password: Campus@123');
    } else {
      console.log('✅ Campus In-Charge user already exists, skipping creation');
    }
    
    // Check if SPOC user exists
    const existingSPOC = db.prepare('SELECT id FROM users WHERE email = ?').get('spoc@iksuniversity.edu');
    
    if (!existingSPOC) {
      // Create SPOC user
      const spocPassword = 'SPOC@123';
      const hashedSPOCPassword = await bcrypt.hash(spocPassword, 10);
      const spocId = `spoc-${Date.now()}`;
      
      db.prepare(`
        INSERT INTO users (id, email, password, name, role, campus, branch, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        spocId,
        'spoc@iksuniversity.edu',
        hashedSPOCPassword,
        'SPOC User',
        'spoc',
        'dehradun',
        'cse'
      );
      
      console.log('✅ SPOC user created');
      console.log('   Email: spoc@iksuniversity.edu');
      console.log('   Default Password: SPOC@123');
    } else {
      console.log('✅ SPOC user already exists, skipping creation');
    }
    
    // Run any additional migrations here
    console.log('✅ Database migrations completed successfully');
    
    // Close database connection
    db.close();
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };