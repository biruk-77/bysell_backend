// test-project/routes/notification.routes.js
// Notification routes
const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notification.controller');
const { authenticate, requirePermission, adminOnly } = require('../midlewares/roleAuth.middleware');
const { apiLimiter } = require('../midlewares/security.middleware');

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(apiLimiter);

// --- USER NOTIFICATION ROUTES ---

// GET /api/notifications - Get user's notifications
router.get('/', notificationController.getNotifications);

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

// DELETE /api/notifications/read - Delete all read notifications
router.delete('/read', notificationController.deleteAllRead);

// --- ADMIN NOTIFICATION ROUTES ---

// POST /api/notifications/send - Send custom notification (admin/system only)
router.post('/send', 
    requirePermission('manage_users', 'system_settings'),
    notificationController.sendNotification
);

module.exports = router;
