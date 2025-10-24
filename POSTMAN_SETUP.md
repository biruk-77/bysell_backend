# 🚀 Complete Postman Collection Setup Guide

## 📋 **Complete API Testing Environment**
### **Updated for v2.0 with Status Management & Real-time Features**

## 📋 **Environment Variables Setup**

First, create a Postman Environment with these variables:

```
BASE_URL = http://localhost:5000
TOKEN = (will be set automatically after login)
USER_ID = (will be set automatically after login)
```

## 🔐 **1. Authentication Endpoints**

### **Register User**
```
POST {{BASE_URL}}/api/auth/register
Content-Type: application/json

Body (JSON):
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}

Tests Script:
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("TOKEN", response.token);
    pm.environment.set("USER_ID", response.user.id);
}
```

### **Login User**
```
POST {{BASE_URL}}/api/auth/login
Content-Type: application/json

Body (JSON):
{
  "email": "john@example.com",
  "password": "password123"
}

Tests Script:
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("TOKEN", response.token);
    pm.environment.set("USER_ID", response.user.id);
}
```

### **Get My Account Info**
```
GET {{BASE_URL}}/api/auth/me
Authorization: Bearer {{TOKEN}}
```

### **Update Account**
```
PUT {{BASE_URL}}/api/auth/account
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "username": "newusername",
  "email": "newemail@example.com"
}
```

### **Change Password**
```
PUT {{BASE_URL}}/api/auth/password
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

## 👤 **2. Profile Endpoints**

### **Create Profile**
```
POST {{BASE_URL}}/api/profile
Authorization: Bearer {{TOKEN}}
Content-Type: multipart/form-data

Form Data:
- bio: "I am a full-stack developer"
- skills: "JavaScript, Node.js, React"
- experience: "5 years of experience"
- location: "London, UK"
- profileImage: [SELECT FILE]
```

### **Update Profile**
```
PUT {{BASE_URL}}/api/profile
Authorization: Bearer {{TOKEN}}
Content-Type: multipart/form-data

Form Data:
- bio: "Updated bio"
- skills: "Updated skills"
- profileImage: [SELECT FILE] (optional)
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
  "description": "Need experienced React developer for startup project",
  "postType": "request",
  "category": "job",
  "location": "London"
}
```

### **Get All Posts (with filters)**
```
GET {{BASE_URL}}/api/posts?postType=offer&category=job&location=London&page=1&limit=10
```

### **Get Single Post**
```
GET {{BASE_URL}}/api/posts/{{POST_ID}}
```

### **Update Post**
```
PUT {{BASE_URL}}/api/posts/{{POST_ID}}
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "title": "Updated title",
  "description": "Updated description"
}
```

### **Get My Posts**
```
GET {{BASE_URL}}/api/posts/my?page=1&limit=10
Authorization: Bearer {{TOKEN}}
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
  "receiverId": "RECEIVER_USER_ID_HERE",
  "message": "Hi! I'd like to connect with you"
}
```

### **Accept Connection Request**
```
PUT {{BASE_URL}}/api/connections/{{CONNECTION_ID}}/respond
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "action": "accept"
}
```

### **Reject Connection Request**
```
PUT {{BASE_URL}}/api/connections/{{CONNECTION_ID}}/respond
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body (JSON):
{
  "action": "reject"
}
```

### **Get My Connections**
```
GET {{BASE_URL}}/api/connections?page=1&limit=10
Authorization: Bearer {{TOKEN}}
```

### **Get Pending Requests (Received)**
```
GET {{BASE_URL}}/api/connections/pending?page=1&limit=10
Authorization: Bearer {{TOKEN}}
```

### **Get Sent Requests**
```
GET {{BASE_URL}}/api/connections/sent?page=1&limit=10
Authorization: Bearer {{TOKEN}}
```

### **Remove Connection**
```
DELETE {{BASE_URL}}/api/connections/{{CONNECTION_ID}}
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
  "receiverId": "RECEIVER_USER_ID_HERE",
  "content": "Hello! How are you?",
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

### **Delete Message**
```
DELETE {{BASE_URL}}/api/messages/{{MESSAGE_ID}}
Authorization: Bearer {{TOKEN}}
```

## 🔌 **6. Socket.io Real-time Testing**

### **Connect to Socket.io (JavaScript Client)**
```javascript
// Install: npm install socket.io-client
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
    auth: {
        token: 'YOUR_JWT_TOKEN_HERE'
    }
});

// Listen for connection events
socket.on('connect', () => {
    console.log('Connected to server!');
});

// Listen for connection requests
socket.on('connection_request_received', (data) => {
    console.log('New connection request:', data);
});

// Listen for connection responses
socket.on('connection_request_responded', (data) => {
    console.log('Connection request response:', data);
});

// Listen for new messages
socket.on('new_message', (data) => {
    console.log('New message:', data);
});

// Join a conversation
socket.emit('join_conversation', {
    otherUserId: 'OTHER_USER_ID_HERE'
});

// Send a message via socket
socket.emit('send_message', {
    receiverId: 'RECEIVER_ID_HERE',
    content: 'Hello via Socket.io!',
    messageType: 'text'
});
```

## 🎯 **Testing Flow**

1. **Register** two users (User A & User B)
2. **Login** as User A, save token
3. **Create Profile** for User A
4. **Create Posts** as User A
5. **Login** as User B, save token
6. **Create Profile** for User B
7. **Send Connection Request** from User A to User B
8. **Accept Connection** as User B
9. **Send Messages** between users
10. **Test Socket.io** real-time features

## 🔥 **Pro Tips**

- Use **Environment Variables** for BASE_URL and TOKEN
- Set up **Pre-request Scripts** to auto-set tokens
- Use **Tests** to validate responses
- Create **Collections** for each feature
- Use **Variables** for dynamic IDs

## 🚀 **Socket.io Events**

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

**Your platform now has FULL real-time capabilities! 🎉**
