const express = require('express');
const router = express.Router();
const otpAuthController = require('./otpAuth.controller');
const { apiLimiter } = require('../../core/middleware');
const { authValidation } = require('../../core/utils');

// Apply rate limiting to OTP routes
router.use(apiLimiter);

// OTP endpoints with validation
router.post('/request-otp', authValidation.validationMiddleware.requestOtp, otpAuthController.requestOtp);
router.post('/verify-otp', authValidation.validationMiddleware.verifyOtp, otpAuthController.verifyOtp);

module.exports = router;
