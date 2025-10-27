// test-project/scripts/testConnection.js
// Test script to create a connection request between test3 and test4
const { Connection, User } = require('../models');

async function createTestConnection() {
  try {
    console.log('Creating test connection request...');
    
    // Find test3 (employee) and test4 (employer)
    const test3 = await User.findOne({ where: { username: 'test3' } });
    const test4 = await User.findOne({ where: { username: 'test4' } });
    
    if (!test3) {
      console.log('❌ test3 user not found');
      return;
    }
    
    if (!test4) {
      console.log('❌ test4 user not found');
      return;
    }
    
    console.log('Found users:');
    console.log('- test3 (employee):', test3.id);
    console.log('- test4 (employer):', test4.id);
    
    // Check if connection already exists
    const existing = await Connection.findOne({
      where: {
        requesterId: test3.id,
        receiverId: test4.id
      }
    });
    
    if (existing) {
      console.log('⚠️  Connection request already exists:', existing.status);
      console.log('Connection ID:', existing.id);
      return;
    }
    
    // Create connection request from test3 to test4
    const connection = await Connection.create({
      requesterId: test3.id,
      receiverId: test4.id,
      status: 'pending',
      message: 'Hi! I would like to connect with you.'
    });
    
    console.log('✅ Connection request created successfully!');
    console.log('Connection ID:', connection.id);
    console.log('From:', test3.username, '(requester)');
    console.log('To:', test4.username, '(receiver)');
    console.log('Status:', connection.status);
    
    // List all connections
    console.log('\n📋 All connections in database:');
    const allConnections = await Connection.findAll({
      include: [
        { model: User, as: 'requester', attributes: ['username'] },
        { model: User, as: 'receiver', attributes: ['username'] }
      ]
    });
    
    allConnections.forEach((conn, i) => {
      console.log(`${i+1}. ${conn.requester?.username} → ${conn.receiver?.username} (${conn.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createTestConnection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
