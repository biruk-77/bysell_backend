// test-project/SOCKET_EVENTS_REFERENCE.md
# 🔥 **Complete Socket.io Events Reference**
## **For All User Roles (User & Admin)**

---

## 🚀 **Connection Setup**

### **Authentication Methods:**
```javascript
// Method 1: Headers (Recommended)
Headers: {
  "authorization": "Bearer YOUR_JWT_TOKEN"
}
URL: ws://localhost:5000

// Method 2: Query Parameter
URL: ws://localhost:5000?token=YOUR_JWT_TOKEN

// Method 3: Auth Object
Auth: {
  "token": "YOUR_JWT_TOKEN"
}
```

---

## 📡 **LISTENING EVENTS** (Events You Receive)

### **🔗 Connection Status Events**
| Event | Description | Data Structure | Who Receives |
|-------|-------------|----------------|--------------|
| `connect` | Successfully connected to server | `{}` | **All Users** |
| `disconnect` | Disconnected from server | `{ reason: string }` | **All Users** |
| `connect_error` | Connection failed | `{ message: string }` | **All Users** |

### **👥 User Presence Events**
| Event | Description | Data Structure | Who Receives |
|-------|-------------|----------------|--------------|
| `user_online` | Another user came online | `{ userId: string, username: string }` | **All Connected Users** |
| `user_offline` | Another user went offline | `{ userId: string, username: string }` | **All Connected Users** |

### **🔔 Connection Request Events**
| Event | Description | Data Structure | Who Receives |
|-------|-------------|----------------|--------------|
| `connection_request_received` | New connection request | `{ type: "connection_request", connection: {...}, message: string }` | **Receiver Only** |
| `connection_request_responded` | Response to your request | `{ type: "connection_response", connection: {...}, action: "accept/reject", message: string }` | **Requester Only** |

### **💬 Messaging Events**
| Event | Description | Data Structure | Who Receives |
|-------|-------------|----------------|--------------|
| `new_message` | New message in conversation | `{ message: {...}, timestamp: Date }` | **Conversation Participants** |
| `message_notification` | Message notification | `{ type: "new_message", message: {...}, notification: string }` | **Receiver Only** |
| `messages_read` | Messages marked as read | `{ readBy: string, readByUsername: string, timestamp: Date }` | **Sender Only** |
| `message_deleted` | Message was deleted | `{ messageId: string, deletedBy: string, timestamp: Date }` | **Conversation Participants** |
| `user_typing` | User typing indicator | `{ userId: string, username: string, isTyping: boolean, timestamp: Date }` | **Conversation Partner** |

### **📊 Status & Presence Events**
| Event | Description | Data Structure | Who Receives |
|-------|-------------|----------------|--------------|
| `user_status_changed` | User status updated | `{ userId: string, username: string, status: string, timestamp: Date }` | **All Connected Users** |

---

## 📤 **EMITTING EVENTS** (Events You Send)

### **💬 Messaging Events**
| Event | Description | Data to Send | Success Response |
|-------|-------------|--------------|------------------|
| `join_conversation` | Join a conversation room | `{ otherUserId: "user-id" }` | `{ success: true, message: "Successfully joined conversation", roomName: "...", participants: [...] }` |
| `send_message` | Send direct message | `{ receiverId: "user-id", content: "message", messageType: "text" }` | `{ success: true, message: "Message sent successfully", messageData: {...}, roomName: "..." }` |

### **🤝 Connection Management**
| Event | Description | Data to Send | Success Response |
|-------|-------------|--------------|------------------|
| `send_connection_request` | Send connection request with optional note | `{ receiverId: "user-id", message: "Optional note" }` | `{ success: true, message: "Connection request sent successfully", connection: {...} }` |
| `respond_connection_request` | Accept/reject connection request | `{ connectionId: "connection-id", action: "accept/reject" }` | `{ success: true, message: "Connection request accepted/rejected", connection: {...} }` |

### **📊 Status & Presence Events**
| Event | Description | Data to Send | Success Response |
|-------|-------------|--------------|------------------|
| `update_status` | Update your status | `{ status: "online/away/busy/offline" }` | `{ success: true, message: "Status updated successfully", status: "...", timestamp: Date }` |
| `get_online_users` | Get list of online users | `{}` | `{ success: true, message: "Online users retrieved successfully", onlineUsers: [...], totalOnline: number }` |

### **⌨️ Typing Indicators**
| Event | Description | Data to Send | Success Response |
|-------|-------------|--------------|------------------|
| `typing_start` | Start typing indicator | `{ receiverId: "user-id" }` | `{ success: true, message: "Typing indicator sent", receiverId: "..." }` |
| `typing_stop` | Stop typing indicator | `{ receiverId: "user-id" }` | `{ success: true, message: "Typing indicator stopped", receiverId: "..." }` |

### **🚪 Room Management**
| Event | Description | Data to Send | Success Response |
|-------|-------------|--------------|------------------|
| `leave_conversation` | Leave a conversation room | `{ otherUserId: "user-id" }` | `{ success: true, message: "Successfully left conversation", roomName: "..." }` |

### **📖 Message Management**
| Event | Description | Data to Send | Success Response |
|-------|-------------|--------------|------------------|
| `mark_messages_read` | Mark messages as read | `{ otherUserId: "user-id" }` | `{ success: true, message: "Messages marked as read", otherUserId: "..." }` |

---

## ✅ **SUCCESS CALLBACKS**

**Every emitted event returns a success/error response via callback:**

### **Success Response Format:**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* relevant data */ },
  "timestamp": "2025-01-22T02:00:00.000Z"
}
```

### **Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### **How to Use Callbacks:**
```javascript
// Example: Join conversation with callback
socket.emit('join_conversation', { otherUserId: 'user-123' }, (response) => {
  if (response.success) {
    console.log('✅ Success:', response.message);
    console.log('Room:', response.roomName);
  } else {
    console.log('❌ Error:', response.message);
  }
});

// Example: Send message with callback
socket.emit('send_message', {
  receiverId: 'user-456',
  content: 'Hello!',
  messageType: 'text'
}, (response) => {
  if (response.success) {
    console.log('✅ Message sent:', response.messageData);
  } else {
    console.log('❌ Failed to send:', response.message);
  }
});

// Example: Update status with callback
socket.emit('update_status', { status: 'away' }, (response) => {
  if (response.success) {
    console.log('✅ Status updated to:', response.status);
  } else {
    console.log('❌ Status update failed:', response.message);
  }
});
```

---

## 🎯 **DETAILED EVENT STRUCTURES**

### **Connection Request Received**
```json
{
  "type": "connection_request",
  "connection": {
    "id": "connection-uuid",
    "requesterId": "requester-uuid",
    "receiverId": "receiver-uuid", 
    "message": "Hi! Let's connect!",
    "status": "pending",
    "createdAt": "2025-01-22T02:00:00.000Z",
    "requester": {
      "id": "requester-uuid",
      "username": "alice"
    },
    "receiver": {
      "id": "receiver-uuid", 
      "username": "bob"
    }
  },
  "message": "You have a new connection request!"
}
```

### **Connection Request Response**
```json
{
  "type": "connection_response",
  "connection": {
    "id": "connection-uuid",
    "requesterId": "requester-uuid",
    "receiverId": "receiver-uuid",
    "status": "accepted", // or "rejected"
    "updatedAt": "2025-01-22T02:05:00.000Z",
    "requester": { "id": "...", "username": "alice" },
    "receiver": { "id": "...", "username": "bob" }
  },
  "action": "accept", // or "reject"
  "message": "Your connection request was accepted!"
}
```

### **New Message**
```json
{
  "message": {
    "id": "message-uuid",
    "senderId": "sender-uuid",
    "receiverId": "receiver-uuid",
    "content": "Hello! How are you?",
    "messageType": "text",
    "isRead": false,
    "createdAt": "2025-01-22T02:10:00.000Z",
    "sender": {
      "id": "sender-uuid",
      "username": "alice"
    },
    "receiver": {
      "id": "receiver-uuid",
      "username": "bob"
    }
  },
  "timestamp": "2025-01-22T02:10:00.000Z"
}
```

### **Message Notification**
```json
{
  "type": "new_message",
  "message": {
    "id": "message-uuid",
    "senderId": "sender-uuid",
    "receiverId": "receiver-uuid",
    "content": "Hello! How are you?",
    "messageType": "text",
    "sender": { "id": "...", "username": "alice" },
    "receiver": { "id": "...", "username": "bob" }
  },
  "notification": "New message from alice"
}
```

### **Direct Socket Message (send_message)**
```json
{
  "senderId": "sender-uuid",
  "senderUsername": "alice",
  "receiverId": "receiver-uuid", 
  "content": "Hello from Socket.io!",
  "messageType": "text",
  "timestamp": "2025-01-22T02:15:00.000Z"
}
```

---

## 🏠 **ROOM SYSTEM**

### **Personal Rooms**
- **Format**: `user_{userId}`
- **Purpose**: Receive personal notifications
- **Auto-joined**: Yes, on connection

### **Conversation Rooms** 
- **Format**: `{userId1}_{userId2}` (sorted alphabetically)
- **Purpose**: Private messaging between two users
- **Join Method**: Emit `join_conversation` event

---

## 👑 **ROLE-BASED ACCESS**

### **Regular Users (`role: "user"`)**
✅ **Can Do:**
- Connect to Socket.io
- Send/receive messages
- Send/respond to connection requests
- Join conversation rooms
- Receive all notification events

❌ **Cannot Do:**
- No special admin privileges (none implemented yet)

### **Admin Users (`role: "admin"`)** 
✅ **Can Do:**
- Everything regular users can do
- Same Socket.io events and permissions
- *Note: Admin-specific Socket.io events not implemented yet*

❌ **Future Admin Features:**
- Broadcast messages to all users
- Monitor user connections
- Moderate conversations

---

## 🧪 **TESTING WORKFLOW**

### **1. Setup Two Users**
```bash
# Register Alice
POST /api/auth/register
{
  "username": "alice",
  "email": "alice@example.com", 
  "password": "password123"
}

# Register Bob  
POST /api/auth/register
{
  "username": "bob",
  "email": "bob@example.com",
  "password": "password123"
}
```

### **2. Connect Both via Socket.io**
```javascript
// Alice connects
URL: ws://localhost:5000
Headers: { "authorization": "Bearer ALICE_TOKEN" }

// Bob connects  
URL: ws://localhost:5000
Headers: { "authorization": "Bearer BOB_TOKEN" }
```

### **3. Test Connection Request**
```bash
# Alice sends request to Bob
POST /api/connections/send
Authorization: Bearer ALICE_TOKEN
{
  "receiverId": "BOB_USER_ID",
  "message": "Hi Bob! Let's connect!"
}

# Bob should receive: connection_request_received event
```

### **4. Test Connection Response**
```bash
# Bob accepts Alice's request
PUT /api/connections/CONNECTION_ID/respond
Authorization: Bearer BOB_TOKEN
{
  "action": "accept"
}

# Alice should receive: connection_request_responded event
```

### **5. Test Messaging**
```bash
# Alice sends message to Bob
POST /api/messages/send
Authorization: Bearer ALICE_TOKEN
{
  "receiverId": "BOB_USER_ID",
  "content": "Hello Bob! 🎉",
  "messageType": "text"
}

# Bob should receive: new_message + message_notification events
```

### **6. Test Direct Socket Messaging**
```javascript
// Alice joins conversation
Emit: join_conversation
Data: { "otherUserId": "BOB_USER_ID" }

// Bob joins conversation  
Emit: join_conversation
Data: { "otherUserId": "ALICE_USER_ID" }

// Alice sends direct message
Emit: send_message
Data: {
  "receiverId": "BOB_USER_ID",
  "content": "Direct Socket.io message!",
  "messageType": "text"
}

// Bob should receive: new_message event
```

---

## 🔧 **TROUBLESHOOTING**

### **Connection Issues**
- ❌ **"Authentication error: No token provided"**
  - ✅ Add token to headers, query, or auth
- ❌ **"Authentication error: jwt malformed"**  
  - ✅ Check token format, remove extra "Bearer " if needed
- ❌ **Connection timeout**
  - ✅ Ensure server is running on correct port

### **Event Issues**
- ❌ **Not receiving events**
  - ✅ Check if you're in the correct room
  - ✅ Verify user IDs are correct
  - ✅ Ensure users are connected (accepted connection)
- ❌ **Events received by wrong user**
  - ✅ Check room names and user targeting

---

## 📋 **QUICK REFERENCE**

### **Essential Events to Listen For:**
```javascript
// Connection
socket.on('connect', () => console.log('Connected!'));
socket.on('disconnect', () => console.log('Disconnected!'));

// Presence  
socket.on('user_online', (data) => console.log(`${data.username} is online`));
socket.on('user_offline', (data) => console.log(`${data.username} is offline`));
socket.on('user_status_changed', (data) => console.log(`${data.username} is now ${data.status}`));

// Connection Requests
socket.on('connection_request_received', (data) => console.log('New connection request!', data));
socket.on('connection_request_responded', (data) => console.log('Request response!', data));

// Messages
socket.on('new_message', (data) => console.log('New message!', data));
socket.on('message_notification', (data) => console.log('Message notification!', data));
socket.on('messages_read', (data) => console.log('Messages read!', data));
socket.on('message_deleted', (data) => console.log('Message deleted!', data));
socket.on('user_typing', (data) => console.log(`${data.username} is ${data.isTyping ? 'typing' : 'not typing'}`));
```

### **Essential Events to Emit (with Callbacks):**
```javascript
// Join conversation
socket.emit('join_conversation', { otherUserId: 'USER_ID' }, (response) => {
  console.log(response.success ? '✅ Joined!' : '❌ Failed:', response.message);
});

// Send direct message
socket.emit('send_message', {
  receiverId: 'USER_ID',
  content: 'Hello!',
  messageType: 'text'
}, (response) => {
  console.log(response.success ? '✅ Sent!' : '❌ Failed:', response.message);
});

// Update status
socket.emit('update_status', { status: 'away' }, (response) => {
  console.log(response.success ? '✅ Status updated!' : '❌ Failed:', response.message);
});

// Get online users
socket.emit('get_online_users', {}, (response) => {
  if (response.success) {
    console.log('✅ Online users:', response.onlineUsers);
  }
});

// Typing indicators
socket.emit('typing_start', { receiverId: 'USER_ID' }, (response) => {
  console.log(response.success ? '✅ Typing started!' : '❌ Failed:', response.message);
});

socket.emit('typing_stop', { receiverId: 'USER_ID' }, (response) => {
  console.log(response.success ? '✅ Typing stopped!' : '❌ Failed:', response.message);
});
```

---

## 🎉 **Ready to Test!**

Your Socket.io system supports:
- ✅ **Real-time Connection Requests**
- ✅ **Instant Messaging** 
- ✅ **User Presence (Online/Offline)**
- ✅ **User Status Updates (Online/Away/Busy/Offline)**
- ✅ **Typing Indicators**
- ✅ **Online Users List**
- ✅ **Read Receipts**
- ✅ **Message Deletion Notifications**
- ✅ **Role-based Authentication**
- ✅ **Room-based Communication**
- ✅ **Success/Error Callbacks for All Events**

**Start testing with the workflow above! 🚀**
