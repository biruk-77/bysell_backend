const validator = require('validator');

// Email validation
const isValidEmail = (email) => {
    return validator.isEmail(email);
};

// Phone number validation
const isValidPhone = (phone) => {
    return validator.isMobilePhone(phone, 'any');
};

// Password validation
const isValidPassword = (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Username validation
const isValidUsername = (username) => {
    // 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};

// URL validation
const isValidUrl = (url) => {
    return validator.isURL(url);
};

// MongoDB ObjectId validation
const isValidObjectId = (id) => {
    return validator.isMongoId(id);
};

// Sanitize input
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return validator.escape(input.trim());
};

// Validate required fields
const validateRequiredFields = (data, requiredFields) => {
    const missing = [];
    
    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    }
    
    return {
        isValid: missing.length === 0,
        missingFields: missing
    };
};

module.exports = {
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidUsername,
    isValidUrl,
    isValidObjectId,
    sanitizeInput,
    validateRequiredFields
};
