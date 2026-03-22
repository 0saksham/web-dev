// Backend API Testing for Authentication and Approval Workflows
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: `testuser${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Test User',
  role: 'spoc',
  campus: 'dehradun',
  branch: 'cse'
};

let authToken = null;
let testEventId = null;
let testMediaId = null;

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test runner
async function runTests() {
  console.log('🧪 Starting Backend API Tests...\n');
  
  try {
    // Start the backend server if not already running
    console.log('🚀 Starting backend server...');
    const { stdout, stderr } = await execAsync('cd ../backend && node server.js > server.log 2>&1 &');
    await sleep(3000); // Wait for server to start
    
    // 1. Test Registration
    console.log('📝 Testing User Registration...');
    let response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    const registerResult = await response.json();
    console.log(`   Registration: ${response.status} - ${registerResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (registerResult.token) {
      authToken = registerResult.token;
      console.log('   Token received: ✅');
    }
    
    // 2. Test Login
    console.log('\n🔐 Testing User Login...');
    response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        role: TEST_USER.role
      })
    });
    
    const loginResult = await response.json();
    console.log(`   Login: ${response.status} - ${loginResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (loginResult.token) {
      authToken = loginResult.token;
      console.log('   New token received: ✅');
    }
    
    // 3. Test Event Creation
    console.log('\n📝 Testing Event Creation...');
    response = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Test Event',
        description: 'This is a test event for validation',
        duration: 2,
        credits: 5,
        start_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // In 2 days
        end_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], // In 4 days
        campus: TEST_USER.campus,
        branch: TEST_USER.branch,
        status: 'draft'
      })
    });
    
    const eventResult = await response.json();
    console.log(`   Event Creation: ${response.status} - ${eventResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (eventResult.event && eventResult.event.id) {
      testEventId = eventResult.event.id;
      console.log(`   Event ID: ${testEventId}`);
    }
    
    // 4. Test Event Submission
    console.log('\n📤 Testing Event Submission...');
    response = await fetch(`${BASE_URL}/events/${testEventId}/submit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const submitResult = await response.json();
    console.log(`   Event Submission: ${response.status} - ${submitResult.success ? '✅ PASS' : '❌ FAIL'}`);
    
    // 5. Test Get Events
    console.log('\n📋 Testing Get Events...');
    response = await fetch(`${BASE_URL}/events`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const eventsResult = await response.json();
    console.log(`   Get Events: ${response.status} - ${eventsResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Events Count: ${eventsResult.events ? eventsResult.events.length : 0}`);
    
    // 6. Test Validation - Invalid Data
    console.log('\n🛡️ Testing Input Validation...');
    
    // Test invalid registration
    response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'weak',
        name: 'T',
        role: 'invalid-role'
      })
    });
    
    const invalidRegResult = await response.json();
    console.log(`   Invalid Registration: ${response.status} - ${response.status === 400 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test invalid event creation
    response = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'T', // Too short
        description: 'S', // Too short
        duration: -5, // Invalid
        start_date: 'invalid-date'
      })
    });
    
    const invalidEventResult = await response.json();
    console.log(`   Invalid Event Creation: ${response.status} - ${response.status === 400 ? '✅ PASS' : '❌ FAIL'}`);
    
    // 7. Test Unauthorized Access
    console.log('\n🔒 Testing Unauthorized Access...');
    
    // Try to access protected route without token
    response = await fetch(`${BASE_URL}/events`);
    console.log(`   Unauthorized Access: ${response.status} - ${response.status === 401 ? '✅ PASS' : '❌ FAIL'}`);
    
    // Try to access protected route with invalid token
    response = await fetch(`${BASE_URL}/events`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    console.log(`   Invalid Token: ${response.status} - ${response.status === 401 ? '✅ PASS' : '❌ FAIL'}`);
    
    // 8. Test Contact Form Validation
    console.log('\n📧 Testing Contact Form Validation...');
    response = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'T', // Too short
        email: 'invalid-email',
        subject: 'Hi', // Too short
        message: 'Hi' // Too short
      })
    });
    
    const contactResult = await response.json();
    console.log(`   Invalid Contact: ${response.status} - ${response.status === 400 ? '✅ PASS' : '❌ FAIL'}`);
    
    // 9. Test Valid Contact
    response = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Valid Name',
        email: 'valid@example.com',
        subject: 'Test Subject',
        message: 'This is a valid test message for the contact form.'
      })
    });
    
    const validContactResult = await response.json();
    console.log(`   Valid Contact: ${response.status} - ${validContactResult.success ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n🎯 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await execAsync('pkill -f "node server.js"');
      console.log('   Server stopped: ✅');
    } catch (cleanupError) {
      console.log('   Server cleanup may have failed (may not be running)');
    }
  }
}

// Run the tests
runTests();