// --- IMPORTS ---
// Import the necessary packages
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const sequelize = require('./config/database'); // Using the sequelize instance from our config
const models = require('./models'); // Import models to establish relationships

// --- CONFIGURATION ---
// Load environment variables from the .env file
dotenv.config();

// Create the main Express application
const app = express();

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // In production, specify your frontend domain
        methods: ["GET", "POST"]
    }
});

const logger = require('./utils/logger');
app.use(logger);

// This middleware parses incoming requests with JSON payloads.
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// --- MIDDLEWARE ---
// This is a crucial step. This middleware parses incoming requests with JSON payloads.
// It MUST come BEFORE you register any routes that need to read the request body (like login/register).
app.use(express.json());

// --- ROUTES ---
// Import our newly created authentication routes
const authRoutes = require('./routes/auth.routes');
// Tell the app to use these routes for any URL starting with '/api/auth'
app.use('/api/auth', authRoutes);

const profileRoutes = require('./routes/profileRoutes.js');
app.use('/api/profile', profileRoutes);

const postRoutes = require('./routes/post.routes.js');
app.use('/api/posts', postRoutes);

const connectionRoutes = require('./routes/connection.routes.js');
app.use('/api/connections', connectionRoutes);

const messageRoutes = require('./routes/message.routes.js');
app.use('/api/messages', messageRoutes);

// --- SOCKET.IO SETUP ---
// Store connected users
const connectedUsers = new Map();

// Socket.io authentication middleware
const jwt = require('jsonwebtoken');
io.use((socket, next) => {
    try {
        // Try to get token from multiple sources
        let token = socket.handshake.auth.token || 
                   socket.handshake.query.token ||
                   socket.handshake.headers.authorization;
        
        // Handle Bearer token format
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7); // Remove 'Bearer ' prefix
        }
        
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.username = decoded.username;
        next();
    } catch (err) {
        next(new Error('Authentication error: ' + err.message));
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔗 User ${socket.username} connected (${socket.userId})`);
    
    // Store user connection
    connectedUsers.set(socket.userId, {
        socketId: socket.id,
        username: socket.username,
        userId: socket.userId
    });

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Notify user is online
    socket.broadcast.emit('user_online', {
        userId: socket.userId,
        username: socket.username
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`❌ User ${socket.username} disconnected`);
        connectedUsers.delete(socket.userId);
        
        // Notify user is offline
        socket.broadcast.emit('user_offline', {
            userId: socket.userId,
            username: socket.username
        });
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', (data, callback) => {
        try {
            const { otherUserId } = data;
            
            if (!otherUserId) {
                const error = { success: false, message: 'otherUserId is required' };
                console.log(`❌ Join conversation failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            const roomName = [socket.userId, otherUserId].sort().join('_');
            socket.join(roomName);
            console.log(`👥 ${socket.username} joined conversation room: ${roomName}`);
            
            // Send success response
            const success = {
                success: true,
                message: 'Successfully joined conversation',
                roomName: roomName,
                participants: [socket.userId, otherUserId]
            };
            
            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to join conversation',
                error: error.message 
            };
            console.log(`❌ Join conversation error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Handle private messages
    socket.on('send_message', (data, callback) => {
        try {
            const { receiverId, content, messageType = 'text' } = data;
            
            // Validate input
            if (!receiverId || !content) {
                const error = { 
                    success: false, 
                    message: 'receiverId and content are required' 
                };
                console.log(`❌ Send message failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            const roomName = [socket.userId, receiverId].sort().join('_');
            
            // Create message object
            const messageData = {
                senderId: socket.userId,
                senderUsername: socket.username,
                receiverId,
                content,
                messageType,
                timestamp: new Date()
            };
            
            // Emit to the conversation room
            io.to(roomName).emit('new_message', messageData);
            
            console.log(`💬 Message sent from ${socket.username} to ${receiverId}`);
            
            // Send success response
            const success = {
                success: true,
                message: 'Message sent successfully',
                messageData: messageData,
                roomName: roomName
            };
            
            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to send message',
                error: error.message 
            };
            console.log(`❌ Send message error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Handle user status updates
    socket.on('update_status', (data, callback) => {
        try {
            const { status } = data; // 'online', 'away', 'busy', 'offline'
            
            if (!status || !['online', 'away', 'busy', 'offline'].includes(status)) {
                const error = { 
                    success: false, 
                    message: 'Valid status is required (online, away, busy, offline)' 
                };
                return callback ? callback(error) : null;
            }

            // Update user status in connected users
            const userInfo = connectedUsers.get(socket.userId);
            if (userInfo) {
                userInfo.status = status;
                connectedUsers.set(socket.userId, userInfo);
            }

            // Broadcast status update to all users
            socket.broadcast.emit('user_status_changed', {
                userId: socket.userId,
                username: socket.username,
                status: status,
                timestamp: new Date()
            });

            console.log(`📊 ${socket.username} status changed to: ${status}`);

            const success = {
                success: true,
                message: 'Status updated successfully',
                status: status,
                timestamp: new Date()
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to update status',
                error: error.message 
            };
            console.log(`❌ Update status error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Handle typing indicators
    socket.on('typing_start', (data, callback) => {
        try {
            const { receiverId } = data;
            
            if (!receiverId) {
                const error = { 
                    success: false, 
                    message: 'receiverId is required' 
                };
                return callback ? callback(error) : null;
            }

            const roomName = [socket.userId, receiverId].sort().join('_');
            
            // Emit typing indicator to the conversation room (excluding sender)
            socket.to(roomName).emit('user_typing', {
                userId: socket.userId,
                username: socket.username,
                isTyping: true,
                timestamp: new Date()
            });

            console.log(`⌨️ ${socket.username} started typing to ${receiverId}`);

            const success = {
                success: true,
                message: 'Typing indicator sent',
                receiverId: receiverId
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to send typing indicator',
                error: error.message 
            };
            console.log(`❌ Typing start error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    socket.on('typing_stop', (data, callback) => {
        try {
            const { receiverId } = data;
            
            if (!receiverId) {
                const error = { 
                    success: false, 
                    message: 'receiverId is required' 
                };
                return callback ? callback(error) : null;
            }

            const roomName = [socket.userId, receiverId].sort().join('_');
            
            // Emit stop typing indicator to the conversation room (excluding sender)
            socket.to(roomName).emit('user_typing', {
                userId: socket.userId,
                username: socket.username,
                isTyping: false,
                timestamp: new Date()
            });

            console.log(`⌨️ ${socket.username} stopped typing to ${receiverId}`);

            const success = {
                success: true,
                message: 'Typing indicator stopped',
                receiverId: receiverId
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to stop typing indicator',
                error: error.message 
            };
            console.log(`❌ Typing stop error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Handle getting online users
    socket.on('get_online_users', (data, callback) => {
        try {
            const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
                userId: user.userId,
                username: user.username,
                status: user.status || 'online'
            }));

            console.log(`👥 ${socket.username} requested online users list`);

            const success = {
                success: true,
                message: 'Online users retrieved successfully',
                onlineUsers: onlineUsers,
                totalOnline: onlineUsers.length
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to get online users',
                error: error.message 
            };
            console.log(`❌ Get online users error:`, error);
            if (callback) callback(errorResponse);
        }
    });
});

// Make io available to routes
app.set('io', io);

// --- TEST ROUTE ---
// A simple route to check if the server is running
app.get('/test', (req, res) => {
  res.send('Hello, World! Socket.io is ready! 🚀');
});

// --- SERVER AND DATABASE STARTUP ---
// Define the port the server will run on. It will use the one from .env or default to 5000.
const PORT = process.env.PORT || 5000;

// Start the server with Socket.io
server.listen(PORT, async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Sync database models (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized.');

    console.log(`🚀 Server is running on port ${PORT}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
});