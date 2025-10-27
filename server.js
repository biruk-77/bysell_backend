// test-project/server.js
// --- IMPORTS ---
// Import the necessary packages
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sequelize = require('./config/database'); // Using the sequelize instance from our config
const models = require('./models'); // Import models to establish relationships
const logger = require('./utils/logger');
const { securityHeaders, apiLimiter } = require('./midlewares/security.middleware');

// Create the main Express application
const app = express();

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        methods: ["GET", "POST"],
        credentials: true
    }
});


// --- CORS MIDDLEWARE FOR EXPRESS ---
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.CORS_ORIGIN] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

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
app.use('/api/v1', apiLimiter);
app.use('/api/v1',require('./routes'));

// --- SOCKET.IO SETUP ---
// Store connected users
const connectedUsers = new Map();
const { UserStatus } = require('./models');

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
            token = token.slice(7);
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
io.on('connection', async (socket) => {
    console.log(`🔗 User ${socket.username} connected (${socket.userId})`);
    
    // ========== LOG ALL INCOMING EVENTS ==========
    socket.onAny((eventName, ...args) => {
        console.log('\n📨 INCOMING EVENT:', eventName);
        console.log('   From User:', socket.username, `(${socket.userId})`);
        console.log('   Data:', JSON.stringify(args, null, 2));
    });
    
    // ========== LOG ALL OUTGOING EVENTS ==========
    const originalEmit = socket.emit.bind(socket);
    socket.emit = function(eventName, ...args) {
        console.log('\n📤 OUTGOING EVENT:', eventName);
        console.log('   To User:', socket.username, `(${socket.userId})`);
        console.log('   Data:', JSON.stringify(args.filter(arg => typeof arg !== 'function'), null, 2));
        return originalEmit(eventName, ...args);
    };
    
    // ========== LOG ALL BROADCAST EVENTS ==========
    const originalBroadcastEmit = socket.broadcast.emit.bind(socket.broadcast);
    socket.broadcast.emit = function(eventName, ...args) {
        console.log('\n📡 BROADCAST EVENT:', eventName);
        console.log('   From User:', socket.username, `(${socket.userId})`);
        console.log('   To: ALL OTHER USERS');
        console.log('   Data:', JSON.stringify(args, null, 2));
        return originalBroadcastEmit(eventName, ...args);
    };
    
    try {
        // Store user connection
        connectedUsers.set(socket.userId, {
            socketId: socket.id,
            username: socket.username,
            userId: socket.userId
        });

        // Update user status in database
        await UserStatus.upsert({
            userId: socket.userId,
            status: 'online',
            lastSeen: new Date(),
            socketId: socket.id
        });

        // Join user to their personal room
        socket.join(`user_${socket.userId}`);

        // ✅ SEND CONVERSATION SNAPSHOT
        const { Message, User } = require('./models');
        const { Op } = require('sequelize');
        
        // Get all messages for this user
        const userMessages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: socket.userId },
                    { receiverId: socket.userId }
                ]
            },
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'username']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        // Group into conversations
        const conversationMap = new Map();
        userMessages.forEach(message => {
            const partnerId = message.senderId === socket.userId ? message.receiverId : message.senderId;
            const partner = message.senderId === socket.userId ? message.receiver : message.sender;
            
            if (partnerId === socket.userId) return;
            
            if (!conversationMap.has(partnerId)) {
                const unreadCount = userMessages.filter(msg => 
                    msg.senderId === partnerId && 
                    msg.receiverId === socket.userId && 
                    !msg.isRead
                ).length;
                
                conversationMap.set(partnerId, {
                    id: `conversation_${[socket.userId, partnerId].sort().join('_')}`,
                    otherUser: {
                        id: partnerId,
                        username: partner.username
                    },
                    latestMessage: {
                        id: message.id,
                        content: message.content,
                        senderId: message.senderId,
                        receiverId: message.receiverId,
                        senderUsername: message.sender.username,
                        messageType: message.messageType,
                        isRead: message.isRead,
                        createdAt: message.createdAt
                    },
                    unreadCount,
                    updatedAt: message.createdAt
                });
            }
        });

        const conversations = Array.from(conversationMap.values());
        
        console.log(`📚 Sending ${conversations.length} conversations to ${socket.username}`);
        
        // Send conversations snapshot to the connected user
        socket.emit('conversations_snapshot', {
            conversations,
            totalConversations: conversations.length
        });

        // Notify user is online
        socket.broadcast.emit('user_online', {
            userId: socket.userId,
            username: socket.username
        });
    } catch (error) {
        console.error('❌ Socket connection error:', error);
    }

    // Import organized socket handlers
    require('./sockets/messaging.handlers')(socket, io, connectedUsers);
    require('./sockets/connections.handlers')(socket, io, connectedUsers);
    require('./sockets/presence.handlers')(socket, io, connectedUsers);
    require('./sockets/notifications.handlers')(socket, io, connectedUsers);

    // Handle disconnection
    socket.on('disconnect', async () => {
        console.log(`❌ User ${socket.username} disconnected`);
        connectedUsers.delete(socket.userId);
        
        try {
            await UserStatus.upsert({
                userId: socket.userId,
                status: 'offline',
                lastSeen: new Date(),
                socketId: null,
                isTypingTo: null,
                typingStartedAt: null
            });

            socket.broadcast.emit('user_offline', {
                userId: socket.userId,
                username: socket.username
            });
        } catch (error) {
            console.error('❌ Socket disconnect error:', error);
        }
    });
});

// Make io available to routes
app.set('io', io);


// --- TEST ROUTE ---
// A simple route to check if the server is running
app.get('/test', (req, res) => {
  res.send('Hello, World! REST API is ready! 🚀');
});

// --- SERVER AND DATABASE STARTUP ---
// Define the port the server will run on. It will use the one from .env or default to 5000.
const PORT = process.env.PORT || 5000;

// Import status cleanup service
const statusCleanupService = require('./service/statusCleanup.service');

// Start the server with Socket.io
server.listen(PORT, async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    // Sync database models (create tables if they don't exist)
    await sequelize.sync({ alter: false });

    console.log('✅ Database tables synchronized.');

    // Start status cleanup service
    statusCleanupService.start();

    console.log(`🚀 Socket.IO Server is running on port ${PORT}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  statusCleanupService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  statusCleanupService.stop();
  process.exit(0);
});
