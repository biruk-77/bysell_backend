// Import the Profile, User and Notification models to interact with the database.
const { Profile, User, Notification } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notification.controller');

// controller/auth.controller.js

exports.register = async (req, res) => {
    try {
        console.log('📥 Registration request received:');
        console.log('  - Body:', req.body);
        console.log('  - Content-Type:', req.headers['content-type']);
        
        const { username, email, password, role } = req.body;
        
        console.log('🔍 Extracted fields:');
        console.log('  - username:', username, typeof username);
        console.log('  - email:', email, typeof email);
        console.log('  - password:', password ? '[HIDDEN]' : 'MISSING', typeof password);
        console.log('  - role:', role, typeof role);

        // Validate required fields
        if (!username || !email || !password) {
            console.log('❌ Missing required fields validation failed');
            return res.status(400).json({ 
                message: 'Username, email, and password are required' 
            });
        }
        
        console.log('✅ Required fields validation passed');

        // Check if user already exists
        const existingUser = await User.findOne({ 
            where: { 
                [require('sequelize').Op.or]: [
                    { email: email },
                    { username: username }
                ]
            }
        });

        if (existingUser) {
            console.log('❌ User already exists:', existingUser.email || existingUser.username);
            return res.status(400).json({ 
                message: 'User with this email or username already exists' 
            });
        }
        
        console.log('✅ User does not exist, proceeding with creation');

        // Hash the password
        console.log('🔐 Hashing password...');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('✅ Password hashed successfully');

        // Create new user
        console.log('👤 Creating user with data:', {
            username,
            email,
            role: role || 'employee',
            status: 'active',
            isEmailVerified: false
        });
        
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'employee', // Default to employee if no role provided
            status: 'active',
            isEmailVerified: false
        });
        
        console.log('✅ User created successfully:', newUser.id);

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

        // Create welcome notification
        try {
            await createNotification({
                userId: newUser.id,
                type: 'system_announcement',
                title: 'Welcome to ByAndSell!',
                message: `Welcome ${newUser.username}! Your account has been created successfully. Complete your profile to get started.`,
                priority: 'medium',
                data: {
                    isWelcome: true,
                    userRole: newUser.role
                }
            });
        } catch (notificationError) {
            console.error('Failed to create welcome notification:', notificationError);
            // Don't fail registration if notification fails
        }

        // Update last login
        await newUser.update({ lastLogin: new Date() });

        console.log(`✅ User registered: ${newUser.username} (${newUser.role})`);

        // Send success response (don't send password back)
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
        console.error('💥 Registration error:', error);
        console.error('💥 Error details:', {
            name: error.name,
            message: error.message,
            errors: error.errors,
            stack: error.stack
        });
        
        // Check if it's a Sequelize validation error
        if (error.name === 'SequelizeValidationError') {
            console.log('❌ Sequelize validation error:', error.errors);
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors: error.errors?.map(e => e.message) || []
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong during registration' 
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                message: 'Email and password are required' 
            });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                message: 'Invalid email or password' 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        await user.update({ lastLogin: new Date() });

        console.log(`🔑 User logged in: ${user.username} (${user.role})`);

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                lastLogin: user.lastLogin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Something went wrong during login' 
        });
    }
};

// --- GET CURRENT USER INFO ---
exports.getMe = async (req, res) => {
    try {
        // Get user ID from JWT token (set by authMiddleware)
        const userId = req.user.id;

        // Find user by ID (exclude password)
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

// --- UPDATE USER ACCOUNT INFO ---
exports.updateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email } = req.body;

        // Validate input
        if (!username && !email) {
            return res.status(400).json({ 
                message: 'At least username or email must be provided' 
            });
        }

        // Find current user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Check if username already exists (if updating username)
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

        // Check if email already exists (if updating email)
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

        // Prepare update data
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;

        // Update user
        await user.update(updateData);

        // Get updated user (exclude password)
        const updatedUser = await User.findByPk(userId, {
            attributes: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt']
        });

        // Generate new JWT token with updated info
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

// --- CHANGE PASSWORD ---
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Find user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                message: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await user.update({ password: hashedNewPassword });

        res.status(200).json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            message: 'Something went wrong changing password' 
        });
    }
};

// --- DELETE ACCOUNT ---
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        // Validate password for security
        if (!password) {
            return res.status(400).json({ 
                message: 'Password is required to delete account' 
            });
        }

        // Find user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                message: 'Password is incorrect' 
            });
        }

        // Delete user (this will also delete profile due to CASCADE)
        await user.destroy();

        res.status(200).json({
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ 
            message: 'Something went wrong deleting account' 
        });
    }
};
