import { getDatabase } from './database/db.js';

const db = getDatabase();
const campusInChargeUsers = db.prepare("SELECT id, email, role, campus FROM users WHERE role = 'campus-in-charge'").all();
console.log('Campus In-Charge Users:');
console.log(campusInChargeUsers);

const allUsers = db.prepare("SELECT id, email, role FROM users").all();
console.log('\nAll Users:');
console.log(allUsers);