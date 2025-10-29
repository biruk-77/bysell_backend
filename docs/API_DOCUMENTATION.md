// test-project/API_DOCUMENTATION.md
# 🚀 **ByAndSell API Documentation**
## **Complete REST API Reference**
### **Version: 2.0** - Updated with complete messaging, status tracking, and real-time features

---

## 📋 **Table of Contents**
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Security Features](#security-features)
5. [API Endpoints](#api-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Socket.io Events](#socketio-events)

---

## 🎯 **Overview**

ByAndSell is a comprehensive social platform API supporting multiple user roles with different privileges:
- **Employee**: Job seekers, basic users
- **Employer**: Companies posting jobs
- **Buyer**: Users purchasing products/services
- **Seller**: Users selling products/services  
- **Connector**: Network facilitators, advanced users
- **Admin**: System administrators

### **Base URL**: `http://localhost:5000/api`

---

## 🔐 **Authentication**

### **JWT Token System**
All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

### **Token Structure**
```json
{
  "id": "user-uuid",
  "username": "alice123",
  "email": "alice@example.com",
  "role": "employee",
  "iat": 1698876543,
  "exp": 1698962943
}
```

---

## 👑 **User Roles & Permissions**

| Role | Level | Key Permissions |
|------|-------|-----------------|
| **Admin** | 6 | Full system access, user management, content moderation |
| **Connector** | 5 | Advanced networking, limited moderation, analytics |
| **Employer** | 4 | Job posting, candidate search, application management |
| **Seller** | 3 | Product/service posting, buyer interaction, inventory |
| **Buyer** | 2 | Purchase requests, seller search, order management |
| **Employee** | 1 | Profile creation, job search, basic networking |

### **Permission Categories**
- **manage_users**: Admin user management
- **manage_posts**: Content moderation
- **create_posts**: Post creation by type
- **send_connections**: Network with others
- **moderate_content**: Community moderation
- **view_analytics**: System insights
- **access_admin_panel**: Admin dashboard

---

## 🛡️ **Security Features**

### **Rate Limiting**
- **General API**: 100 requests/15 minutes per IP
- **Authentication**: 5 attempts/15 minutes per IP
- **Password Reset**: 3 attempts/hour per IP
- **Admin Actions**: 30 requests/minute per user

### **Input Validation**
- XSS protection with sanitization
- SQL injection prevention
- Email/username format validation
- Password strength requirements
- File upload restrictions

### **Security Headers**
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- Helmet.js security suite

---

## 🌐 **API Endpoints**

### **🔑 Authentication Routes**
**Base**: `/api/auth`

#### **Register User**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "alice123",
  "email": "alice@example.com",
  "password": "password123",
  "role": "employee",
  "phoneNumber": "+1234567890",
  "location": "New York, NY"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "alice123",
    "email": "alice@example.com",
    "role": "employee",
    "status": "active",
    "isEmailVerified": false,
    "createdAt": "2025-01-22T10:00:00.000Z"
  }
}
```

#### **Login User**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "alice123",
    "email": "alice@example.com",
    "role": "employee",
    "status": "active",
    "lastLogin": "2025-01-22T10:00:00.000Z"
  }
}
```

#### **Get Current User**
```http
GET /api/auth/me
Authorization: Bearer TOKEN
```

**Response (200)**:
```json
{
  "success": true,
  "message": "User info retrieved successfully",
  "user": {
    "id": "uuid",
    "username": "alice123",
    "email": "alice@example.com",
    "role": "employee",
    "createdAt": "2025-01-22T10:00:00.000Z"
  }
}
```

---

### **👤 Profile Management Routes**
**Base**: `/api/profile`

#### **Create/Update Profile**
```http
POST /api/profile
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

{
  "bio": "Experienced web developer",
  "skills": "React, Node.js, Python",
  "experience": "5 years in software development",
  "location": "San Francisco, CA"
}
```

#### **Get My Profile**
```http
GET /api/profile/me
Authorization: Bearer TOKEN
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "hasProfile": true,
  "profile": {
    "id": "uuid",
    "userId": "uuid",
    "bio": "Experienced web developer",
    "skills": "React, Node.js, Python",
    "experience": "5 years in software development",
    "location": "San Francisco, CA",
    "profileImage": "/uploads/profile-images/filename.jpg",
    "user": {
      "username": "alice123",
      "email": "alice@example.com",
      "role": "employee"
    }
  }
}
```

---

### **📋 Posts/Listings Routes**
**Base**: `/api/posts`

#### **Create Post**
```http
POST /api/posts
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "title": "Frontend Developer Position",
  "description": "Looking for an experienced React developer",
  "type": "offer",
  "category": "job",
  "location": "Remote",
  "price": 75000,
  "requirements": "3+ years React experience",
  "tags": "react,frontend,remote"
}
```

**Role Requirements**:
- **Employer**: Can create job offers
- **Seller**: Can create product/service offers
- **Buyer**: Can create purchase requests
- **Employee**: Can create job requests

#### **Get All Posts**
```http
GET /api/posts?page=1&limit=10&type=offer&category=job&location=Remote
Authorization: Bearer TOKEN
```

#### **Get Post by ID**
```http
GET /api/posts/:postId
Authorization: Bearer TOKEN
```

#### **Update Post**
```http
PUT /api/posts/:postId
Authorization: Bearer TOKEN
```

#### **Delete Post**
```http
DELETE /api/posts/:postId
Authorization: Bearer TOKEN
```

---

### **🔗 Connection/Matchmaking Routes**
**Base**: `/api/connections`

#### **Send Connection Request**
```http
POST /api/connections/send
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "receiverId": "target-user-uuid",
  "message": "Hi! I'd like to connect with you."
}
```

#### **Respond to Connection Request**
```http
PUT /api/connections/:connectionId/respond
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "action": "accept"
}
```

#### **Get My Connections**
```http
GET /api/connections?page=1&limit=10
Authorization: Bearer TOKEN
```

#### **Get Pending Requests**
```http
GET /api/connections/pending?page=1&limit=10
Authorization: Bearer TOKEN
```

---

### **💬 Messaging Routes**
**Base**: `/api/messages`

#### **⚠️ Message Sending is Socket-Only**
**Use Socket.io event `send_message` instead of REST API**

```javascript
// Send message via Socket.io
socket.emit('send_message', {
  receiverId: "target-user-uuid",
  content: "Hello! How are you?",
  messageType: "text"
}, (response) => {
  if (response.success) {
    console.log('Message sent!');
  }
});
```

#### **Get Conversation History**
```http
GET /api/messages/conversation/:otherUserId?page=1&limit=50
Authorization: Bearer TOKEN
```

#### **Get All Conversations**
```http
GET /api/messages/conversations?page=1&limit=20
Authorization: Bearer TOKEN
```

#### **Mark Messages as Read**
```http
PUT /api/messages/read/:otherUserId
Authorization: Bearer TOKEN
```

---

### **🔔 Notification Routes**
**Base**: `/api/notifications`

#### **Get Notifications**
```http
GET /api/notifications?page=1&limit=20&type=connection_request&isRead=false
Authorization: Bearer TOKEN
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "connection_request",
        "title": "New Connection Request",
        "message": "Alice wants to connect with you",
        "isRead": false,
        "priority": "medium",
        "createdAt": "2025-01-22T10:00:00.000Z",
        "fromUser": {
          "username": "alice123",
          "role": "employee"
        }
      }
    ],
    "unreadCount": 5,
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalNotifications": 25
    }
  }
}
```

#### **Mark Notification as Read**
```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer TOKEN
```

#### **Mark All as Read**
```http
PUT /api/notifications/read-all
Authorization: Bearer TOKEN
```

#### **Delete Notification**
```http
DELETE /api/notifications/:notificationId
Authorization: Bearer TOKEN
```

---

### **📊 Status Management Routes**
**Base**: `/api/status`

#### **Update User Status**
```http
PUT /api/status
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "status": "away"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "status": "away",
    "lastSeen": "2025-01-22T03:15:30.000Z"
  }
}
```

#### **Get User Status**
```http
GET /api/status/:userId
Authorization: Bearer TOKEN
```

**Response (200)**:
```json
{
  "success": true,
  "message": "User status retrieved successfully",
  "data": {
    "status": {
      "id": "status-uuid",
      "userId": "user-uuid", 
      "status": "online",
      "lastSeen": "2025-01-22T03:15:30.000Z",
      "socketId": "socket-id-123",
      "isTypingTo": null,
      "user": {
        "id": "user-uuid",
        "username": "alice123"
      }
    }
  }
}
```

#### **Get Online Users**
```http
GET /api/status/online/users?page=1&limit=50
Authorization: Bearer TOKEN
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Online users retrieved successfully",
  "data": {
    "totalOnline": 142,
    "totalPages": 3,
    "currentPage": 1,
    "onlineUsers": [
      {
        "id": "status-uuid",
        "userId": "user-uuid",
        "status": "online",
        "lastSeen": "2025-01-22T03:15:30.000Z",
        "user": {
          "id": "user-uuid",
          "username": "alice123"
        }
      }
    ]
  }
}
```

#### **Update Typing Status**
```http
PUT /api/status/typing
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "isTyping": true,
  "otherUserId": "user-uuid"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Typing status updated successfully",
  "data": {
    "isTyping": true,
    "otherUserId": "user-uuid"
  }
}
```

**Status Values**:
- `online` - User is active
- `away` - User is idle  
- `busy` - User is busy/in DND mode
- `offline` - User is disconnected

---

### **🔍 Search & Discovery Routes**
**Base**: `/api/search`

#### **Unified Search**
```http
GET /api/search?query=developer&type=all&location=remote&page=1&limit=20
Authorization: Bearer TOKEN
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": {
    "query": "developer",
    "type": "all",
    "results": {
      "users": {
        "data": [...],
        "count": 15,
        "hasMore": true
      },
      "posts": {
        "data": [...],
        "count": 23,
        "hasMore": true
      }
    },
    "totalResults": 38
  }
}
```

#### **Search Users Only**
```http
GET /api/search/users?query=react&role=employee&location=sf&skills=javascript
Authorization: Bearer TOKEN
```

#### **Search Posts Only**
```http
GET /api/search/posts?query=remote&type=offer&category=job&minPrice=50000
Authorization: Bearer TOKEN
```

#### **Get Search Suggestions**
```http
GET /api/search/suggestions?query=dev&type=all
Authorization: Bearer TOKEN
```

#### **Get Discovery Feed**
```http
GET /api/search/discover?page=1&limit=20&type=mixed
Authorization: Bearer TOKEN
```

---

### **👑 Admin Routes**
**Base**: `/api/admin` *(Admin Only)*

#### **Get All Users**
```http
GET /api/admin/users?page=1&limit=20&role=employee&status=active&search=alice
Authorization: Bearer ADMIN_TOKEN
```

#### **Get User Details**
```http
GET /api/admin/users/:userId
Authorization: Bearer ADMIN_TOKEN
```

#### **Update User**
```http
PUT /api/admin/users/:userId
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "role": "connector",
  "status": "active",
  "isEmailVerified": true
}
```

#### **Suspend User**
```http
POST /api/admin/users/:userId/suspend
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "reason": "Terms violation",
  "duration": 30
}
```

#### **Delete User**
```http
DELETE /api/admin/users/:userId
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "reason": "Spam account"
}
```

#### **Get System Statistics**
```http
GET /api/admin/stats
Authorization: Bearer ADMIN_TOKEN
```

**Response (200)**:
```json
{
  "success": true,
  "message": "System statistics retrieved successfully",
  "data": {
    "overview": {
      "totalUsers": 1250,
      "activeUsers": 1180,
      "suspendedUsers": 15,
      "totalPosts": 3420,
      "activePosts": 3200,
      "totalConnections": 5680,
      "totalMessages": 12340
    },
    "roleDistribution": [
      { "role": "employee", "count": 650 },
      { "role": "employer", "count": 280 },
      { "role": "buyer", "count": 190 },
      { "role": "seller", "count": 85 },
      { "role": "connector", "count": 40 },
      { "role": "admin", "count": 5 }
    ],
    "recentActivity": {
      "newUsers": 45,
      "newPosts": 123,
      "newConnections": 89,
      "newMessages": 456
    }
  }
}
```

#### **Send System Announcement**
```http
POST /api/admin/announcement
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "Scheduled maintenance on Sunday at 2 AM",
  "priority": "high",
  "targetRoles": ["all"],
  "expiresInDays": 7
}
```

---

## ❌ **Error Handling**

### **Standard Error Response**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Specific error details"],
  "code": "ERROR_CODE"
}
```

### **Common HTTP Status Codes**
- **200**: Success
- **201**: Created
- **400**: Bad Request / Validation Error
- **401**: Unauthorized / Invalid Token
- **403**: Forbidden / Insufficient Permissions
- **404**: Not Found
- **409**: Conflict / Duplicate Resource
- **429**: Too Many Requests / Rate Limited
- **500**: Internal Server Error

### **Validation Errors**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Username must be 3-30 characters long",
    "Please provide a valid email address",
    "Password must be at least 8 characters long"
  ]
}
```

### **Authentication Errors**
```json
{
  "success": false,
  "message": "Access denied. Token expired."
}
```

### **Authorization Errors**
```json
{
  "success": false,
  "message": "Access denied. Required roles: admin. Your role: employee"
}
```

---

## 🚦 **Rate Limiting**

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698876543
Retry-After: 900
```

### **Rate Limit Response**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again after 15 minutes.",
  "retryAfter": "15 minutes"
}
```

---

## 🔌 **Socket.io Events**

### **Connection Setup**
```javascript
// Headers method (recommended)
const socket = io('http://localhost:5000', {
  extraHeaders: {
    'authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

### **Listening Events**
```javascript
// Connection status
socket.on('connect', () => console.log('Connected!'));
socket.on('disconnect', () => console.log('Disconnected!'));

// User presence
socket.on('user_online', (data) => console.log(`${data.username} is online`));
socket.on('user_offline', (data) => console.log(`${data.username} is offline`));
socket.on('user_status_changed', (data) => console.log(`${data.username} is now ${data.status}`));

// Connection requests
socket.on('connection_request_received', (data) => console.log('New connection request!', data));
socket.on('connection_request_responded', (data) => console.log('Request response!', data));

// Messages
socket.on('new_message', (data) => console.log('New message!', data));
socket.on('message_notification', (data) => console.log('Message notification!', data));
socket.on('user_typing', (data) => console.log(`${data.username} is typing`));

// Notifications
socket.on('new_notification', (data) => console.log('New notification!', data));
```

### **Emitting Events (with Callbacks)**
```javascript
// Join conversation
socket.emit('join_conversation', { otherUserId: 'USER_ID' }, (response) => {
  console.log(response.success ? '✅ Joined!' : '❌ Failed:', response.message);
});

// Send message
socket.emit('send_message', {
  receiverId: 'USER_ID',
  content: 'Hello!',
  messageType: 'text'
}, (response) => {
  console.log(response.success ? '✅ Sent!' : '❌ Failed:', response.message);
});

// Update status
socket.emit('update_status', { status: 'away' }, (response) => {
  console.log(response.success ? '✅ Updated!' : '❌ Failed:', response.message);
});

// Typing indicators
socket.emit('typing_start', { receiverId: 'USER_ID' }, (response) => {
  console.log(response.success ? '✅ Typing started!' : '❌ Failed:', response.message);
});
```

---

## 🧪 **Testing Examples**

### **Postman Collection Setup**
1. **Create Environment**: `ByAndSell_API`
2. **Add Variables**:
   - `base_url`: `http://localhost:5000/api`
   - `auth_token`: (will be set after login)
   - `user_id`: (will be set after login)

### **Authentication Flow**
```javascript
// Test Script (in Postman)
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Token is present", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
    pm.environment.set("auth_token", jsonData.token);
    pm.environment.set("user_id", jsonData.user.id);
});
```

### **Role-Based Testing**
```bash
# Register different roles
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin1",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "employer1",
    "email": "employer@example.com",
    "password": "password123",
    "role": "employer"
  }'
```

---

## 📚 **Additional Resources**

### **Role Permission Matrix**
| Action | Employee | Buyer | Seller | Employer | Connector | Admin |
|--------|----------|-------|--------|----------|-----------|-------|
| Create Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search Jobs | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Post Jobs | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Search Products | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Sell Products | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Moderate Content | ❌ | ❌ | ❌ | ❌ | Limited | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| System Analytics | ❌ | ❌ | ❌ | ❌ | Limited | ✅ |

### **Database Schema**
- **users**: Core user information with roles
- **profiles**: Extended user profile data
- **posts**: Job/product/service listings
- **connections**: User networking relationships
- **messages**: Private messaging system
- **notifications**: System and user notifications

### **Security Best Practices**
1. **Always use HTTPS in production**
2. **Validate all input data**
3. **Sanitize user content**
4. **Implement proper rate limiting**
5. **Regular security audits**
6. **Keep dependencies updated**
7. **Use strong JWT secrets**
8. **Implement proper CORS policies**

---

## 🎉 **Ready to Use!**

Your ByAndSell API now includes:
- ✅ **6 User Roles** with different privileges
- ✅ **Complete Authentication System**
- ✅ **Role-Based Authorization**
- ✅ **Admin Panel APIs**
- ✅ **Notification System**
- ✅ **Search & Discovery**
- ✅ **Real-time Socket.io**
- ✅ **Security Middleware**
- ✅ **Input Validation**
- ✅ **Rate Limiting**
- ✅ **Comprehensive Documentation**

**Start building your frontend and connect to these powerful APIs! 🚀**
