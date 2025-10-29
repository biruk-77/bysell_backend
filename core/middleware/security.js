const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs for admin routes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many admin requests from this IP, please try again later.'
    }
});

const validateUserRegistration = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email'),
    
    body('phoneNumber')
        .optional()
        .matches(/^(\+251|251|0)?[79]\d{8}$/)
        .withMessage('Please provide a valid Ethiopian phone number'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(error => error.msg)
            });
        }
        next();
    }
];

const validateUserLogin = [
    body('email')
        .optional()
        .isEmail()
        .withMessage('Please provide a valid email'),
    
    body('username')
        .optional()
        .isLength({ min: 3 })
        .withMessage('Username must be at least 3 characters'),
    
    body('phone')
        .optional()
        .matches(/^(\+251|251|0)?[79]\d{8}$/)
        .withMessage('Please provide a valid Ethiopian phone number'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(error => error.msg)
            });
        }
        
        // Check if at least one identifier is provided
        if (!req.body.email && !req.body.username && !req.body.phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, username, or phone number'
            });
        }
        
        next();
    }
];

const validateSearch = [
    body('query')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(error => error.msg)
            });
        }
        next();
    }
];

module.exports = {
    apiLimiter,
    adminLimiter,
    validateUserRegistration,
    validateUserLogin,
    validateSearch
};
