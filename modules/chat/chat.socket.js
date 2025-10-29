const chatService = require('./chat.service');

class ChatSocket {
    constructor(io) {
        this.io = io;
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Event handlers removed - using direct socket communication instead
    }

    handleConnection(socket) {
        console.log(`User connected: ${socket.userId}`);

        // Join user room
        socket.join(`user_${socket.userId}`);

        // Handle joining conversation rooms
        socket.on('join_conversation', (conversationId) => {
            socket.join(`conversation_${conversationId}`);
        });

        // Handle leaving conversation rooms
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                const { receiverId, content, messageType } = data;
                const message = await chatService.sendMessage(
                    socket.userId,
                    receiverId,
                    content,
                    messageType
                );
                
                // Message will be emitted via event handler
            } catch (error) {
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle marking messages as read
        socket.on('mark_message_read', async (messageId) => {
            try {
                await chatService.markMessageAsRead(messageId, socket.userId);
            } catch (error) {
                socket.emit('error', { message: 'Failed to mark message as read' });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', (data) => {
            socket.to(`user_${data.receiverId}`).emit('user_typing', {
                userId: socket.userId,
                conversationId: data.conversationId
            });
        });

        socket.on('typing_stop', (data) => {
            socket.to(`user_${data.receiverId}`).emit('user_stopped_typing', {
                userId: socket.userId,
                conversationId: data.conversationId
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    }
}

module.exports = ChatSocket;
