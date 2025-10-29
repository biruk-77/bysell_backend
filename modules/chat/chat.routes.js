// test-project/routes/message.routes.js
// routes/message.routes.js

const express = require('express');
const router = express.Router();

// Import the chat controller
const chatController = require('./chat.controller');

// Import authentication middleware
const { authMiddleware } = require('../../core/middleware');

// --- MESSAGE ROUTES ---

// MESSAGE SENDING IS NOW SOCKET-ONLY
// Use socket event 'send_message' instead of REST API

// @route   GET /api/messages/conversations
// @desc    Get all conversations for the current user
// @access  Private
router.get('/conversations', authMiddleware, chatController.getConversations);

// @route   GET /api/messages/conversation/:otherUserId
// @desc    Get conversation history with a specific user
// @access  Private
router.get('/conversation/:otherUserId', authMiddleware, chatController.getConversation);

// @route   PUT /api/messages/read/:otherUserId
// @desc    Mark all messages from a user as read
// @access  Private
router.put('/read/:otherUserId', authMiddleware, chatController.markAsRead);

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:messageId', authMiddleware, chatController.deleteMessage);

module.exports = router;
