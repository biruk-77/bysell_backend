# 🚀 **Frontend Socket.io Integration Examples**
## **Complete Implementation Guide**

---

## 📡 **Socket Connection Setup**

```javascript
import io from 'socket.io-client';

// Initialize socket connection with authentication
const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token') // Your JWT token
  }
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to server');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error);
});
```

---

## 🤝 **Connection Requests with Notes**

### **Send Connection Request (with optional note)**

```javascript
const sendConnectionRequest = (receiverId, customNote = '') => {
  const message = customNote || 'Hi! I would like to connect with you.';
  
  socket.emit('send_connection_request', {
    receiverId: receiverId,
    message: message
  }, (response) => {
    if (response.success) {
      console.log('✅ Connection request sent!');
      // Show success message to user
      showNotification('Connection request sent successfully!', 'success');
    } else {
      console.error('❌ Failed to send request:', response.message);
      showNotification(response.message, 'error');
    }
  });
};

// Example usage
sendConnectionRequest('user-123', 'Hello! I saw your profile and would love to connect!');
```

### **React Component Example - Connection Request Form**

```jsx
import React, { useState } from 'react';

const ConnectionRequestForm = ({ targetUserId, targetUsername, onClose }) => {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = () => {
    setIsLoading(true);
    
    const message = note.trim() || `Hi ${targetUsername}! I would like to connect with you.`;
    
    socket.emit('send_connection_request', {
      receiverId: targetUserId,
      message: message
    }, (response) => {
      setIsLoading(false);
      
      if (response.success) {
        toast.success('Connection request sent!');
        onClose();
      } else {
        toast.error(response.message);
      }
    });
  };

  return (
    <div className="connection-request-form">
      <h3>Send Connection Request to {targetUsername}</h3>
      
      <div className="form-group">
        <label>Add a personal note (optional):</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`Hi ${targetUsername}! I would like to connect with you.`}
          maxLength={500}
          rows={4}
          className="form-textarea"
        />
        <small className="text-gray-500">
          {note.length}/500 characters
        </small>
      </div>
      
      <div className="form-actions">
        <button 
          onClick={onClose}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          onClick={handleSendRequest}
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </div>
  );
};
```

### **Listen for Connection Requests**

```javascript
// Listen for incoming connection requests
socket.on('connection_request_received', (data) => {
  console.log('🔔 New connection request:', data);
  
  const { connection, message } = data;
  const requester = connection.requester;
  
  // Show notification to user
  showConnectionRequestNotification({
    id: connection.id,
    from: requester.username,
    note: connection.message,
    onAccept: () => respondToConnectionRequest(connection.id, 'accept'),
    onReject: () => respondToConnectionRequest(connection.id, 'reject')
  });
});

// Listen for responses to your requests
socket.on('connection_request_responded', (data) => {
  console.log('📬 Connection request response:', data);
  
  const { action, connection, message } = data;
  const responder = connection.receiver;
  
  if (action === 'accept') {
    showNotification(`${responder.username} accepted your connection request!`, 'success');
  } else {
    showNotification(`${responder.username} declined your connection request.`, 'info');
  }
});
```

### **Respond to Connection Requests**

```javascript
const respondToConnectionRequest = (connectionId, action) => {
  socket.emit('respond_connection_request', {
    connectionId: connectionId,
    action: action // 'accept' or 'reject'
  }, (response) => {
    if (response.success) {
      console.log(`✅ Connection request ${action}ed`);
      showNotification(`Connection request ${action}ed!`, 'success');
      
      // Remove notification from UI
      removeConnectionRequestNotification(connectionId);
    } else {
      console.error(`❌ Failed to ${action} request:`, response.message);
      showNotification(response.message, 'error');
    }
  });
};
```

---

## 💬 **Socket-Only Messaging**

### **Send Message via Socket**

```javascript
const sendMessage = (receiverId, content, messageType = 'text') => {
  socket.emit('send_message', {
    receiverId: receiverId,
    content: content,
    messageType: messageType
  }, (response) => {
    if (response.success) {
      console.log('✅ Message sent via socket');
      // Message will appear via 'new_message' event
    } else {
      console.error('❌ Failed to send message:', response.message);
      showNotification(response.message, 'error');
    }
  });
};
```

### **Listen for New Messages**

```javascript
// Listen for new messages in conversations
socket.on('new_message', (data) => {
  console.log('💬 New message received:', data);
  
  const { senderId, senderUsername, content, timestamp } = data;
  
  // Add message to current conversation if it's open
  if (currentConversationUserId === senderId) {
    addMessageToConversation(data);
  }
  
  // Show notification if not in conversation
  if (currentConversationUserId !== senderId) {
    showMessageNotification({
      from: senderUsername,
      content: content,
      onClick: () => openConversation(senderId)
    });
  }
});
```

### **React Chat Component Example**

```jsx
import React, { useState, useEffect } from 'react';

const ChatComponent = ({ otherUserId, otherUsername }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Join conversation room
    socket.emit('join_conversation', { otherUserId }, (response) => {
      if (response.success) {
        console.log('✅ Joined conversation room');
      }
    });

    // Listen for new messages
    socket.on('new_message', (data) => {
      if (data.senderId === otherUserId || data.receiverId === otherUserId) {
        setMessages(prev => [...prev, data]);
      }
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
      if (data.userId === otherUserId) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      // Leave conversation room
      socket.emit('leave_conversation', { otherUserId });
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [otherUserId]);

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit('send_message', {
        receiverId: otherUserId,
        content: message.trim(),
        messageType: 'text'
      }, (response) => {
        if (response.success) {
          setMessage(''); // Clear input
        } else {
          console.error('Failed to send message:', response.message);
        }
      });
    }
  };

  const handleTyping = (isTyping) => {
    socket.emit(isTyping ? 'typing_start' : 'typing_stop', {
      receiverId: otherUserId
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat with {otherUsername}</h3>
        {isTyping && <span className="typing-indicator">{otherUsername} is typing...</span>}
      </div>
      
      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.senderId === socket.userId ? 'sent' : 'received'}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      
      <div className="message-input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          className="message-input"
        />
        <button onClick={handleSendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};
```

---

## 🎯 **Complete Socket Event Handlers**

```javascript
// Set up all socket event listeners
const setupSocketListeners = () => {
  // Connection events
  socket.on('connect', () => {
    console.log('✅ Connected to server');
    updateConnectionStatus(true);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    updateConnectionStatus(false);
  });

  // User presence
  socket.on('user_online', (data) => {
    console.log('👋 User came online:', data.username);
    updateUserStatus(data.userId, 'online');
  });

  socket.on('user_offline', (data) => {
    console.log('👋 User went offline:', data.username);
    updateUserStatus(data.userId, 'offline');
  });

  // Connection requests
  socket.on('connection_request_received', (data) => {
    showConnectionRequestNotification(data);
  });

  socket.on('connection_request_responded', (data) => {
    showConnectionResponseNotification(data);
  });

  // Messaging
  socket.on('new_message', (data) => {
    handleNewMessage(data);
  });

  socket.on('user_typing', (data) => {
    handleTypingIndicator(data);
  });

  socket.on('messages_read', (data) => {
    handleMessagesRead(data);
  });

  // Status updates
  socket.on('user_status_changed', (data) => {
    updateUserStatus(data.userId, data.status);
  });
};

// Initialize socket connection
setupSocketListeners();
```

---

## 🎨 **CSS Styling Examples**

```css
/* Connection Request Form */
.connection-request-form {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

/* Chat Component */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 12px;
  max-width: 70%;
}

.message.sent {
  margin-left: auto;
  text-align: right;
}

.message.received {
  margin-right: auto;
}

.message-content {
  background: #007bff;
  color: white;
  padding: 8px 12px;
  border-radius: 12px;
  display: inline-block;
}

.message.received .message-content {
  background: #e9ecef;
  color: #333;
}

.message-input-container {
  display: flex;
  padding: 16px;
  border-top: 1px solid #ddd;
  gap: 8px;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.send-button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.typing-indicator {
  font-size: 12px;
  color: #666;
  font-style: italic;
}
```

**Your messaging is now Socket-only with connection notes feature!** 🎉
