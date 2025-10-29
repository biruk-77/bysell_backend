const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('../middleware');

const authModule = require('../../modules/auth');
const profileModule = require('../../modules/profile');
const postModule = require('../../modules/post');
const chatModule = require('../../modules/chat');
const notificationModule = require('../../modules/notification');
const adminModule = require('../../modules/admin');

function createExpressApp() {
    const app = express();

    // Trust proxy for proper IP detection in rate limiting
    app.set('trust proxy', true);

    app.use(helmet());
    app.use(cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }));

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        // Skip rate limiting for health checks
        skip: (req) => req.path === '/health'
    });
    app.use(limiter);

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use('/uploads', express.static('uploads'));

    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    app.get('/test', (req, res) => {
        res.send('Hello, World! REST API is ready! 🚀');
    });

    app.use('/api/auth', authModule.routes);
    app.use('/api/profile', profileModule.routes);
    app.use('/api/posts', postModule.routes);
    app.use('/api/chat', chatModule.routes);
    app.use('/api/notifications', notificationModule.routes);
    app.use('/api/admin', adminModule.routes);

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: 'Route not found'
        });
    });

    app.use(errorHandler);

    return app;
}

module.exports = createExpressApp;
