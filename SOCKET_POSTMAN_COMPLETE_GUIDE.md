# 🚀 Complete Socket.io + Postman Testing Guide

## 📋 **Environment Variables Setup**

First, create a Postman Environment with these variables:

```
BASE_URL = http://localhost:5000
TOKEN = (will be set automatically after login)
USER_ID = (will be set automatically after login)
OTHER_USER_ID = (set manually for testing connections/messages)
```

## 🔐 **1. Authentication Endpoints**

### **Register User A**
```
POST {{BASE_URL}}/api/auth/register
Content-Type: application/json

Body (JSON):
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "password123",
  "role": "user"
}

Tests Script:
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("TOKEN", response.token);
    pm.environment.set("USER_ID", response.user.id);
    console.log("User A ID:", response.user.id);
}
```

### **Register User B**
```
POST {{BASE_URL}}/api/auth/register
Content-Type: application/json

Body (JSON):
{
  "username": "bob",
  "email": "bob@example.com",
  "password": "password123",
  "role": "user"
}

Tests Script:
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("OTHER_USER_ID", response.user.id);
    console.log("User B ID:", response.user.id);
}
```

### **Login as User A**
```
POST {{BASE_URL}}/api/auth/login
Content-Type: application/json

Body (JSON):
{
  "email": "alice@example.com",
  "password": "password123"
}

Tests Script:
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("TOKEN", response.token);
    pm.environment.set("USER_ID", response.user.id);
}
```

## 👤 **2. Profile Endpoints**

### **Create Profile for User A**
```
POST {{BASE_URL}}/api/profile
Authorization: Bearer {{TOKEN}}
Content-Type: multipart/form-data

Form Data:
- bio: "I am Alice, a full-stack developer"
- skills: "JavaScript, Node.js, React, Socket.io"
- experience: "5 years of experience"
- location: "London, UK"
- profileImage: [SELECT FILE] (Optional)
```

### **Get My Profile**
```
GET {{BASE_URL}}/api/profile/me
Authorization: Bearer {{TOKEN}}
```

## 📝 **3. Posts/Listings Endpoints**

### **Create Post**
```
POST {{BASE_URL}}/api/posts
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "title": "Looking for React Developer",
  "description": "Need experienced React developer for startup project with Socket.io",
  "postType": "request",
  "category": "job",
  "location": "London"
}
```

### **Get All Posts (with filters)**
```
GET {{BASE_URL}}/api/posts?postType=request&category=job&location=London&page=1&limit=10
```

### **Get My Posts**
```
GET {{BASE_URL}}/api/posts/my?page=1&limit=10
Authorization: Bearer {{TOKEN}}
```

### **Update Post**
```
PUT {{BASE_URL}}/api/posts/{{POST_ID}}
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "title": "Updated: Looking for Senior React Developer",
  "description": "Updated description with Socket.io requirements"
}
```

### **Delete Post**
```
DELETE {{BASE_URL}}/api/posts/{{POST_ID}}
Authorization: Bearer {{TOKEN}}
```

## 🔗 **4. Connection/Matchmaking Endpoints**

### **Send Connection Request**
```
POST {{BASE_URL}}/api/connections/send
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "receiverId": "{{OTHER_USER_ID}}",
  "message": "Hi! I'd like to connect with you for the React project"
}

Tests Script:
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("CONNECTION_ID", response.connection.id);
    console.log("Connection ID:", response.connection.id);
}
```

### **Get Pending Requests (Switch to User B)**
```
GET {{BASE_URL}}/api/connections/pending?page=1&limit=10
Authorization: Bearer {{TOKEN}}
```

### **Accept Connection Request (as User B)**
```
PUT {{BASE_URL}}/api/connections/{{CONNECTION_ID}}/respond
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "action": "accept"
}
```

### **Get My Connections**
```
GET {{BASE_URL}}/api/connections?page=1&limit=10
Authorization: Bearer {{TOKEN}}
```

### **Get Sent Requests**
```
GET {{BASE_URL}}/api/connections/sent?page=1&limit=10
Authorization: Bearer {{TOKEN}}
```

## 💬 **5. Messaging Endpoints**

### **Send Message**
```
POST {{BASE_URL}}/api/messages/send
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "receiverId": "{{OTHER_USER_ID}}",
  "content": "Hello! Thanks for accepting my connection request!",
  "messageType": "text"
}
```

### **Get All Conversations**
```
GET {{BASE_URL}}/api/messages/conversations?page=1&limit=20
Authorization: Bearer {{TOKEN}}
```

### **Get Conversation with Specific User**
```
GET {{BASE_URL}}/api/messages/conversation/{{OTHER_USER_ID}}?page=1&limit=50
Authorization: Bearer {{TOKEN}}
```

### **Mark Messages as Read**
```
PUT {{BASE_URL}}/api/messages/read/{{OTHER_USER_ID}}
Authorization: Bearer {{TOKEN}}
```

## 🔌 **6. Socket.io Real-time Testing**

### **HTML Test Client (Create this file: `socket-test.html`)**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Socket.io Test Client</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <h1>Socket.io Test Client</h1>
    
    <div>
        <label>JWT Token:</label>
        <input type="text" id="token" placeholder="Paste your JWT token here" style="width: 500px;">
        <button onclick="connect()">Connect</button>
        <button onclick="disconnect()">Disconnect</button>
    </div>
    
    <div>
        <h3>Send Message</h3>
        <input type="text" id="receiverId" placeholder="Receiver User ID">
        <input type="text" id="messageContent" placeholder="Message content">
        <button onclick="sendMessage()">Send Message</button>
    </div>
    
    <div>
        <h3>Join Conversation</h3>
        <input type="text" id="otherUserId" placeholder="Other User ID">
        <button onclick="joinConversation()">Join Conversation</button>
    </div>
    
    <div>
        <h3>Events Log</h3>
        <div id="log" style="border: 1px solid #ccc; height: 400px; overflow-y: scroll; padding: 10px;"></div>
    </div>

    <script>
        let socket = null;
        
        function log(message) {
            const logDiv = document.getElementById('log');
            logDiv.innerHTML += '<div>' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        function connect() {
            const token = document.getElementById('token').value;
            if (!token) {
                alert('Please enter JWT token');
                return;
            }
            
            socket = io('http://localhost:5000', {
                auth: {
                    token: token
                }
            });
            
            // Connection events
            socket.on('connect', () => {
                log('✅ Connected to server!');
            });
            
            socket.on('disconnect', () => {
                log('❌ Disconnected from server');
            });
            
            socket.on('connect_error', (error) => {
                log('🚫 Connection error: ' + error.message);
            });
            
            // User status events
            socket.on('user_online', (data) => {
                log('🟢 User online: ' + data.username + ' (' + data.userId + ')');
            });
            
            socket.on('user_offline', (data) => {
                log('🔴 User offline: ' + data.username + ' (' + data.userId + ')');
            });
            
            // Connection request events
            socket.on('connection_request_received', (data) => {
                log('🔗 New connection request from: ' + data.connection.requester.username);
                log('📝 Message: ' + data.message);
            });
            
            socket.on('connection_request_responded', (data) => {
                log('✅ Connection request ' + data.action + 'ed by: ' + data.connection.receiver.username);
                log('📝 Message: ' + data.message);
            });
            
            // Message events
            socket.on('new_message', (data) => {
                log('💬 New message from: ' + data.senderUsername);
                log('📝 Content: ' + data.content);
            });
            
            socket.on('message_notification', (data) => {
                log('🔔 Message notification: ' + data.notification);
            });
            
            socket.on('messages_read', (data) => {
                log('👁️ Messages read by: ' + data.readByUsername);
            });
            
            socket.on('message_deleted', (data) => {
                log('🗑️ Message deleted by user: ' + data.deletedBy);
            });
        }
        
        function disconnect() {
            if (socket) {
                socket.disconnect();
                socket = null;
            }
        }
        
        function sendMessage() {
            if (!socket) {
                alert('Please connect first');
                return;
            }
            
            const receiverId = document.getElementById('receiverId').value;
            const content = document.getElementById('messageContent').value;
            
            if (!receiverId || !content) {
                alert('Please enter receiver ID and message content');
                return;
            }
            
            socket.emit('send_message', {
                receiverId: receiverId,
                content: content,
                messageType: 'text'
            });
            
            log('📤 Sent message to: ' + receiverId);
            document.getElementById('messageContent').value = '';
        }
        
        function joinConversation() {
            if (!socket) {
                alert('Please connect first');
                return;
            }
            
            const otherUserId = document.getElementById('otherUserId').value;
            
            if (!otherUserId) {
                alert('Please enter other user ID');
                return;
            }
            
            socket.emit('join_conversation', {
                otherUserId: otherUserId
            });
            
            log('👥 Joined conversation with: ' + otherUserId);
        }
    </script>
</body>
</html>
```

### **Node.js Test Client (Create this file: `socket-client-test.js`)**
```javascript
const io = require('socket.io-client');

// Replace with your actual JWT token
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

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

// Send a test message after 2 seconds
setTimeout(() => {
    socket.emit('send_message', {
        receiverId: 'OTHER_USER_ID_HERE',
        content: 'Hello from Socket.io client!',
        messageType: 'text'
    });
}, 2000);
```

## 🎯 **7. Complete Testing Flow**

### **Step 1: Setup Users**
1. Register User A (Alice)
2. Register User B (Bob)
3. Create profiles for both users

### **Step 2: Test Posts**
1. Login as Alice
2. Create a job post
3. Get all posts
4. Update the post
5. Login as Bob and view posts

### **Step 3: Test Connections**
1. Alice sends connection request to Bob
2. Bob gets pending requests
3. Bob accepts the connection
4. Both users can see their connections

### **Step 4: Test Messaging**
1. Alice sends message to Bob (via API)
2. Bob gets conversations
3. Bob replies to Alice

### **Step 5: Test Socket.io Real-time**
1. Open `socket-test.html` in two browser tabs
2. Connect both with different user tokens
3. Send messages and see real-time updates
4. Test connection requests in real-time

## 🔥 **Socket.io Events Reference**

### **Client → Server Events:**
- `join_conversation` - Join a chat room
- `send_message` - Send a message

### **Server → Client Events:**
- `connection_request_received` - New connection request
- `connection_request_responded` - Connection accepted/rejected
- `new_message` - New message received
- `message_notification` - Message notification
- `messages_read` - Messages marked as read
- `message_deleted` - Message deleted
- `user_online` - User came online
- `user_offline` - User went offline

## 🚀 **Pro Tips**

1. **Use Environment Variables** in Postman for BASE_URL, TOKEN, USER_ID
2. **Test with Multiple Users** - Register 2-3 users for complete testing
3. **Real-time Testing** - Use the HTML client for live Socket.io testing
4. **Check Console Logs** - Server logs show Socket.io connections
5. **Test Error Cases** - Try invalid tokens, non-existent users, etc.

**Your platform now has FULL real-time capabilities with complete testing setup! 🎉**
