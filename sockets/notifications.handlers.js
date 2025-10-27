// Backend notifications socket handlers
module.exports = (socket, io, connectedUsers) => {
    
    // Send notification to specific user
    socket.on('send_notification', (data, callback) => {
        try {
            const { receiverId, type, title, message, data: notificationData } = data;
            
            if (!receiverId || !message) {
                const error = { 
                    success: false, 
                    message: 'receiverId and message are required' 
                };
                console.log(`❌ Send notification failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            const notification = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: type || 'info',
                title: title || 'Notification',
                message: message,
                data: notificationData || {},
                senderId: socket.userId,
                senderUsername: socket.username,
                timestamp: new Date()
            };

            // Send to specific user
            io.to(`user_${receiverId}`).emit('notification', notification);

            console.log(`🔔 Notification sent from ${socket.username} to ${receiverId}: ${message}`);

            const success = {
                success: true,
                message: 'Notification sent successfully',
                notification: notification
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to send notification',
                error: error.message 
            };
            console.log(`❌ Send notification error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Broadcast notification to all users
    socket.on('broadcast_notification', (data, callback) => {
        try {
            const { type, title, message, data: notificationData, excludeSelf } = data;
            
            if (!message) {
                const error = { 
                    success: false, 
                    message: 'message is required' 
                };
                console.log(`❌ Broadcast notification failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            const notification = {
                id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: type || 'info',
                title: title || 'System Notification',
                message: message,
                data: notificationData || {},
                senderId: socket.userId,
                senderUsername: socket.username,
                timestamp: new Date(),
                isBroadcast: true
            };

            // Broadcast to all connected users
            if (excludeSelf) {
                socket.broadcast.emit('notification', notification);
            } else {
                io.emit('notification', notification);
            }

            console.log(`📢 Broadcast notification from ${socket.username}: ${message}`);

            const success = {
                success: true,
                message: 'Notification broadcasted successfully',
                notification: notification,
                recipientCount: connectedUsers.size
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to broadcast notification',
                error: error.message 
            };
            console.log(`❌ Broadcast notification error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Mark notification as read
    socket.on('mark_notification_read', (data, callback) => {
        try {
            const { notificationId, senderId } = data;
            
            if (!notificationId) {
                const error = { 
                    success: false, 
                    message: 'notificationId is required' 
                };
                return callback ? callback(error) : null;
            }

            // Notify the sender that their notification was read (if applicable)
            if (senderId) {
                io.to(`user_${senderId}`).emit('notification_read', {
                    notificationId: notificationId,
                    readBy: socket.userId,
                    readByUsername: socket.username,
                    timestamp: new Date()
                });
            }

            console.log(`📖 ${socket.username} marked notification ${notificationId} as read`);

            const success = {
                success: true,
                message: 'Notification marked as read',
                notificationId: notificationId
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to mark notification as read',
                error: error.message 
            };
            console.log(`❌ Mark notification read error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Clear notification
    socket.on('clear_notification', (data, callback) => {
        try {
            const { notificationId } = data;
            
            if (!notificationId) {
                const error = { 
                    success: false, 
                    message: 'notificationId is required' 
                };
                return callback ? callback(error) : null;
            }

            // Emit notification cleared event
            socket.emit('notification_cleared', {
                notificationId: notificationId,
                clearedBy: socket.userId,
                timestamp: new Date()
            });

            console.log(`🗑️ ${socket.username} cleared notification ${notificationId}`);

            const success = {
                success: true,
                message: 'Notification cleared',
                notificationId: notificationId
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to clear notification',
                error: error.message 
            };
            console.log(`❌ Clear notification error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Clear all notifications for user
    socket.on('clear_all_notifications', (data, callback) => {
        try {
            // Emit all notifications cleared event
            socket.emit('all_notifications_cleared', {
                clearedBy: socket.userId,
                timestamp: new Date()
            });

            console.log(`🗑️ ${socket.username} cleared all notifications`);

            const success = {
                success: true,
                message: 'All notifications cleared'
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to clear all notifications',
                error: error.message 
            };
            console.log(`❌ Clear all notifications error:`, error);
            if (callback) callback(errorResponse);
        }
    });
};
