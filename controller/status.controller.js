// test-project/controller/status.controller.js
// controller/status.controller.js

const { UserStatus, User } = require('../models');
const { Op } = require('sequelize');

// --- UPDATE USER STATUS ---
exports.updateUserStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.body; // 'online', 'away', 'busy', 'offline'

        // Validate input
        if (!status || !['online', 'away', 'busy', 'offline'].includes(status)) {
            return res.status(400).json({ 
                message: 'Valid status is required (online, away, busy, offline)' 
            });
        }

        // Update or create user status
        const [userStatus, created] = await UserStatus.upsert({
            userId,
            status,
            lastSeen: new Date()
        }, {
            returning: true
        });

        // Send real-time notification to all connected users
        const io = req.app.get('io');
        if (io) {
            io.emit('user_status_changed', {
                userId,
                username: req.user.username,
                status,
                timestamp: new Date()
            });
        }

        res.status(200).json({
            message: 'Status updated successfully',
            status: userStatus.status,
            lastSeen: userStatus.lastSeen
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Something went wrong while updating status.' });
    }
};

// --- GET USER STATUS ---
exports.getUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Get user status
        const userStatus = await UserStatus.findOne({
            where: { userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ]
        });

        if (!userStatus) {
            return res.status(200).json({
                message: 'User status retrieved successfully',
                status: {
                    userId,
                    status: 'offline',
                    lastSeen: user.createdAt,
                    user: {
                        id: user.id,
                        username: user.username
                    }
                }
            });
        }

        res.status(200).json({
            message: 'User status retrieved successfully',
            status: userStatus
        });
    } catch (error) {
        console.error('Get user status error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving user status.' });
    }
};

// --- GET ONLINE USERS ---
exports.getOnlineUsers = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        // Get all users with online status
        const { count, rows } = await UserStatus.findAndCountAll({
            where: {
                status: {
                    [Op.in]: ['online', 'away', 'busy']
                },
                lastSeen: {
                    [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
                }
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['lastSeen', 'DESC']]
        });

        res.status(200).json({
            message: 'Online users retrieved successfully',
            totalOnline: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            onlineUsers: rows
        });
    } catch (error) {
        console.error('Get online users error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving online users.' });
    }
};

// --- UPDATE TYPING STATUS ---
exports.updateTypingStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { isTyping, otherUserId } = req.body;

        // Validate input
        if (typeof isTyping !== 'boolean') {
            return res.status(400).json({ message: 'isTyping must be a boolean value.' });
        }

        if (isTyping && !otherUserId) {
            return res.status(400).json({ message: 'otherUserId is required when starting to type.' });
        }

        // Update typing status
        await UserStatus.upsert({
            userId,
            isTypingTo: isTyping ? otherUserId : null,
            typingStartedAt: isTyping ? new Date() : null,
            lastSeen: new Date()
        });

        // Send real-time typing indicator
        const io = req.app.get('io');
        if (io && otherUserId) {
            const roomName = [userId, otherUserId].sort().join('_');
            io.to(roomName).emit('user_typing', {
                userId,
                username: req.user.username,
                isTyping,
                timestamp: new Date()
            });
        }

        res.status(200).json({
            message: 'Typing status updated successfully',
            isTyping,
            otherUserId: isTyping ? otherUserId : null
        });
    } catch (error) {
        console.error('Update typing status error:', error);
        res.status(500).json({ message: 'Something went wrong while updating typing status.' });
    }
};

// --- CLEANUP STALE STATUSES (Internal use) ---
exports.cleanupStaleStatuses = async () => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        // Mark users as offline if they haven't been seen in the last 5 minutes
        await UserStatus.update(
            { 
                status: 'offline',
                isTypingTo: null,
                typingStartedAt: null,
                socketId: null
            },
            {
                where: {
                    lastSeen: {
                        [Op.lt]: fiveMinutesAgo
                    },
                    status: {
                        [Op.ne]: 'offline'
                    }
                }
            }
        );

        console.log('✅ Cleaned up stale user statuses');
    } catch (error) {
        console.error('❌ Cleanup stale statuses error:', error);
    }
};
