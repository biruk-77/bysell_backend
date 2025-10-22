// routes/connection.routes.js

const express = require('express');
const router = express.Router();

// Import the connection controller
const connectionController = require('../controller/connection.controller.js');

// Import authentication middleware
const authMiddleware = require('../midlewares/auth.middleware.js');

// --- CONNECTION ROUTES ---

// @route   POST /api/connections/send
// @desc    Send a connection request
// @access  Private
router.post('/send', authMiddleware, connectionController.sendConnectionRequest);

// @route   PUT /api/connections/:connectionId/respond
// @desc    Accept or reject a connection request
// @access  Private
router.put('/:connectionId/respond', authMiddleware, connectionController.respondToConnectionRequest);

// @route   GET /api/connections
// @desc    Get my accepted connections
// @access  Private
router.get('/', authMiddleware, connectionController.getMyConnections);

// @route   GET /api/connections/pending
// @desc    Get pending connection requests (received)
// @access  Private
router.get('/pending', authMiddleware, connectionController.getPendingRequests);

// @route   GET /api/connections/sent
// @desc    Get sent connection requests
// @access  Private
router.get('/sent', authMiddleware, connectionController.getSentRequests);

// @route   DELETE /api/connections/:connectionId
// @desc    Remove a connection
// @access  Private
router.delete('/:connectionId', authMiddleware, connectionController.removeConnection);

module.exports = router;
