// Backend messaging socket handlers
const { Message, User } = require('../models');
const { Op } = require('sequelize');

module.exports = (socket, io, connectedUsers) => {
    
    // Handle joining conversation rooms
    socket.on('join_conversation', (data, callback) => {
        try {
            const { otherUserId } = data;
            
            if (!otherUserId) {
                const error = { success: false, message: 'otherUserId is required' };
                console.log(`❌ Join conversation failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Prevent self-conversation
            if (socket.userId === otherUserId) {
                const error = { success: false, message: 'You cannot start a conversation with yourself' };
                console.log(`❌ Join conversation failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            const roomName = [socket.userId, otherUserId].sort().join('_');
            socket.join(roomName);
            console.log(`👥 ${socket.username} joined conversation room: ${roomName}`);
            
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
    socket.on('send_message', async (data, callback) => {
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

            // Prevent self-messaging
            if (socket.userId === receiverId) {
                const error = { 
                    success: false, 
                    message: 'You cannot send messages to yourself' 
                };
                console.log(`❌ Send message failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // ✅ SAVE MESSAGE TO DATABASE
            const savedMessage = await Message.create({
                senderId: socket.userId,
                receiverId,
                content,
                messageType,
                isRead: false
            });

            console.log(`💾 Message saved to database with ID: ${savedMessage.id}`);

            const roomName = [socket.userId, receiverId].sort().join('_');
            
            // Create message object
            const messageData = {
                senderId: socket.userId,
                senderUsername: socket.username,
                receiverId,
                content,
                messageType,
                timestamp: savedMessage.createdAt,
                messageId: savedMessage.id, // Use real DB ID
                isRead: false
            };
            
            console.log(`\n💬 Message sent from ${socket.username} to ${receiverId}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📤 EMITTING EVENT: "new_message"`);
            console.log(`   Sender: ${socket.username} (${socket.userId})`);
            console.log(`   Target User: ${receiverId}`);
            console.log(`   Room: "${roomName}"`);
            console.log(`   DB Message ID: ${savedMessage.id}`);
            
            // Check room membership
            const roomSockets = await io.in(roomName).fetchSockets();
            console.log(`   👥 Sockets in room "${roomName}": ${roomSockets.length}`);
            roomSockets.forEach((s, index) => {
                console.log(`      ${index + 1}. Socket ID: ${s.id}, User: ${s.username || 'Unknown'} (${s.userId || 'N/A'})`);
            });
            
            // Check if receiver is online
            const receiverSocketsInRoom = roomSockets.filter(s => s.userId === receiverId);
            console.log(`   🔌 Receiver online in room: ${receiverSocketsInRoom.length > 0 ? '✅ YES' : '❌ NO'}`);
            if (receiverSocketsInRoom.length > 0) {
                console.log(`   📍 Receiver socket IDs: ${receiverSocketsInRoom.map(s => s.id).join(', ')}`);
            }
            
            console.log(`   📦 SENDING DATA:`);
            console.log(JSON.stringify(messageData, null, 6));
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
            
            // Emit to the conversation room
            io.to(roomName).emit('new_message', messageData);
            
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

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (data, callback) => {
        try {
            const { otherUserId } = data;
            
            if (!otherUserId) {
                const error = { success: false, message: 'otherUserId is required' };
                console.log(`❌ Leave conversation failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            const roomName = [socket.userId, otherUserId].sort().join('_');
            socket.leave(roomName);
            console.log(`👋 ${socket.username} left conversation room: ${roomName}`);
            
            const success = {
                success: true,
                message: 'Successfully left conversation',
                roomName: roomName
            };
            
            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to leave conversation',
                error: error.message 
            };
            console.log(`❌ Leave conversation error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Handle typing indicators
    socket.on('start_typing', async (data, callback) => {
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
            
            // Data we're about to send
            const emitData = {
                userId: socket.userId,
                username: socket.username,
                isTyping: true,
                timestamp: new Date()
            };
            
            console.log(`\n⌨️ ${socket.username} started typing to ${receiverId}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📤 EMITTING EVENT: "user_typing"`);
            console.log(`   Sender: ${socket.username} (${socket.userId})`);
            console.log(`   Target User: ${receiverId}`);
            console.log(`   Room: "${roomName}"`);
            
            // Check room membership
            const roomSockets = await socket.server.in(roomName).fetchSockets();
            console.log(`   👥 Sockets in room "${roomName}": ${roomSockets.length}`);
            roomSockets.forEach((s, index) => {
                console.log(`      ${index + 1}. Socket ID: ${s.id}, User: ${s.username || 'Unknown'} (${s.userId || 'N/A'})`);
            });
            
            // Check if receiver is online
            const receiverSocketsInRoom = roomSockets.filter(s => s.userId === receiverId);
            console.log(`   🔌 Receiver online in room: ${receiverSocketsInRoom.length > 0 ? '✅ YES' : '❌ NO'}`);
            if (receiverSocketsInRoom.length > 0) {
                console.log(`   📍 Receiver socket IDs: ${receiverSocketsInRoom.map(s => s.id).join(', ')}`);
            }
            
            console.log(`   📦 SENDING DATA:`);
            console.log(JSON.stringify(emitData, null, 6));
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
            
            // Emit typing indicator to the conversation room (excluding sender)
            socket.to(roomName).emit('user_typing', emitData);

            const success = {
                success: true,
                message: 'Typing indicator sent',
                receiverId: receiverId,
                delivered: receiverSocketsInRoom.length > 0
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

    socket.on('stop_typing', async (data, callback) => {
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
            
            // Data we're about to send
            const emitData = {
                userId: socket.userId,
                username: socket.username,
                isTyping: false,
                timestamp: new Date()
            };
            
            console.log(`\n⌨️ ${socket.username} stopped typing to ${receiverId}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📤 EMITTING EVENT: "user_typing"`);
            console.log(`   Sender: ${socket.username} (${socket.userId})`);
            console.log(`   Target User: ${receiverId}`);
            console.log(`   Room: "${roomName}"`);
            
            // Check room membership
            const roomSockets = await socket.server.in(roomName).fetchSockets();
            console.log(`   👥 Sockets in room "${roomName}": ${roomSockets.length}`);
            roomSockets.forEach((s, index) => {
                console.log(`      ${index + 1}. Socket ID: ${s.id}, User: ${s.username || 'Unknown'} (${s.userId || 'N/A'})`);
            });
            
            // Check if receiver is online
            const receiverSocketsInRoom = roomSockets.filter(s => s.userId === receiverId);
            console.log(`   🔌 Receiver online in room: ${receiverSocketsInRoom.length > 0 ? '✅ YES' : '❌ NO'}`);
            if (receiverSocketsInRoom.length > 0) {
                console.log(`   📍 Receiver socket IDs: ${receiverSocketsInRoom.map(s => s.id).join(', ')}`);
            }
            
            console.log(`   📦 SENDING DATA:`);
            console.log(JSON.stringify(emitData, null, 6));
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
            
            // Emit stop typing indicator to the conversation room (excluding sender)
            socket.to(roomName).emit('user_typing', emitData);

            const success = {
                success: true,
                message: 'Typing indicator stopped',
                receiverId: receiverId,
                delivered: receiverSocketsInRoom.length > 0
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

    // Handle marking messages as read
    socket.on('mark_messages_read', async (data, callback) => {
        try {
            const { otherUserId } = data;
            
            if (!otherUserId) {
                const error = { success: false, message: 'otherUserId is required' };
                return callback ? callback(error) : null;
            }

            // ✅ UPDATE DATABASE - Mark messages as read
            const [updatedCount] = await Message.update(
                { 
                    isRead: true,
                    readAt: new Date()
                },
                {
                    where: {
                        senderId: otherUserId,
                        receiverId: socket.userId,
                        isRead: false
                    }
                }
            );

            console.log(`💾 Marked ${updatedCount} messages as read in database`);

            // Data we're about to send
            const emitData = {
                readBy: socket.userId,
                readByUsername: socket.username,
                timestamp: new Date()
            };
            
            console.log(`\n📖 ${socket.username} marked messages from ${otherUserId} as read`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📤 EMITTING EVENT: "messages_read"`);
            console.log(`   Read By: ${socket.username} (${socket.userId})`);
            console.log(`   Target User (Sender): ${otherUserId}`);
            console.log(`   Personal Room: "user_${otherUserId}"`);
            console.log(`   Messages Updated: ${updatedCount}`);
            
            // Check if other user is online
            const otherUserSockets = await io.in(`user_${otherUserId}`).fetchSockets();
            console.log(`   👥 Sockets in room "user_${otherUserId}": ${otherUserSockets.length}`);
            otherUserSockets.forEach((s, index) => {
                console.log(`      ${index + 1}. Socket ID: ${s.id}, User: ${s.username || 'Unknown'} (${s.userId || 'N/A'})`);
            });
            
            console.log(`   🔌 Target user online: ${otherUserSockets.length > 0 ? '✅ YES' : '❌ NO'}`);
            if (otherUserSockets.length > 0) {
                console.log(`   📍 Target socket IDs: ${otherUserSockets.map(s => s.id).join(', ')}`);
            }
            
            console.log(`   📦 SENDING DATA:`);
            console.log(JSON.stringify(emitData, null, 6));
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
            
            // Notify the other user that their messages have been read
            io.to(`user_${otherUserId}`).emit('messages_read', emitData);

            const success = {
                success: true,
                message: 'Messages marked as read',
                otherUserId: otherUserId,
                updatedCount
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to mark messages as read',
                error: error.message 
            };
            console.log(`❌ Mark messages read error:`, error);
            if (callback) callback(errorResponse);
        }
    });
};
