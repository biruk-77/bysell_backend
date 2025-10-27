// test-project/socket-client-test.js
const io = require('socket.io-client');

// Replace with your actual JWT token
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkzZjdkMDViLWZjNmMtNDllZC1hMTIxLWMxNDc1OWE5NjMzNiIsInVzZXJuYW1lIjoidGVzdDEiLCJlbWFpbCI6InRlc3QxQGdtYWlsLmNvbSIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTc2MTI5NzQ5OSwiZXhwIjoxNzYxMzgzODk5fQ.JHAS6bP__OEL7jMpwFOwNb_cnCETjby1sEfxR7C9jwY';

const socket = io('http://localhost:5000', {
    auth: {
        token: JWT_TOKEN
    }
});

// Connection events
socket.on('connect', () => {
    console.log('✅ Connected to server!');
    
    // Join a conversation
    socket.emit('join_conversation', {
        otherUserId: 'OTHER_USER_ID_HERE'
    });
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
    console.log('🚫 Connection error:', error.message);
});

// User status events
socket.on('user_online', (data) => {
    console.log('🟢 User online:', data.username, data.userId);
});

socket.on('user_offline', (data) => {
    console.log('🔴 User offline:', data.username, data.userId);
});

// Connection request events
socket.on('connection_request_received', (data) => {
    console.log('🔗 New connection request:', data);
});

socket.on('connection_request_responded', (data) => {
    console.log('✅ Connection request responded:', data);
});

// Message events
socket.on('new_message', (data) => {
    console.log('💬 New message:', data);
});

socket.on('message_notification', (data) => {
    console.log('🔔 Message notification:', data);
});

socket.on('messages_read', (data) => {
    console.log('👁️ Messages read by:', data.readByUsername);
});

socket.on('message_deleted', (data) => {
    console.log('🗑️ Message deleted by user:', data.deletedBy);
});

// Send a test message after 2 seconds
setTimeout(() => {
    socket.emit('send_message', {
        receiverId: '93f7d05b-fc6c-49ed-a121-c14759a96336',
        content: 'Hello from Socket.io client!',
        messageType: 'text'
    });
    console.log('📤 Sent test message');
}, 2000);
