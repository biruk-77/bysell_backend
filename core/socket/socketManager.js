const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const ChatSocket = require('../../modules/chat/chat.socket');

class SocketManager {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.chatSocket = new ChatSocket(this.io);
        this.setupMiddleware();
        this.setupConnectionHandler();
    }

    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
                
                if (!token) {
                    return next(new Error('Authentication token required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                
                console.log(`Socket authenticated for user: ${socket.userId}`);
                next();
            } catch (error) {
                console.error('Socket authentication failed:', error);
                next(new Error('Authentication failed'));
            }
        });
    }

    setupConnectionHandler() {
        this.io.on('connection', (socket) => {
            console.log(`Socket connected: ${socket.id} for user: ${socket.userId}`);

            this.chatSocket.handleConnection(socket);
            this.handleUserPresence(socket);
            this.handleNotifications(socket);

            socket.on('disconnect', (reason) => {
                console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
                this.handleUserDisconnect(socket);
            });

            socket.on('error', (error) => {
                console.error(`Socket error for ${socket.id}:`, error);
            });
        });
    }

    handleUserPresence(socket) {
        socket.join(`user_${socket.userId}`);

        socket.broadcast.emit('user_online', {
            userId: socket.userId,
            timestamp: new Date()
        });

        socket.on('update_status', (status) => {
            socket.broadcast.emit('user_status_update', {
                userId: socket.userId,
                status,
                timestamp: new Date()
            });
        });
    }

    handleNotifications(socket) {
        socket.join(`notifications_${socket.userId}`);

        socket.on('notification_received', (notificationId) => {
            console.log(`Notification ${notificationId} received by user ${socket.userId}`);
        });
    }

    handleUserDisconnect(socket) {
        socket.broadcast.emit('user_offline', {
            userId: socket.userId,
            timestamp: new Date()
        });

        socket.leave(`user_${socket.userId}`);
        socket.leave(`notifications_${socket.userId}`);
    }

    emitToUser(userId, event, data) {
        this.io.to(`user_${userId}`).emit(event, data);
    }

    emitToAll(event, data) {
        this.io.emit(event, data);
    }

    emitNotificationToUser(userId, notification) {
        this.io.to(`notifications_${userId}`).emit('new_notification', notification);
    }
}

module.exports = SocketManager;
