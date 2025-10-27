// test-project/controller/message.controller.js
// controller/message.controller.js

const { Message, User, Connection } = require('../models');
const { Op } = require('sequelize');

// --- SEND MESSAGE ---
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, content, messageType = 'text' } = req.body;

        // Validate input
        if (!receiverId || !content) {
            return res.status(400).json({ message: 'Receiver ID and content are required.' });
        }

        // Prevent self-messaging
        if (senderId === receiverId) {
            return res.status(400).json({ message: 'You cannot send messages to yourself.' });
        }

        // Check if receiver exists
        const receiver = await User.findByPk(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found.' });
        }

        // Check if users are connected (optional - you can remove this if you want open messaging)
        const connection = await Connection.findOne({
            where: {
                [Op.or]: [
                    { requesterId: senderId, receiverId, status: 'accepted' },
                    { requesterId: receiverId, receiverId: senderId, status: 'accepted' }
                ]
            }
        });

        if (!connection) {
            return res.status(403).json({ 
                message: 'You can only send messages to connected users.' 
            });
        }

        // Create message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            content,
            messageType
        });

        // Get message with sender details
        const messageWithDetails = await Message.findByPk(newMessage.id, {
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
            ]
        });

        // Send real-time message via Socket.io
        const io = req.app.get('io');
        if (io) {
            const roomName = [senderId, receiverId].sort().join('_');
            io.to(roomName).emit('new_message', {
                message: messageWithDetails,
                timestamp: new Date()
            });

            // Also send notification to receiver's personal room
            io.to(`user_${receiverId}`).emit('message_notification', {
                type: 'new_message',
                message: messageWithDetails,
                notification: `New message from ${req.user.username}`
            });
        }

        res.status(201).json({
            message: 'Message sent successfully',
            data: messageWithDetails
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Something went wrong while sending the message.' });
    }
};

// --- GET CONVERSATION HISTORY ---
exports.getConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;
        
        // Prevent self-conversation
        if (userId === otherUserId) {
            return res.status(400).json({ 
                message: 'You cannot view conversations with yourself.' 
            });
        }
        const { page = 1, limit = 50, before } = req.query;
        const offset = (page - 1) * limit;

        // Check if other user exists
        const otherUser = await User.findByPk(otherUserId);
        if (!otherUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Build where clause
        const whereClause = {
            [Op.or]: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        };

        // Add cursor-based pagination if 'before' is provided
        if (before) {
            const beforeMessage = await Message.findByPk(before);
            if (beforeMessage) {
                whereClause.createdAt = { [Op.lt]: beforeMessage.createdAt };
            }
        }

        // Get messages between the two users
        const { count, rows } = await Message.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'username']
                }
            ],
            limit: parseInt(limit),
            offset: before ? 0 : parseInt(offset), // Don't use offset with cursor
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Conversation retrieved successfully',
            totalMessages: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            messages: rows.reverse() // Reverse to show oldest first
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving the conversation.' });
    }
};

// --- GET ALL CONVERSATIONS ---
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('📚 Getting conversations for user:', userId);
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get latest message for each conversation
        const conversations = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: userId },
                    { receiverId: userId }
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
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Group by conversation partner
        const conversationMap = new Map();
        
        conversations.forEach(message => {
            const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
            const partner = message.senderId === userId ? message.receiver : message.sender;
            
            // Skip self-conversations
            if (partnerId === userId) {
                return;
            }
            
            if (!conversationMap.has(partnerId)) {
                // Count unread messages from this partner
                const unreadCount = conversations.filter(msg => 
                    msg.senderId === partnerId && 
                    msg.receiverId === userId && 
                    !msg.isRead
                ).length;
                
                conversationMap.set(partnerId, {
                    id: `conversation_${[userId, partnerId].sort().join('_')}`, // Unique conversation ID
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

        const conversationList = Array.from(conversationMap.values());

        console.log('📚 Found', conversations.length, 'messages');
        console.log('📚 Grouped into', conversationList.length, 'conversations');
        console.log('📚 Conversation list:', JSON.stringify(conversationList, null, 2));

        res.status(200).json({
            message: 'Conversations retrieved successfully',
            conversations: conversationList,
            totalConversations: conversationList.length
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving conversations.' });
    }
};

// --- MARK MESSAGES AS READ ---
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.params;

        // Mark all messages from otherUserId to userId as read
        await Message.update(
            { 
                isRead: true,
                readAt: new Date()
            },
            {
                where: {
                    senderId: otherUserId,
                    receiverId: userId,
                    isRead: false
                }
            }
        );

        // Send real-time notification about read status
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${otherUserId}`).emit('messages_read', {
                readBy: userId,
                readByUsername: req.user.username,
                timestamp: new Date()
            });
        }

        res.status(200).json({
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Something went wrong while marking messages as read.' });
    }
};

// --- DELETE MESSAGE ---
exports.deleteMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageId } = req.params;

        // Find message
        const message = await Message.findByPk(messageId);
        if (!message) {
            return res.status(404).json({ message: 'Message not found.' });
        }

        // Check if user is the sender
        if (message.senderId !== userId) {
            return res.status(403).json({ message: 'You can only delete your own messages.' });
        }

        // Delete message
        await message.destroy();

        // Send real-time notification about deleted message
        const io = req.app.get('io');
        if (io) {
            const roomName = [message.senderId, message.receiverId].sort().join('_');
            io.to(roomName).emit('message_deleted', {
                messageId,
                deletedBy: userId,
                timestamp: new Date()
            });
        }

        res.status(200).json({
            message: 'Message deleted successfully'
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Something went wrong while deleting the message.' });
    }
};
