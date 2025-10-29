const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'bysell-backend' },
    transports: [
        // Error logs
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true
        }),
        
        // Combined logs
        new DailyRotateFile({
            filename: path.join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d',
            zippedArchive: true
        }),
        
        // Console output for development
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
        })
    ],
    
    // Handle exceptions and rejections
    exceptionHandlers: [
        new DailyRotateFile({
            filename: path.join(logDir, 'exceptions-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d'
        })
    ],
    
    rejectionHandlers: [
        new DailyRotateFile({
            filename: path.join(logDir, 'rejections-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '30d'
        })
    ]
});

// Add request logging middleware
logger.requestMiddleware = (req, res, next) => {
    const start = Date.now();
    const { method, url, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'Unknown';
    
    // Log request
    logger.info('Incoming request', {
        method,
        url,
        ip: ip || req.connection?.remoteAddress,
        userAgent,
        timestamp: new Date().toISOString()
    });
    
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        
        logger.info('Request completed', {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    });
    
    next();
};

// Add authentication logging helpers
logger.auth = {
    loginAttempt: (email, ip, success = false) => {
        logger.info('Login attempt', {
            email,
            ip,
            success,
            timestamp: new Date().toISOString()
        });
    },
    
    loginSuccess: (userId, email, ip) => {
        logger.info('Login successful', {
            userId,
            email,
            ip,
            timestamp: new Date().toISOString()
        });
    },
    
    loginFailure: (email, ip, reason) => {
        logger.warn('Login failed', {
            email,
            ip,
            reason,
            timestamp: new Date().toISOString()
        });
    },
    
    otpRequest: (phone, ip) => {
        logger.info('OTP requested', {
            phone,
            ip,
            timestamp: new Date().toISOString()
        });
    },
    
    otpVerification: (phone, ip, success = false) => {
        logger.info('OTP verification', {
            phone,
            ip,
            success,
            timestamp: new Date().toISOString()
        });
    },
    
    registration: (email, phone, ip) => {
        logger.info('User registration', {
            email,
            phone,
            ip,
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = logger;
