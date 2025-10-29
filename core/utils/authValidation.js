const Joi = require('joi');

// Phone number validation schema for Ethiopian numbers
const phoneSchema = Joi.string()
    .pattern(/^(\+251|251|0)?(9|7)\d{8}$/)
    .messages({
        'string.pattern.base': 'Invalid phone number. Use Ethiopian format: 09XXXXXXXX, 07XXXXXXXX, or +251XXXXXXXX'
    });

// Email validation schema
const emailSchema = Joi.string()
    .email({ tlds: { allow: false } })
    .messages({
        'string.email': 'Please provide a valid email address'
    });

// Password validation schema
const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    });

// Username validation schema
const usernameSchema = Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters'
    });

// OTP validation schema
const otpSchema = Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .messages({
        'string.length': 'OTP must be exactly 6 digits',
        'string.pattern.base': 'OTP must contain only numbers'
    });

// User role validation schema
const roleSchema = Joi.string()
    .valid('user', 'employer', 'employee', 'buyer', 'seller', 'connector', 'reviewer', 'admin', 'service_provider', 'customer', 'renter', 'tenant', 'husband', 'wife')
    .default('user')
    .messages({
        'any.only': 'Invalid user role'
    });

// Authentication validation schemas
const authValidation = {
    // User registration validation
    register: Joi.object({
        username: usernameSchema.required(),
        email: emailSchema.optional(),
        phoneNumber: phoneSchema.optional(),
        password: passwordSchema.required(),
        role: roleSchema.optional()
    }).or('email', 'phoneNumber').messages({
        'object.missing': 'Either email or phone number is required'
    }),

    // User login validation
    login: Joi.object({
        username: Joi.string().optional(),
        email: emailSchema.optional(),
        phone: phoneSchema.optional(),
        password: passwordSchema.required()
    }).or('username', 'email', 'phone').messages({
        'object.missing': 'Username, email, or phone number is required'
    }),

    // OTP request validation
    requestOtp: Joi.object({
        phone: phoneSchema.required()
    }),

    // OTP verification validation
    verifyOtp: Joi.object({
        phone: phoneSchema.required(),
        otp: otpSchema.required()
    }),

    // Password reset request validation
    forgotPassword: Joi.object({
        email: emailSchema.required()
    }),

    // Password reset validation
    resetPassword: Joi.object({
        token: Joi.string().required().messages({
            'any.required': 'Reset token is required'
        }),
        password: passwordSchema.required()
    }),

    // Change password validation
    changePassword: Joi.object({
        currentPassword: Joi.string().required().messages({
            'any.required': 'Current password is required'
        }),
        newPassword: passwordSchema.required()
    }),

    // Update profile validation
    updateProfile: Joi.object({
        username: usernameSchema.optional(),
        email: emailSchema.optional(),
        phoneNumber: phoneSchema.optional()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // Username availability check
    checkUsername: Joi.object({
        username: usernameSchema.required()
    })
};

// Validation middleware factory
const createValidationMiddleware = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};

// Individual validation middlewares
const validationMiddleware = {
    register: createValidationMiddleware(authValidation.register),
    login: createValidationMiddleware(authValidation.login),
    requestOtp: createValidationMiddleware(authValidation.requestOtp),
    verifyOtp: createValidationMiddleware(authValidation.verifyOtp),
    forgotPassword: createValidationMiddleware(authValidation.forgotPassword),
    resetPassword: createValidationMiddleware(authValidation.resetPassword),
    changePassword: createValidationMiddleware(authValidation.changePassword),
    updateProfile: createValidationMiddleware(authValidation.updateProfile),
    checkUsername: createValidationMiddleware(authValidation.checkUsername)
};

// Utility functions for manual validation
const validateData = {
    phone: (phone) => {
        const { error, value } = phoneSchema.validate(phone);
        return { isValid: !error, value, error: error?.message };
    },

    email: (email) => {
        const { error, value } = emailSchema.validate(email);
        return { isValid: !error, value, error: error?.message };
    },

    password: (password) => {
        const { error, value } = passwordSchema.validate(password);
        return { isValid: !error, value, error: error?.message };
    },

    username: (username) => {
        const { error, value } = usernameSchema.validate(username);
        return { isValid: !error, value, error: error?.message };
    },

    otp: (otp) => {
        const { error, value } = otpSchema.validate(otp);
        return { isValid: !error, value, error: error?.message };
    }
};

module.exports = {
    authValidation,
    validationMiddleware,
    validateData,
    schemas: {
        phone: phoneSchema,
        email: emailSchema,
        password: passwordSchema,
        username: usernameSchema,
        otp: otpSchema,
        role: roleSchema
    }
};
