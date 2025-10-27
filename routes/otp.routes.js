// test-project/routes/otp.routes.js
const express = require('express');
const router = express.Router();
const otpController = require('../controller/otp.controller');

// Send OTP (email or phone)
router.post('/send', otpController.sendOTP);

// Verify OTP
router.post('/verify', otpController.verifyOTP);

// Resend OTP
router.post('/resend', otpController.resendOTP);

module.exports = router;
