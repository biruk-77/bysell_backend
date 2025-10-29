const { User, Post, Notification } = require('../../models');

class AdminService {
    // Get system statistics
    async getSystemStats() {
        const [userCount, postCount, notificationCount] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Notification.countDocuments()
        ]);

        return {
            users: userCount,
            posts: postCount,
            notifications: notificationCount,
            timestamp: new Date()
        };
    }

    // Get all users with pagination
    async getAllUsers(limit = 20, skip = 0, search = '') {
        const query = search ? {
            $or: [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        return await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
    }

    // Get user by ID
    async getUserById(userId) {
        return await User.findById(userId).select('-password');
    }

    // Update user status
    async updateUserStatus(userId, status) {
        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        ).select('-password');

        if (user) {
            // User status updated by admin
        }
        return user;
    }

    // Delete user
    async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (user) {
            // Clean up user's posts and notifications
            await Promise.all([
                Post.deleteMany({ userId }),
                Notification.deleteMany({ userId })
            ]);
            
            // User deleted by admin
        }
        return user;
    }

    // Get all posts with pagination
    async getAllPosts(limit = 20, skip = 0, search = '') {
        const query = search ? {
            $or: [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ]
        } : {};

        return await Post.find(query)
            .populate('userId', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
    }

    // Update post status
    async updatePostStatus(postId, status) {
        const post = await Post.findByIdAndUpdate(
            postId,
            { status },
            { new: true }
        ).populate('userId', 'username email');

        if (post) {
            // Post status updated by admin
        }
        return post;
    }

    // Delete post
    async deletePost(postId) {
        const post = await Post.findByIdAndDelete(postId);
        if (post) {
            // Post deleted by admin
        }
        return post;
    }

    // Send system notification to all users
    async sendSystemNotification(title, message, data = {}) {
        const users = await User.find({ status: 'active' }).select('_id');
        const notifications = users.map(user => ({
            userId: user._id,
            type: 'system',
            title,
            message,
            data
        }));

        const createdNotifications = await Notification.insertMany(notifications);
        // System notification sent to all users
        
        return createdNotifications;
    }

    // Get system logs (placeholder - implement based on your logging system)
    async getSystemLogs(limit = 100, skip = 0, level = 'all') {
        // This would integrate with your actual logging system
        return {
            logs: [],
            total: 0,
            message: 'Logging system integration needed'
        };
    }
}

module.exports = new AdminService();
