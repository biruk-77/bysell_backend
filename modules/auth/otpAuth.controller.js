const { User, OTP } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isValidPhone, normalizePhone } = require('../../core/utils/phone');
const createAdvancedOtpUtil = require('../../core/utils/advancedOtp');
const { logger, authValidation } = require('../../core/utils');

// Initialize OTP utility
const otpUtil = createAdvancedOtpUtil({
    token: process.env.GEEZSMS_TOKEN,
    otpLength: 6,
    otpExpirationSeconds: 300, // 5 minutes
    maxAttempts: 3,
    lockoutSeconds: 1800, // 30 minutes
    companyName: process.env.COMPANY_NAME || 'BySell'
});

// Request OTP for phone authentication
exports.requestOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        const clientIP = req.ip || req.connection?.remoteAddress;

        // Log OTP request
        logger.auth.otpRequest(phone, clientIP);

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Validate phone number format
        if (!isValidPhone(phone)) {
            logger.warn('Invalid phone number format', { phone, ip: clientIP });
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number. Use 09XXXXXXXX, 07XXXXXXXX, or +2519XXXXXXXX'
            });
        }

        const normalizedPhone = normalizePhone(phone);

        // Find or create user by phone
        let user = await User.findOne({ 
            where: { phoneNumber: normalizedPhone } 
        });

        if (!user) {
            // Create user with phone number
            const randomPassword = Math.random().toString(36).slice(2, 12) + '!A1';
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            user = await User.create({
                username: `user_${normalizedPhone.slice(-10)}`,
                phoneNumber: normalizedPhone,
                password: hashedPassword,
                role: 'user',
                status: 'active',
                isEmailVerified: false,
                otpRegistered: false
            });
        }

        // Generate and send OTP
        const otpResponse = await otpUtil.generateAndSendOtp({
            referenceType: 'User',
            referenceId: user.id,
            phoneNumber: normalizedPhone
        });

        res.status(200).json(otpResponse);

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to send OTP'
        });
    }
};

// Verify OTP and authenticate user
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const clientIP = req.ip || req.connection?.remoteAddress;

        if (!phone || !otp) {
            logger.warn('Missing phone or OTP in verification request', { phone, ip: clientIP });
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
        }

        const normalizedPhone = normalizePhone(phone);

        // Find user by phone
        const user = await User.findOne({ 
            where: { phoneNumber: normalizedPhone } 
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify OTP
        await otpUtil.verifyOtp({
            referenceType: 'User',
            referenceId: user.id,
            token: otp,
            phoneNumber: normalizedPhone
        });

        // Mark user as OTP registered
        await user.update({ otpRegistered: true });

        // Generate JWT tokens
        const accessToken = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                phoneNumber: user.phoneNumber,
                role: user.role,
                otpRegistered: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Generate refresh token (simplified for now)
        const refreshToken = jwt.sign(
            { 
                id: user.id,
                type: 'refresh'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully. Account activated.',
            user: {
                id: user.id,
                username: user.username,
                phone: user.phoneNumber,
                role: user.role,
                otpRegistered: user.otpRegistered
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to verify OTP'
        });
    }
};

