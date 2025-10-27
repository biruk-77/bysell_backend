// Backend presence socket handlers
const { UserStatus } = require('../models');

module.exports = (socket, io, connectedUsers) => {
    
    // Handle user status updates
    socket.on('update_status', async (data, callback) => {
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

            // Update in database
            await UserStatus.upsert({
                userId: socket.userId,
                status: status,
                lastSeen: new Date()
            });

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

    // Handle getting user status
    socket.on('get_user_status', async (data, callback) => {
        try {
            const { userId } = data;
            
            if (!userId) {
                const error = { 
                    success: false, 
                    message: 'userId is required' 
                };
                return callback ? callback(error) : null;
            }

            // Check if user is online
            const connectedUser = connectedUsers.get(userId);
            if (connectedUser) {
                const success = {
                    success: true,
                    message: 'User status retrieved',
                    userId: userId,
                    username: connectedUser.username,
                    status: connectedUser.status || 'online',
                    isOnline: true,
                    lastSeen: new Date()
                };
                
                if (callback) callback(success);
                return;
            }

            // Check database for last seen
            const userStatus = await UserStatus.findOne({
                where: { userId: userId }
            });

            const success = {
                success: true,
                message: 'User status retrieved',
                userId: userId,
                status: userStatus?.status || 'offline',
                isOnline: false,
                lastSeen: userStatus?.lastSeen || null
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to get user status',
                error: error.message 
            };
            console.log(`❌ Get user status error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Handle presence ping (keep alive)
    socket.on('presence_ping', async (data, callback) => {
        try {
            // Update last seen in database
            await UserStatus.upsert({
                userId: socket.userId,
                lastSeen: new Date()
            });

            // Update connected users map
            const userInfo = connectedUsers.get(socket.userId);
            if (userInfo) {
                userInfo.lastPing = new Date();
                connectedUsers.set(socket.userId, userInfo);
            }

            const success = {
                success: true,
                message: 'Presence updated',
                timestamp: new Date()
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to update presence',
                error: error.message 
            };
            console.log(`❌ Presence ping error:`, error);
            if (callback) callback(errorResponse);
        }
    });
};
