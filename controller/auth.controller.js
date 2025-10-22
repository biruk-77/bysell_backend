// Import the Profile and User models to interact with the database.
const { Profile, User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// controller/auth.controller.js

exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ 
                message: 'Username, email, and password are required' 
            });
        }

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
            return res.status(400).json({ 
                message: 'User with this email or username already exists' 
            });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'user' // Default to user if no role provided
        });

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

        // Send success response (don't send password back)
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
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

        // Send success response
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
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
