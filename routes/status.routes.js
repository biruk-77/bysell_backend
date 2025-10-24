// routes/status.routes.js

const express = require('express');
const router = express.Router();
const statusController = require('../controller/status.controller');
const authenticateToken = require('../midlewares/auth.middleware');

// All status routes require authentication
router.use(authenticateToken);

// --- STATUS ROUTES ---

// PUT /api/status - Update user status
router.put('/', statusController.updateUserStatus);

// GET /api/status/:userId - Get user status
router.get('/:userId', statusController.getUserStatus);

// GET /api/status/online/users - Get online users
router.get('/online/users', statusController.getOnlineUsers);

// PUT /api/status/typing - Update typing status
router.put('/typing', statusController.updateTypingStatus);

module.exports = router;
