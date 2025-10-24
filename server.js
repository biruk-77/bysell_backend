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
const { securityHeaders, apiLimiter, authLimiter } = require('./midlewares/security.middleware');

// --- CORS MIDDLEWARE FOR EXPRESS ---
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.CORS_ORIGIN] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});

// --- SECURITY MIDDLEWARE ---
app.use(securityHeaders); // Apply security headers
app.use(logger);

// This middleware parses incoming requests with JSON payloads.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Global rate limiting
app.use('/api/', apiLimiter);

// --- ROUTES ---
// Import all route modules
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profileRoutes.js');
const postRoutes = require('./routes/post.routes.js');
const connectionRoutes = require('./routes/connection.routes.js');
const messageRoutes = require('./routes/message.routes.js');
const adminRoutes = require('./routes/admin.routes.js');
const notificationRoutes = require('./routes/notification.routes.js');
const searchRoutes = require('./routes/search.routes.js');

// Apply special rate limiting to auth routes
app.use('/api/auth', authLimiter, authRoutes);

// Register all API routes
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

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