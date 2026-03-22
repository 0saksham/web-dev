// Approval Workflow Tests
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Test configuration
const BASE_URL = 'http://localhost:5000/api';

// Test data for admin user (since we need admin to approve)
const ADMIN_USER = {
  email: 'admin@iksuniversity.edu',
  password: 'Admin@123',
  role: 'admin-office'
};

const TEST_USER = {
  email: `testspoc${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Test SPOC',
  role: 'spoc',
  campus: 'dehradun',
  branch: 'cse'
};

let userToken = null;
let adminToken = null;
let testEventId = null;

// Test utilities
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runApprovalTests() {
  console.log('🔄 Starting Approval Workflow Tests...\n');
  
  try {
    // Wait for server to be running
    await sleep(3000);
    
    // 1. Login as admin to get admin token
    console.log('🔐 Getting admin token...');
    let response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
        role: ADMIN_USER.role
      })
    });
    
    const adminLoginResult = await response.json();
    if (adminLoginResult.success) {
      adminToken = adminLoginResult.token;
      console.log('   Admin login: ✅');
    } else {
      console.log('   Admin login: ❌', adminLoginResult);
      return;
    }
    
    // 2. Register a test user
    console.log('\n📝 Registering test user...');
    response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    const registerResult = await response.json();
    console.log(`   User Registration: ${response.status} - ${registerResult.success ? '✅ PASS' : '❌ FAIL'}`);
    
    // 3. Login as test user
    console.log('\n🔐 Logging in as test user...');
    response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        role: TEST_USER.role
      })
    });
    
    const userLoginResult = await response.json();
    if (userLoginResult.success) {
      userToken = userLoginResult.token;
      console.log('   User login: ✅');
    } else {
      console.log('   User login: ❌', userLoginResult);
      return;
    }
    
    // 4. Create an event as the test user
    console.log('\n📝 Creating event as test user...');
    response = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Approval Test Event',
        description: 'This event is for testing the approval workflow',
        duration: 3,
        credits: 10,
        start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        end_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], // 4 days from now
        campus: TEST_USER.campus,
        branch: TEST_USER.branch,
        status: 'draft'
      })
    });
    
    const eventResult = await response.json();
    if (eventResult.success && eventResult.event) {
      testEventId = eventResult.event.id;
      console.log(`   Event created with ID: ${testEventId}`);
    } else {
      console.log('   Event creation failed:', eventResult);
      return;
    }
    
    // 5. Submit the event for approval
    console.log('\n📤 Submitting event for approval...');
    response = await fetch(`${BASE_URL}/events/${testEventId}/submit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const submitResult = await response.json();
    console.log(`   Event submission: ${response.status} - ${submitResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (submitResult.success) {
      console.log('   Event submitted successfully');
    }
    
    // 6. Verify the event status is now 'pending'
    console.log('\n🔍 Verifying event status is pending...');
    response = await fetch(`${BASE_URL}/events/${testEventId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    const eventDetails = await response.json();
    if (eventDetails.success && eventDetails.event.status === 'pending') {
      console.log('   Event status is pending: ✅');
    } else {
      console.log('   Event status check failed:', eventDetails);
    }
    
    // 7. Admin approves the event
    console.log('\n✅ Admin approving the event...');
    response = await fetch(`${BASE_URL}/events/${testEventId}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'approved',
        remarks: 'Event approved for testing purposes'
      })
    });
    
    const approvalResult = await response.json();
    console.log(`   Event approval: ${response.status} - ${approvalResult.success ? '✅ PASS' : '❌ FAIL'}`);
    if (approvalResult.success) {
      console.log('   Event approved successfully');
    }
    
    // 8. Verify the event status is now 'approved'
    console.log('\n🔍 Verifying event status is approved...');
    response = await fetch(`${BASE_URL}/events/${testEventId}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    const updatedEvent = await response.json();
    if (updatedEvent.success && updatedEvent.event.status === 'approved') {
      console.log('   Event status is approved: ✅');
    } else {
      console.log('   Event approval verification failed:', updatedEvent);
    }
    
    // 9. Test rejection workflow
    console.log('\n🔄 Testing rejection workflow...');
    
    // Create another event
    response = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Rejection Test Event',
        description: 'This event is for testing the rejection workflow',
        duration: 1,
        credits: 5,
        start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        campus: TEST_USER.campus,
        branch: TEST_USER.branch,
        status: 'draft'
      })
    });
    
    const event2Result = await response.json();
    if (event2Result.success && event2Result.event) {
      const event2Id = event2Result.event.id;
      console.log(`   Second event created with ID: ${event2Id}`);
      
      // Submit for approval
      response = await fetch(`${BASE_URL}/events/${event2Id}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (response.ok) {
        console.log('   Second event submitted: ✅');
        
        // Admin rejects the event
        response = await fetch(`${BASE_URL}/events/${event2Id}/status`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            status: 'rejected',
            remarks: 'Event rejected for testing purposes'
          })
        });
        
        const rejectionResult = await response.json();
        console.log(`   Event rejection: ${response.status} - ${rejectionResult.success ? '✅ PASS' : '❌ FAIL'}`);
        
        // Verify rejection
        response = await fetch(`${BASE_URL}/events/${event2Id}`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        const rejectedEvent = await response.json();
        if (rejectedEvent.success && rejectedEvent.event.status === 'rejected') {
          console.log('   Event status is rejected: ✅');
        }
      }
    }
    
    // 10. Test validation for admin actions
    console.log('\n🛡️ Testing admin action validation...');
    
    // Try to update without required remarks (this should work as remarks are optional in our implementation)
    // But let's test invalid status
    response = await fetch(`${BASE_URL}/events/${testEventId}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'invalid-status', // Invalid status
        remarks: 'Testing invalid status'
      })
    });
    
    const invalidStatusResult = await response.json();
    console.log(`   Invalid status update: ${response.status} - ${response.status === 400 ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n🎯 Approval workflow tests completed!');
    
  } catch (error) {
    console.error('❌ Approval test execution failed:', error.message);
  }
}

// Run the approval tests
runApprovalTests();