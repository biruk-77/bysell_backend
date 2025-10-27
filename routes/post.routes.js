// test-project/routes/post.routes.js
// routes/post.routes.js

const express = require('express');
const router = express.Router();

// Import the post controller
const postController = require('../controller/post.controller.js');

// Import authentication middleware
const authMiddleware = require('../midlewares/auth.middleware.js');

// --- POST ROUTES ---

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', authMiddleware, postController.createPost);

// @route   GET /api/posts
// @desc    Get all posts with filtering and pagination
// @access  Public
// @query   ?postType=offer&category=job&location=London&page=1&limit=10
router.get('/', postController.getAllPosts);

// @route   GET /api/posts/my
// @desc    Get current user's posts
// @access  Private
router.get('/my', authMiddleware, postController.getMyPosts);

// @route   GET /api/posts/:postId
// @desc    Get a single post by ID
// @access  Public
router.get('/:postId', postController.getPostById);

// @route   PUT /api/posts/:postId
// @desc    Update a post
// @access  Private (only post author)
router.put('/:postId', authMiddleware, postController.updatePost);

// @route   DELETE /api/posts/:postId
// @desc    Delete a post
// @access  Private (only post author)
router.delete('/:postId', authMiddleware, postController.deletePost);

module.exports = router;
