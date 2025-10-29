const { Profile, User, Notification, OTP } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('./auth.service');
const { logger } = require('../../core/utils');
const { createNotification } = require('../notification/notification.controller');

exports.register = async (req, res) => {
    try {
        const { username, email, phoneNumber, password, role } = req.body;
        
        // Check if user already exists
        const { Op } = require('sequelize');
        const whereConditions = [{ username: username }];
        
        if (email) whereConditions.push({ email: email });
        if (phoneNumber) whereConditions.push({ phoneNumber: phoneNumber });
        
        const existingUser = await User.findOne({ 
            where: { 
                [Op.or]: whereConditions
            }
        });

        if (existingUser) {
            let conflictField = 'username';
            if (existingUser.email === email) conflictField = 'email';
            if (existingUser.phoneNumber === phoneNumber) conflictField = 'phone number';
            
            return res.status(400).json({ 
                success: false,
                message: `This ${conflictField} is already taken`,
                errors: [`A user with this ${conflictField} already exists`]
            });
        }
        
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const userData = {
            username,
            password: hashedPassword,
            role: role || 'user',
            status: 'active',
            isEmailVerified: false
        };
        
        if (email) userData.email = email;
        if (phoneNumber) userData.phoneNumber = phoneNumber;
        
        const newUser = await User.create(userData);

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newUser.id, 
                username: newUser.username, 
                email: newUser.email,
                role: newUser.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        await newUser.update({ lastLogin: new Date() });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status,
                isEmailVerified: newUser.isEmailVerified,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Registration failed. Please try again.',
            errors: ['Server error occurred during registration']
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, username, phone, password } = req.body;

        // Find user by email, username, or phone
        const { Op } = require('sequelize');
        const whereConditions = [];
        
        if (email) whereConditions.push({ email });
        if (username) whereConditions.push({ username });
        if (phone) {
            let normalizedPhone = phone.replace(/\D/g, '');
            if (normalizedPhone.match(/^(09|07)\d{7,8}$/)) {
                normalizedPhone = normalizedPhone.replace(/^0/, '251');
            }
            whereConditions.push({ phoneNumber: normalizedPhone });
        }
        
        const user = await User.findOne({ 
            where: { 
                [Op.or]: whereConditions
            }
        });

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials',
                errors: ['No account found with these credentials']
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid credentials',
                errors: ['The password you entered is incorrect']
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        await user.update({ lastLogin: new Date() });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Login failed. Please try again.',
            errors: ['Server error occurred during login']
        });
    }
};

exports.checkUsername = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        const existingUser = await User.findOne({
            where: { username },
            attributes: ['id']
        });

        res.status(200).json({
            success: true,
            available: !existingUser,
            message: existingUser ? 'Username is already taken' : 'Username is available'
        });

    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check username availability'
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt']
        });

        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        res.status(200).json({
            message: 'User info retrieved successfully',
            user: user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            message: 'Something went wrong getting user info' 
        });
    }
};

exports.updateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email } = req.body;

        if (!username && !email) {
            return res.status(400).json({ 
                message: 'At least username or email must be provided' 
            });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Check if username already exists
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ 
                where: { username },
                attributes: ['id']
            });
            if (existingUsername) {
                return res.status(400).json({ 
                    message: 'Username already taken' 
                });
            }
        }

        // Check if email already exists
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ 
                where: { email },
                attributes: ['id']
            });
            if (existingEmail) {
                return res.status(400).json({ 
                    message: 'Email already taken' 
                });
            }
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;

        await user.update(updateData);

        const updatedUser = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt']
        });

        const newToken = jwt.sign(
            { 
                id: updatedUser.id, 
                username: updatedUser.username, 
                email: updatedUser.email,
                role: updatedUser.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Account updated successfully',
            token: newToken,
            user: updatedUser
        });

    } catch (error) {
        console.error('Update account error:', error);
        res.status(500).json({ 
            message: 'Something went wrong updating account' 
        });
    }
};

exports.verifyOTPAndRegister = async (req, res) => {
    try {
        const { phoneNumber, otp, role } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
        }

        // For now, just create a simple response
        // This would need proper OTP verification logic
        res.status(200).json({
            success: true,
            message: 'OTP verification not yet implemented',
            phoneNumber: phoneNumber
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP'
        });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        console.log('📱 Sending OTP to:', phoneNumber);

        // Normalize phone number to Ethiopian format: 251XXXXXXXXX (12 digits total)
        let normalizedPhone = phoneNumber.replace(/\D/g, '');
        
        // Handle different Ethiopian phone formats
        if (normalizedPhone.length === 13 && normalizedPhone.startsWith('2510')) {
            // Fix: +2510989271027 → remove the extra 0 → 251989271027
            normalizedPhone = '251' + normalizedPhone.slice(4); // Skip '2510', keep rest
        } else if (normalizedPhone.length === 10 && (normalizedPhone.startsWith('09') || normalizedPhone.startsWith('07'))) {
            // 09XXXXXXXX → 251XXXXXXXXX
            normalizedPhone = '251' + normalizedPhone.slice(1); // 251 + 9 digits = 12 digits
        } else if (normalizedPhone.length === 12 && normalizedPhone.startsWith('251')) {
            // Already in correct format: 251XXXXXXXXX
        } else if (normalizedPhone.length === 9 && (normalizedPhone.startsWith('9') || normalizedPhone.startsWith('7'))) {
            // 9XXXXXXXX → 251XXXXXXXXX
            normalizedPhone = '251' + normalizedPhone; // 251 + 9 digits = 12 digits
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid Ethiopian phone number. Use 09XXXXXXXX format.'
            });
        }
        
        console.log('📱 Normalized to:', normalizedPhone, `(${normalizedPhone.length} digits)`);

        // Check for existing pending OTP - COMMENTED OUT FOR DEVELOPMENT
        // const existingOtp = await OTP.findOne({
        //     where: {
        //         phone: normalizedPhone,
        //         status: 'pending',
        //         expiresAt: { [require('sequelize').Op.gt]: Date.now() }
        //     }
        // });

        // if (existingOtp) {
        //     const remainingSeconds = Math.ceil((existingOtp.expiresAt - Date.now()) / 1000);
        //     return res.status(429).json({
        //         success: false,
        //         message: `Please wait ${remainingSeconds} seconds before requesting another OTP`
        //     });
        // }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('🔐 Generated OTP:', otpCode);

        // Hash the OTP before storing
        const hashedOTP = await bcrypt.hash(otpCode, 10);

        // Set expiration (5 minutes)
        const expiresAt = Date.now() + (5 * 60 * 1000);

        // Clean up old OTPs for this phone
        await OTP.destroy({
            where: {
                phone: normalizedPhone,
                status: { [require('sequelize').Op.in]: ['expired', 'verified'] }
            }
        });

        // Store OTP in database
        await OTP.create({
            phone: normalizedPhone,
            hashedSecret: hashedOTP,
            expiresAt: expiresAt,
            attempts: 0,
            status: 'pending',
            referenceType: 'User',
            referenceId: 'pending'
        });

        // Send SMS via Geez SMS
        let smsSuccess = false;
        try {
            const createSingleSMSUtil = require('../utils/sendSingleSMSUtil');
            const smsUtil = await createSingleSMSUtil({ 
                token: process.env.GEEZSMS_TOKEN 
            });

            const companyName = process.env.COMPANY_NAME || 'Ethio Connect';
            const message = `${companyName}: Your OTP is ${otpCode}. It expires in 5 minutes.`;
            
            console.log('📤 Attempting to send SMS...');
            console.log('  To:', normalizedPhone);
            console.log('  Message:', message);
            console.log('  Token:', process.env.GEEZSMS_TOKEN ? 'Set ✓' : 'MISSING ✗');
            
            const smsResult = await smsUtil.sendSingleSMS({
                phone: '+' + normalizedPhone,
                msg: message
            });

            console.log('✅ SMS sent successfully!');
            console.log('  API Response:', smsResult);
            smsSuccess = true;
        } catch (smsError) {
            console.error('\n❌ SMS FAILED!');
            console.error('  Error:', smsError.message);
            console.error('  Status:', smsError.status);
            console.error('  Data:', smsError.data);
            console.error('  Stack:', smsError.stack);
            console.error('\n🔍 DEBUG INFO:');
            console.error('  Token exists:', !!process.env.GEEZSMS_TOKEN);
            console.error('  Token length:', process.env.GEEZSMS_TOKEN?.length);
            console.error('  Base URL:', process.env.GEEZSMS_BASE_URL);
            console.error('  Phone:', '+' + normalizedPhone);
            // SMS failed - user won't get OTP
        }

        // PRODUCTION MODE: Never return OTP in response
        // OTP should ONLY be sent via SMS to user's phone
        res.status(200).json({
            success: true,
            message: smsSuccess ? `OTP sent to ${phoneNumber}` : `OTP generated but SMS failed. Contact support.`,
            expiresIn: 300,
            phoneNumber: phoneNumber
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP: ' + error.message
        });
    }
};

// Verify OTP and register user
exports.verifyOTPAndRegister = async (req, res) => {
    try {
        const { phoneNumber, otp, role } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and OTP are required'
            });
        }

        console.log('🔍 Verifying OTP for:', phoneNumber);
        console.log('🎯 Role from request:', role);

        // Normalize phone number to Ethiopian format: 251XXXXXXXXX (12 digits total)
        let normalizedPhone = phoneNumber.replace(/\D/g, '');
        
        // Handle different Ethiopian phone formats
        if (normalizedPhone.length === 13 && normalizedPhone.startsWith('2510')) {
            // Fix: +2510989271027 → remove the extra 0 → 251989271027
            normalizedPhone = '251' + normalizedPhone.slice(4);
        } else if (normalizedPhone.length === 10 && (normalizedPhone.startsWith('09') || normalizedPhone.startsWith('07'))) {
            normalizedPhone = '251' + normalizedPhone.slice(1);
        } else if (normalizedPhone.length === 12 && normalizedPhone.startsWith('251')) {
            // Already in correct format
        } else if (normalizedPhone.length === 9 && (normalizedPhone.startsWith('9') || normalizedPhone.startsWith('7'))) {
            normalizedPhone = '251' + normalizedPhone;
        }
        
        console.log('🔍 Normalized to:', normalizedPhone, `(${normalizedPhone.length} digits)`);

        // Find the OTP record
        const otpRecord = await OTP.findOne({
            where: {
                phone: normalizedPhone,
                status: 'pending'
            },
            order: [['createdAt', 'DESC']]
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found for this phone number'
            });
        }

        // Check if expired
        if (Date.now() > otpRecord.expiresAt) {
            await otpRecord.update({ status: 'expired' });
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            await otpRecord.update({ status: 'locked' });
            return res.status(400).json({
                success: false,
                message: 'Too many attempts. Please request a new OTP.'
            });
        }

        // Verify OTP
        const isValid = await bcrypt.compare(otp, otpRecord.hashedSecret);

        if (!isValid) {
            await otpRecord.update({ attempts: otpRecord.attempts + 1 });
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
                attemptsLeft: 3 - (otpRecord.attempts + 1)
            });
        }

        // OTP is valid! Mark as verified
        await otpRecord.update({ status: 'verified' });

        // Check if user already exists
        const existingUser = await User.findOne({
            where: { phoneNumber: normalizedPhone }
        });

        if (existingUser) {
            // User exists, just log them in
            const token = jwt.sign(
                { 
                    id: existingUser.id, 
                    username: existingUser.username, 
                    phoneNumber: existingUser.phoneNumber, 
                    role: existingUser.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: existingUser.id,
                    username: existingUser.username,
                    phoneNumber: existingUser.phoneNumber,
                    role: existingUser.role,
                    status: existingUser.status
                }
            });
        }

        // Create new user
        const username = `user_${normalizedPhone.slice(-10)}`;
        const randomPassword = Math.random().toString(36).slice(-12) + Date.now().toString(36);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const userRole = role || 'employee';
        console.log('👤 Creating user with role:', userRole);

        const newUser = await User.create({
            username,
            phoneNumber: normalizedPhone,
            password: hashedPassword,
            role: userRole,
            status: 'active',
            isEmailVerified: false
        });

        console.log('✅ User created via OTP:', newUser.id);

        // Update OTP record with user reference
        await otpRecord.update({ referenceId: newUser.id });

        // Generate JWT token
        const token = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create welcome notification
        try {
            await createNotification({
                userId: newUser.id,
                type: 'system_announcement',
                title: 'Welcome to Ethio Connect!',
                message: `Welcome ${newUser.username}! Your account has been created successfully.`,
                priority: 'medium',
                data: {
                    isWelcome: true,
                    userRole: newUser.role
                }
            });
        } catch (notificationError) {
            console.error('Failed to create welcome notification:', notificationError);
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                phoneNumber: newUser.phoneNumber,
                role: newUser.role,
                status: newUser.status
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP'
        });
    }
};
