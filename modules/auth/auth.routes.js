const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const otpAuthRoutes = require('./otpAuth.routes');
const { authenticateToken, authorizeRoles, apiLimiter } = require('../../core/middleware');
const { authValidation } = require('../../core/utils');
const { authMiddleware, authenticate, validateUserRegistration, validateUserLogin } = require('../../core/middleware');

// Traditional auth routes with Joi validation
router.post('/register', authValidation.validationMiddleware.register, authController.register);
router.post('/login', authValidation.validationMiddleware.login, authController.login);
router.get('/check-username/:username', authController.checkUsername);

// OTP authentication routes
router.use('/', otpAuthRoutes);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/account', authenticate, authController.updateAccount);

module.exports = router;
