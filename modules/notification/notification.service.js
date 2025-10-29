const { Notification } = require('../../models');

class NotificationService {
    // Create notification
    async createNotification(userId, type, title, message, data = {}) {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            data
        });

        const populatedNotification = await Notification.findById(notification._id)
            .populate('userId', 'username email');

        // Notification created
        return populatedNotification;
    }

    // Get user notifications
    async getUserNotifications(userId, limit = 20, skip = 0) {
        return await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
    }

    // Mark notification as read
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (notification) {
            // Notification marked as read
        }
        return notification;
    }

    // Mark all notifications as read
    async markAllAsRead(userId) {
        const result = await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        // All notifications marked as read
        return result;
    }

    // Delete notification
    async deleteNotification(notificationId, userId) {
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });

        if (notification) {
            // Notification deleted
        }
        return notification;
    }

    // Get unread count
    async getUnreadCount(userId) {
        return await Notification.countDocuments({
            userId,
            isRead: false
        });
    }

    // Create system notification for all users
    async createSystemNotification(title, message, data = {}) {
        // This would typically be handled differently in production
        // For now, we'll just emit an event
        // System notification created
    }

    // Helper methods for specific notification types
    async createConnectionRequestNotification(userId, requesterName) {
        return await this.createNotification(
            userId,
            'connection_request',
            'New Connection Request',
            `${requesterName} wants to connect with you`,
            { requesterName }
        );
    }

    async createMessageNotification(userId, senderName, messagePreview) {
        return await this.createNotification(
            userId,
            'message',
            'New Message',
            `${senderName}: ${messagePreview}`,
            { senderName, messagePreview }
        );
    }

    async createPostLikeNotification(userId, likerName, postTitle) {
        return await this.createNotification(
            userId,
            'post_like',
            'Post Liked',
            `${likerName} liked your post: ${postTitle}`,
            { likerName, postTitle }
        );
    }
}

module.exports = new NotificationService();
