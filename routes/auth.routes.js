// test-project/routes/auth.routes.js
const express = require('express');
const router = express.Router();

// Import the controller that contains the logic
const authController = require('../controller/auth.controller.js');

// Import the middleware that will act as our security guard
const { authenticate } = require('../midlewares/roleAuth.middleware.js');
const { validateUserRegistration, validateUserLogin } = require('../midlewares/security.middleware.js');

// --- PUBLIC ROUTES ---
// These routes do not require a token to be accessed.
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);

// Username availability check
router.get('/check-username/:username', authController.checkUsername);

// OTP Routes
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTPAndRegister);


// --- PROTECTED ROUTES ---
// User account management endpoints

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', authenticate, authController.getMe);

// @route   PUT /api/auth/account
// @desc    Update username and/or email
// @access  Private
router.put('/account', authenticate, authController.updateAccount);

module.exports = router;
