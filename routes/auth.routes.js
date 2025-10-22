const express = require('express');
const router = express.Router();

// Import the controller that contains the logic
const authController = require('../controller/auth.controller.js');

// Import the middleware that will act as our security guard
const authMiddleware = require('../midlewares/auth.middleware.js');

// --- PUBLIC ROUTES ---
// These routes do not require a token to be accessed.
console.log('authController.login:', authController.login); 
router.post('/register', authController.register);
router.post('/login', authController.login);


// --- PROTECTED ROUTES ---
// User account management endpoints

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authMiddleware, authController.getMe);

// @route   PUT /api/auth/account
// @desc    Update username and/or email
// @access  Private
router.put('/account', authMiddleware, authController.updateAccount);

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', authMiddleware, authController.changePassword);

// @route   DELETE /api/auth/account
// @desc    Delete user account
// @access  Private
router.delete('/account', authMiddleware, authController.deleteAccount);

module.exports = router;