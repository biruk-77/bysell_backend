// Security middleware for validation, rate limiting, and sanitization
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const xss = require('xss');

// --- RATE LIMITING ---

// General API rate limiting (increased for development)
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 requests per minute
    message: {
        success: false,
        message: 'Too many requests, please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`🚫 Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again after 1 minute.',
            retryAfter: '1 minute'
        });
    }
});

// Strict rate limiting for authentication endpoints (relaxed for development)
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // limit each IP to 50 requests per 5 minutes for auth
    message: {
        success: false,
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
        retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        console.log(`🚫 Auth rate limit exceeded for IP: ${req.ip} on ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
            retryAfter: '15 minutes'
        });
    }
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset attempts, please try again after 1 hour.',
        retryAfter: '1 hour'
    },
    handler: (req, res) => {
        console.log(`🚫 Password reset rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many password reset attempts, please try again after 1 hour.',
            retryAfter: '1 hour'
        });
    }
});

// Admin actions rate limiting
const adminLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit admins to 30 requests per minute
    message: {
        success: false,
        message: 'Too many admin requests, please slow down.',
        retryAfter: '1 minute'
    },
    handler: (req, res) => {
        console.log(`🚫 Admin rate limit exceeded for user: ${req.user?.username || 'unknown'} on ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Too many admin requests, please slow down.',
            retryAfter: '1 minute'
        });
    }
});

// --- INPUT VALIDATION ---

// Validate email format
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return validator.isEmail(email) && email.length <= 254;
};

// Validate username format
const validateUsername = (username) => {
    if (!username || typeof username !== 'string') return false;
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
};

// Validate password strength
const validatePassword = (password) => {
    if (!password || typeof password !== 'string') return false;
    return password.length >= 8 && password.length <= 128;
};

// Validate phone number
const validatePhone = (phone) => {
    if (!phone) return true; // Optional field
    if (typeof phone !== 'string') return false;
    return validator.isMobilePhone(phone, 'any');
};

// Validate UUID
const validateUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') return false;
    return validator.isUUID(uuid, 4);
};

// Validate URL
const validateUrl = (url) => {
    if (!url) return true; // Optional field
    if (typeof url !== 'string') return false;
    return validator.isURL(url, { require_protocol: true });
};

// --- SANITIZATION ---

// Sanitize string input
const sanitizeString = (str, maxLength = 1000) => {
    if (!str || typeof str !== 'string') return '';
    
    // Remove XSS attempts
    let sanitized = xss(str, {
        whiteList: {}, // No HTML tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    });
    
    // Trim and limit length
    sanitized = sanitized.trim();
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
};

// Sanitize HTML content (for descriptions, bio, etc.)
const sanitizeHtml = (html, maxLength = 5000) => {
    if (!html || typeof html !== 'string') return '';
    
    // Allow basic HTML tags for formatting
    let sanitized = xss(html, {
        whiteList: {
            p: [],
            br: [],
            strong: [],
            b: [],
            em: [],
            i: [],
            u: [],
            ul: [],
            ol: [],
            li: [],
            h1: [],
            h2: [],
            h3: [],
            h4: [],
            h5: [],
            h6: []
        },
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style']
    });
    
    sanitized = sanitized.trim();
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
};

// --- VALIDATION MIDDLEWARE ---

// User registration validation
const validateUserRegistration = (req, res, next) => {
    try {
        const { username, email, password, role, phoneNumber } = req.body;
        const errors = [];

        // Validate required fields
        if (!username) errors.push('Username is required');
        else if (!validateUsername(username)) {
            errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores');
        }

        if (!email) errors.push('Email is required');
        else if (!validateEmail(email)) {
            errors.push('Please provide a valid email address');
        }

        if (!password) errors.push('Password is required');
        else if (!validatePassword(password)) {
            errors.push('Password must be at least 8 characters long');
        }

        if (role && !['employer', 'employee', 'buyer', 'seller', 'connector'].includes(role)) {
            errors.push('Invalid role specified');
        }

        if (phoneNumber && !validatePhone(phoneNumber)) {
            errors.push('Please provide a valid phone number');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Sanitize inputs
        req.body.username = sanitizeString(username, 30);
        req.body.email = sanitizeString(email, 254);
        if (phoneNumber) req.body.phoneNumber = sanitizeString(phoneNumber, 20);
        if (req.body.location) req.body.location = sanitizeString(req.body.location, 100);

        console.log(`✅ Registration validation passed for: ${req.body.username}`);
        next();
    } catch (error) {
        console.error('Registration validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Validation error occurred'
        });
    }
};

// User login validation
const validateUserLogin = (req, res, next) => {
    try {
        const { email, password } = req.body;
        const errors = [];

        if (!email) errors.push('Email is required');
        else if (!validateEmail(email)) {
            errors.push('Please provide a valid email address');
        }

        if (!password) errors.push('Password is required');

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Sanitize inputs
        req.body.email = sanitizeString(email, 254);

        next();
    } catch (error) {
        console.error('Login validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Validation error occurred'
        });
    }
};

// Post creation validation
const validatePostCreation = (req, res, next) => {
    try {
        const { title, description, type, category, price, location } = req.body;
        const errors = [];

        if (!title) errors.push('Title is required');
        else if (title.length > 200) errors.push('Title must be less than 200 characters');

        if (!description) errors.push('Description is required');
        else if (description.length > 5000) errors.push('Description must be less than 5000 characters');

        if (!type || !['offer', 'request'].includes(type)) {
            errors.push('Type must be either "offer" or "request"');
        }

        if (!category || !['job', 'product', 'service'].includes(category)) {
            errors.push('Category must be "job", "product", or "service"');
        }

        if (price && (isNaN(price) || price < 0)) {
            errors.push('Price must be a valid positive number');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Sanitize inputs
        req.body.title = sanitizeString(title, 200);
        req.body.description = sanitizeHtml(description, 5000);
        if (location) req.body.location = sanitizeString(location, 100);
        if (req.body.requirements) req.body.requirements = sanitizeHtml(req.body.requirements, 2000);
        if (req.body.tags) req.body.tags = sanitizeString(req.body.tags, 500);

        console.log(`✅ Post validation passed for: ${req.body.title}`);
        next();
    } catch (error) {
        console.error('Post validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Validation error occurred'
        });
    }
};

// Profile update validation
const validateProfileUpdate = (req, res, next) => {
    try {
        const { bio, skills, experience, location } = req.body;
        const errors = [];

        if (bio && bio.length > 1000) {
            errors.push('Bio must be less than 1000 characters');
        }

        if (skills && skills.length > 500) {
            errors.push('Skills must be less than 500 characters');
        }

        if (experience && experience.length > 2000) {
            errors.push('Experience must be less than 2000 characters');
        }

        if (location && location.length > 100) {
            errors.push('Location must be less than 100 characters');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Sanitize inputs
        if (bio) req.body.bio = sanitizeHtml(bio, 1000);
        if (skills) req.body.skills = sanitizeString(skills, 500);
        if (experience) req.body.experience = sanitizeHtml(experience, 2000);
        if (location) req.body.location = sanitizeString(location, 100);

        console.log(`✅ Profile validation passed for user: ${req.user.username}`);
        next();
    } catch (error) {
        console.error('Profile validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Validation error occurred'
        });
    }
};

// Message validation
const validateMessage = (req, res, next) => {
    try {
        const { receiverId, content, messageType } = req.body;
        const errors = [];

        if (!receiverId) errors.push('Receiver ID is required');
        else if (!validateUUID(receiverId)) {
            errors.push('Invalid receiver ID format');
        }

        if (!content) errors.push('Message content is required');
        else if (content.length > 2000) {
            errors.push('Message must be less than 2000 characters');
        }

        if (messageType && !['text', 'image', 'file', 'link'].includes(messageType)) {
            errors.push('Invalid message type');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Sanitize inputs
        req.body.content = sanitizeString(content, 2000);

        next();
    } catch (error) {
        console.error('Message validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Validation error occurred'
        });
    }
};

// Search query validation
const validateSearch = (req, res, next) => {
    try {
        const { query, page, limit } = req.query;
        const errors = [];

        if (!query) errors.push('Search query is required');
        else if (query.trim().length < 2) {
            errors.push('Search query must be at least 2 characters long');
        }
        else if (query.length > 100) {
            errors.push('Search query must be less than 100 characters');
        }

        if (page && (isNaN(page) || page < 1)) {
            errors.push('Page must be a positive number');
        }

        if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
            errors.push('Limit must be between 1 and 100');
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Sanitize search query
        req.query.query = sanitizeString(query, 100);

        next();
    } catch (error) {
        console.error('Search validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Validation error occurred'
        });
    }
};

// --- SECURITY HEADERS ---
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
});

module.exports = {
    // Rate limiters
    apiLimiter,
    authLimiter,
    passwordResetLimiter,
    adminLimiter,
    
    // Validation functions
    validateEmail,
    validateUsername,
    validatePassword,
    validatePhone,
    validateUUID,
    validateUrl,
    
    // Sanitization functions
    sanitizeString,
    sanitizeHtml,
    
    // Validation middleware
    validateUserRegistration,
    validateUserLogin,
    validatePostCreation,
    validateProfileUpdate,
    validateMessage,
    validateSearch,
    
    // Security headers
    securityHeaders
};
