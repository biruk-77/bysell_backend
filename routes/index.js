const express = require('express');
const router = express.Router();
const {  authLimiter } = require('../midlewares/security.middleware');

// routerly special rate limiting to auth routes
router.use('/auth', authLimiter, require('./auth.routes'));

// Register all API routes
router.use('/profile', require('./profileRoutes'));
router.use('/posts', require('./post.routes'));
router.use('/connections', require('./connection.routes'));
router.use('/messages', require('./message.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/search', require('./search.routes'));
router.use('/status', require('./status.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/otp', require('./otp.routes'));

module.exports= router;
