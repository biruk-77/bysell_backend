// modules/post/post.controller.js
const { Post, User } = require('../../models');

// --- CREATE A NEW POST ---
exports.createPost = async (req, res) => {
    try {
        const { title, description, postType, category, location } = req.body;
        const userId = req.user.id; // Get user ID from the authenticated user (via authMiddleware)

        if (!title || !description || !postType || !category) {
            return res.status(400).json({ message: 'Title, description, post type, and category are required.' });
        }

        const newPost = await Post.create({
            title,
            description,
            postType,
            category,
            location,
            userId
        });

        res.status(201).json({
            message: 'Post created successfully',
            post: newPost
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Something went wrong while creating the post.' });
    }
};

// --- GET ALL POSTS (with Filtering and Pagination) ---
exports.getAllPosts = async (req, res) => {
    try {
        const { postType, category, location, page = 1, limit = 10 } = req.query;

        const whereClause = {};
        if (postType) whereClause.postType = postType;
        if (category) whereClause.category = category;
        if (location) whereClause.location = location;

        const offset = (page - 1) * limit;

        const { count, rows } = await Post.findAndCountAll({
            where: whereClause,
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username'] // Only include the author's ID and username
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']] // Show newest posts first
        });

        res.status(200).json({
            message: 'Posts retrieved successfully',
            totalPosts: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            posts: rows
        });
    } catch (error) {
        console.error('Get all posts error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving posts.' });
    }
};

// --- GET A SINGLE POST BY ID ---
exports.getPostById = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findByPk(postId, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username']
            }]
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        res.status(200).json({ post });
    } catch (error) {
        console.error('Get post by ID error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving the post.' });
    }
};

// --- UPDATE A POST ---
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { title, description, postType, category, location } = req.body;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Check if the logged-in user is the author of the post
        if (post.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this post.' });
        }

        // Prepare update data
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (postType !== undefined) updateData.postType = postType;
        if (category !== undefined) updateData.category = category;
        if (location !== undefined) updateData.location = location;

        // Update the post
        await post.update(updateData);

        // Get updated post with author info
        const updatedPost = await Post.findByPk(postId, {
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username']
            }]
        });

        res.status(200).json({
            message: 'Post updated successfully',
            post: updatedPost
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Something went wrong while updating the post.' });
    }
};

// --- GET USER'S OWN POSTS ---
exports.getMyPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Post.findAndCountAll({
            where: { userId },
            include: [{
                model: User,
                as: 'author',
                attributes: ['id', 'username']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Your posts retrieved successfully',
            totalPosts: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            posts: rows
        });
    } catch (error) {
        console.error('Get my posts error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving your posts.' });
    }
};

// --- DELETE A POST ---
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const post = await Post.findByPk(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        // Check if the logged-in user is the author of the post
        if (post.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this post.' });
        }

        await post.destroy();

        res.status(200).json({ message: 'Post deleted successfully.' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Something went wrong while deleting the post.' });
    }
};
