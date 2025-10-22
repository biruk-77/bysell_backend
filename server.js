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
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.username = decoded.username;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
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
    socket.on('join_conversation', (data) => {
        const { otherUserId } = data;
        const roomName = [socket.userId, otherUserId].sort().join('_');
        socket.join(roomName);
        console.log(`👥 ${socket.username} joined conversation room: ${roomName}`);
    });

    // Handle private messages
    socket.on('send_message', (data) => {
        const { receiverId, content, messageType = 'text' } = data;
        const roomName = [socket.userId, receiverId].sort().join('_');
        
        // Emit to the conversation room
        io.to(roomName).emit('new_message', {
            senderId: socket.userId,
            senderUsername: socket.username,
            receiverId,
            content,
            messageType,
            timestamp: new Date()
        });
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