const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM(
            'connection_request', 'connection_accepted', 'connection_rejected',
            'new_message', 'post_liked', 'post_commented', 'post_shared',
            'job_application', 'application_status', 'system_announcement',
            'account_warning', 'account_suspended', 'payment_received',
            'order_status', 'profile_viewed', 'skill_endorsed'
        ),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional data related to the notification'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Optional expiration date for temporary notifications'
    },
    actionUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL to redirect user when notification is clicked'
    },
    fromUserId: {
        type: DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'User who triggered this notification (if applicable)'
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        {
            fields: ['userId', 'isRead']
        },
        {
            fields: ['type']
        },
        {
            fields: ['createdAt']
        },
        {
            fields: ['priority']
        }
    ]
});

module.exports = Notification;
