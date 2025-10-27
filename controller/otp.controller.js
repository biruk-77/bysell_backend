// test-project/controller/otp.controller.js
const createAdvancedOtpUtil = require('../utils/advancedOtpUtil');

// Initialize OTP utility with SMS token from environment
const otpUtil = createAdvancedOtpUtil({
    token: process.env.SMS_API_TOKEN || 'development_token',
    otpLength: 6,
    otpExpirationSeconds: 300, // 5 minutes
    maxAttempts: 3,
    lockoutSeconds: 1800 // 30 minutes
});

// Send OTP (phone SMS)
exports.sendOTP = async (req, res) => {
    try {
        const { userId, shortcode_id, callback } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: 'User ID is required'
            });
        }

        const result = await otpUtil.generateAndSendOtp({
            referenceType: 'User',
            referenceId: userId,
            shortcode_id: shortcode_id || process.env.SMS_SHORTCODE_ID,
            callback: callback || process.env.SMS_CALLBACK_URL
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            message: error.message || 'Error sending OTP'
        });
    }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { userId, token } = req.body;

        if (!userId || !token) {
            return res.status(400).json({
                message: 'User ID and OTP token are required'
            });
        }

        const result = await otpUtil.verifyOtp({
            referenceType: 'User',
            referenceId: userId,
            token: token
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(400).json({
            message: error.message || 'Error verifying OTP'
        });
    }
};

// Resend OTP - Just calls sendOTP (rate limiting is built into the utility)
exports.resendOTP = async (req, res) => {
    return exports.sendOTP(req, res);
};

module.exports = exports;
