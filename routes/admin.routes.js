// Admin routes
const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin.controller');
const { authenticate, adminOnly, minimumRole } = require('../midlewares/roleAuth.middleware');
const { adminLimiter, validateSearch } = require('../midlewares/security.middleware');

// Apply admin authentication and rate limiting to all routes
router.use(authenticate);
router.use(adminOnly);
router.use(adminLimiter);

// --- USER MANAGEMENT ROUTES ---

// GET /api/admin/users - Get all users with filtering
router.get('/users', adminController.getAllUsers);

// GET /api/admin/users/:userId - Get user details by ID
router.get('/users/:userId', adminController.getUserById);

// PUT /api/admin/users/:userId - Update user role/status
router.put('/users/:userId', adminController.updateUser);

// POST /api/admin/users/:userId/suspend - Suspend user account
router.post('/users/:userId/suspend', adminController.suspendUser);

// DELETE /api/admin/users/:userId - Delete user account
router.delete('/users/:userId', adminController.deleteUser);

// --- POST MANAGEMENT ROUTES ---

// GET /api/admin/posts - Get all posts with filtering
router.get('/posts', adminController.getAllPosts);

// PUT /api/admin/posts/:postId - Update post status
router.put('/posts/:postId', adminController.updatePost);

// DELETE /api/admin/posts/:postId - Delete post
router.delete('/posts/:postId', adminController.deletePost);

// --- SYSTEM MANAGEMENT ROUTES ---

// GET /api/admin/stats - Get system statistics
router.get('/stats', adminController.getSystemStats);

// POST /api/admin/announcement - Send system-wide announcement
router.post('/announcement', adminController.sendAnnouncement);

module.exports = router;
