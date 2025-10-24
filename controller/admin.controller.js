// Admin controller for user and system management
const { User, Post, Connection, Message, Notification } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// --- USER MANAGEMENT ---

// Get all users with filtering and pagination
exports.getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            role, 
            status, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        
        // Build where clause
        const whereClause = {};
        
        if (role) {
            whereClause.role = role;
        }
        
        if (status) {
            whereClause.status = status;
        }
        
        if (search) {
            whereClause[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'username', 'email', 'role', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'location', 'phoneNumber', 'isEmailVerified'],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]]
        });

        console.log(`📊 Admin ${req.user.username} retrieved ${rows.length} users`);

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalUsers: count,
                    hasNext: page * limit < count,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while retrieving users.' 
        });
    }
};

// Get user details by ID
exports.getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Post,
                    as: 'posts',
                    limit: 5,
                    order: [['createdAt', 'DESC']]
                },
                {
                    model: Connection,
                    as: 'sentConnections',
                    limit: 5
                },
                {
                    model: Connection,
                    as: 'receivedConnections',
                    limit: 5
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found.' 
            });
        }

        console.log(`👤 Admin ${req.user.username} viewed user details: ${user.username}`);

        res.status(200).json({
            success: true,
            message: 'User details retrieved successfully',
            data: { user }
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while retrieving user details.' 
        });
    }
};

// Update user role or status
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, status, isEmailVerified } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found.' 
            });
        }

        // Prevent admin from changing their own role/status
        if (userId === req.user.id) {
            return res.status(400).json({ 
                success: false,
                message: 'You cannot modify your own role or status.' 
            });
        }

        const updateData = {};
        if (role) updateData.role = role;
        if (status) updateData.status = status;
        if (isEmailVerified !== undefined) updateData.isEmailVerified = isEmailVerified;

        await user.update(updateData);

        // Create notification for user about status change
        if (status) {
            await Notification.create({
                userId: userId,
                type: status === 'suspended' ? 'account_suspended' : 'system_announcement',
                title: `Account Status Updated`,
                message: `Your account status has been changed to: ${status}`,
                priority: status === 'suspended' ? 'high' : 'medium',
                fromUserId: req.user.id
            });
        }

        console.log(`🔧 Admin ${req.user.username} updated user ${user.username}: ${JSON.stringify(updateData)}`);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { 
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    isEmailVerified: user.isEmailVerified
                }
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while updating user.' 
        });
    }
};

// Suspend user account
exports.suspendUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason, duration } = req.body; // duration in days

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found.' 
            });
        }

        if (userId === req.user.id) {
            return res.status(400).json({ 
                success: false,
                message: 'You cannot suspend yourself.' 
            });
        }

        await user.update({ status: 'suspended' });

        // Create suspension notification
        await Notification.create({
            userId: userId,
            type: 'account_suspended',
            title: 'Account Suspended',
            message: `Your account has been suspended. Reason: ${reason || 'Terms violation'}`,
            priority: 'high',
            fromUserId: req.user.id,
            data: {
                reason: reason,
                duration: duration,
                suspendedBy: req.user.username,
                suspendedAt: new Date()
            }
        });

        console.log(`🚫 Admin ${req.user.username} suspended user ${user.username}. Reason: ${reason}`);

        res.status(200).json({
            success: true,
            message: 'User suspended successfully',
            data: { userId, reason, duration }
        });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while suspending user.' 
        });
    }
};

// Delete user account
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found.' 
            });
        }

        if (userId === req.user.id) {
            return res.status(400).json({ 
                success: false,
                message: 'You cannot delete yourself.' 
            });
        }

        const username = user.username;
        
        // Delete user and related data (cascade should handle most)
        await user.destroy();

        console.log(`🗑️ Admin ${req.user.username} deleted user ${username}. Reason: ${reason}`);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: { deletedUser: username, reason }
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while deleting user.' 
        });
    }
};

// --- POST MANAGEMENT ---

// Get all posts with filtering
exports.getAllPosts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            type, 
            category,
            status,
            search,
            userId,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        
        const whereClause = {};
        
        if (type) whereClause.type = type;
        if (category) whereClause.category = category;
        if (status) whereClause.status = status;
        if (userId) whereClause.userId = userId;
        
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Post.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'role']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [[sortBy, sortOrder.toUpperCase()]]
        });

        console.log(`📋 Admin ${req.user.username} retrieved ${rows.length} posts`);

        res.status(200).json({
            success: true,
            message: 'Posts retrieved successfully',
            data: {
                posts: rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalPosts: count,
                    hasNext: page * limit < count,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all posts error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while retrieving posts.' 
        });
    }
};

// Update post status (approve, reject, hide)
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { status, reason } = req.body;

        const post = await Post.findByPk(postId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ 
                success: false,
                message: 'Post not found.' 
            });
        }

        await post.update({ status });

        // Notify post owner about status change
        if (status === 'rejected' || status === 'hidden') {
            await Notification.create({
                userId: post.userId,
                type: 'system_announcement',
                title: `Post ${status}`,
                message: `Your post "${post.title}" has been ${status}. ${reason ? `Reason: ${reason}` : ''}`,
                priority: 'medium',
                fromUserId: req.user.id,
                data: {
                    postId: postId,
                    postTitle: post.title,
                    reason: reason
                }
            });
        }

        console.log(`📝 Admin ${req.user.username} ${status} post ${post.title} by ${post.user.username}`);

        res.status(200).json({
            success: true,
            message: `Post ${status} successfully`,
            data: { postId, status, reason }
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while updating post.' 
        });
    }
};

// Delete post
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason } = req.body;

        const post = await Post.findByPk(postId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['username']
                }
            ]
        });

        if (!post) {
            return res.status(404).json({ 
                success: false,
                message: 'Post not found.' 
            });
        }

        const postTitle = post.title;
        const postOwner = post.user.username;
        const postUserId = post.userId;

        await post.destroy();

        // Notify post owner
        await Notification.create({
            userId: postUserId,
            type: 'system_announcement',
            title: 'Post Deleted',
            message: `Your post "${postTitle}" has been deleted by admin. ${reason ? `Reason: ${reason}` : ''}`,
            priority: 'medium',
            fromUserId: req.user.id,
            data: {
                postTitle: postTitle,
                reason: reason,
                deletedBy: req.user.username,
                deletedAt: new Date()
            }
        });

        console.log(`🗑️ Admin ${req.user.username} deleted post "${postTitle}" by ${postOwner}. Reason: ${reason}`);

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully',
            data: { deletedPost: postTitle, reason }
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while deleting post.' 
        });
    }
};

// --- SYSTEM ANALYTICS ---

// Get system statistics
exports.getSystemStats = async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            suspendedUsers,
            totalPosts,
            activePosts,
            totalConnections,
            totalMessages
        ] = await Promise.all([
            User.count(),
            User.count({ where: { status: 'active' } }),
            User.count({ where: { status: 'suspended' } }),
            Post.count(),
            Post.count({ where: { status: 'active' } }),
            Connection.count({ where: { status: 'accepted' } }),
            Message.count()
        ]);

        // Get user role distribution
        const roleDistribution = await User.findAll({
            attributes: ['role', [require('sequelize').fn('COUNT', 'role'), 'count']],
            group: ['role']
        });

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivity = {
            newUsers: await User.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
            newPosts: await Post.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
            newConnections: await Connection.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } }),
            newMessages: await Message.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } })
        };

        console.log(`📊 Admin ${req.user.username} accessed system statistics`);

        res.status(200).json({
            success: true,
            message: 'System statistics retrieved successfully',
            data: {
                overview: {
                    totalUsers,
                    activeUsers,
                    suspendedUsers,
                    totalPosts,
                    activePosts,
                    totalConnections,
                    totalMessages
                },
                roleDistribution: roleDistribution.map(role => ({
                    role: role.role,
                    count: parseInt(role.dataValues.count)
                })),
                recentActivity,
                lastUpdated: new Date()
            }
        });
    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while retrieving system statistics.' 
        });
    }
};

// Send system-wide announcement
exports.sendAnnouncement = async (req, res) => {
    try {
        const { title, message, priority = 'medium', targetRoles, expiresInDays } = req.body;

        if (!title || !message) {
            return res.status(400).json({ 
                success: false,
                message: 'Title and message are required.' 
            });
        }

        // Get target users
        let whereClause = { status: 'active' };
        if (targetRoles && targetRoles.length > 0) {
            whereClause.role = { [Op.in]: targetRoles };
        }

        const targetUsers = await User.findAll({
            where: whereClause,
            attributes: ['id']
        });

        // Calculate expiration date
        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
        }

        // Create notifications for all target users
        const notifications = targetUsers.map(user => ({
            userId: user.id,
            type: 'system_announcement',
            title,
            message,
            priority,
            fromUserId: req.user.id,
            expiresAt,
            data: {
                isSystemWide: true,
                sentBy: req.user.username,
                targetRoles: targetRoles || 'all'
            }
        }));

        await Notification.bulkCreate(notifications);

        console.log(`📢 Admin ${req.user.username} sent announcement to ${targetUsers.length} users`);

        res.status(200).json({
            success: true,
            message: 'Announcement sent successfully',
            data: {
                title,
                message,
                recipientCount: targetUsers.length,
                targetRoles: targetRoles || 'all',
                expiresAt
            }
        });
    } catch (error) {
        console.error('Send announcement error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong while sending announcement.' 
        });
    }
};

module.exports = {
    getAllUsers: exports.getAllUsers,
    getUserById: exports.getUserById,
    updateUser: exports.updateUser,
    suspendUser: exports.suspendUser,
    deleteUser: exports.deleteUser,
    getAllPosts: exports.getAllPosts,
    updatePost: exports.updatePost,
    deletePost: exports.deletePost,
    getSystemStats: exports.getSystemStats,
    sendAnnouncement: exports.sendAnnouncement
};
