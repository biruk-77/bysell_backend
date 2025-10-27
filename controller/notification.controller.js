// test-project/controller/notification.controller.js
// Notification controller
const { Notification, User } = require('../models');
const { Op } = require('sequelize');

// --- GET USER NOTIFICATIONS ---
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            page = 1, 
            limit = 20, 
            type, 
            isRead, 
            priority,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        
        // Build where clause
        const whereClause = { 
            userId,
            [Op.or]: [
                { expiresAt: null },
                { expiresAt: { [Op.gt]: new Date() } }
            ]
        };
        
        if (type) whereClause.type = type;
        if (isRead !== undefined) whereClause.isRead = isRead === 'true';
        if (priority) whereClause.priority = priority;

        const { count, rows } = await Notification.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'fromUser',
                    attributes: ['id', 'username', 'role'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]]
        });

        // Count unread notifications
        const unreadCount = await Notification.count({
            where: { 
                userId, 
                isRead: false,
                [Op.or]: [
                    { expiresAt: null },
                    { expiresAt: { [Op.gt]: new Date() } }
                ]
            }
        });

        console.log(`🔔 User ${req.user.username} retrieved ${rows.length} notifications`);

        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: {
                notifications: rows,
                unreadCount,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalNotifications: count,
                    hasNext: page * limit < count,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while retrieving notifications.' 
        });
    }
};

// --- MARK NOTIFICATION AS READ ---
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            where: { id: notificationId, userId }
        });

        if (!notification) {
            return res.status(404).json({ 
                success: false,
                message: 'Notification not found.' 
            });
        }

        if (notification.isRead) {
            return res.status(400).json({ 
                success: false,
                message: 'Notification is already marked as read.' 
            });
        }

        await notification.update({
            isRead: true,
            readAt: new Date()
        });

        console.log(`✅ User ${req.user.username} marked notification ${notificationId} as read`);

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: { notificationId, readAt: notification.readAt }
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while marking notification as read.' 
        });
    }
};

// --- MARK ALL NOTIFICATIONS AS READ ---
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await Notification.update(
            { 
                isRead: true, 
                readAt: new Date() 
            },
            { 
                where: { userId, isRead: false },
                returning: true
            }
        );

        const updatedCount = result[0];

        console.log(`✅ User ${req.user.username} marked ${updatedCount} notifications as read`);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            data: { updatedCount }
        });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while marking all notifications as read.' 
        });
    }
};

// --- DELETE NOTIFICATION ---
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            where: { id: notificationId, userId }
        });

        if (!notification) {
            return res.status(404).json({ 
                success: false,
                message: 'Notification not found.' 
            });
        }

        await notification.destroy();

        console.log(`🗑️ User ${req.user.username} deleted notification ${notificationId}`);

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
            data: { deletedNotificationId: notificationId }
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while deleting notification.' 
        });
    }
};

// --- DELETE ALL READ NOTIFICATIONS ---
exports.deleteAllRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const deletedCount = await Notification.destroy({
            where: { userId, isRead: true }
        });

        console.log(`🗑️ User ${req.user.username} deleted ${deletedCount} read notifications`);

        res.status(200).json({
            success: true,
            message: 'All read notifications deleted successfully',
            data: { deletedCount }
        });
    } catch (error) {
        console.error('Delete all read notifications error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while deleting read notifications.' 
        });
    }
};

// --- GET NOTIFICATION STATISTICS ---
exports.getNotificationStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [
            totalNotifications,
            unreadNotifications,
            highPriorityNotifications,
            todayNotifications
        ] = await Promise.all([
            Notification.count({ where: { userId } }),
            Notification.count({ where: { userId, isRead: false } }),
            Notification.count({ where: { userId, priority: 'high', isRead: false } }),
            Notification.count({ 
                where: { 
                    userId, 
                    createdAt: { 
                        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) 
                    } 
                } 
            })
        ]);

        // Get notification type distribution
        const typeDistribution = await Notification.findAll({
            where: { userId },
            attributes: ['type', [require('sequelize').fn('COUNT', 'type'), 'count']],
            group: ['type']
        });

        console.log(`📊 User ${req.user.username} retrieved notification statistics`);

        res.status(200).json({
            success: true,
            message: 'Notification statistics retrieved successfully',
            data: {
                overview: {
                    totalNotifications,
                    unreadNotifications,
                    highPriorityNotifications,
                    todayNotifications
                },
                typeDistribution: typeDistribution.map(type => ({
                    type: type.type,
                    count: parseInt(type.dataValues.count)
                }))
            }
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while retrieving notification statistics.' 
        });
    }
};

// --- CREATE NOTIFICATION (INTERNAL FUNCTION) ---
exports.createNotification = async (notificationData) => {
    try {
        const notification = await Notification.create(notificationData);
        
        // Send real-time notification via Socket.io if available
        const io = global.io || require('../server').io;
        if (io) {
            io.to(`user_${notificationData.userId}`).emit('new_notification', {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    priority: notification.priority,
                    createdAt: notification.createdAt,
                    data: notification.data
                }
            });
        }

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

// --- SEND CUSTOM NOTIFICATION (ADMIN/SYSTEM) ---
exports.sendNotification = async (req, res) => {
    try {
        const { userId, type, title, message, priority = 'medium', data, actionUrl, expiresInDays } = req.body;

        if (!userId || !type || !title || !message) {
            return res.status(400).json({ 
                success: false,
                message: 'userId, type, title, and message are required.' 
            });
        }

        // Check if target user exists
        const targetUser = await User.findByPk(userId);
        if (!targetUser) {
            return res.status(404).json({ 
                success: false,
                message: 'Target user not found.' 
            });
        }

        // Calculate expiration date
        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
        }

        const notification = await exports.createNotification({
            userId,
            type,
            title,
            message,
            priority,
            data,
            actionUrl,
            expiresAt,
            fromUserId: req.user.id
        });

        console.log(`📨 ${req.user.username} sent notification to ${targetUser.username}: ${title}`);

        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
            data: { notification }
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while sending notification.' 
        });
    }
};

module.exports = {
    getNotifications: exports.getNotifications,
    markAsRead: exports.markAsRead,
    markAllAsRead: exports.markAllAsRead,
    deleteNotification: exports.deleteNotification,
    deleteAllRead: exports.deleteAllRead,
    getNotificationStats: exports.getNotificationStats,
    createNotification: exports.createNotification,
    sendNotification: exports.sendNotification
};
