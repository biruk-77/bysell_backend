// models/userStatus.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserStatus = sequelize.define('UserStatus', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('online', 'away', 'busy', 'offline'),
        allowNull: false,
        defaultValue: 'offline'
    },
    lastSeen: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    socketId: {
        type: DataTypes.STRING,
        allowNull: true // Current socket connection ID
    },
    isTypingTo: {
        type: DataTypes.STRING(36),
        allowNull: true, // ID of user they're typing to
        references: {
            model: 'users',
            key: 'id'
        }
    },
    typingStartedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'user_statuses',
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['lastSeen']
        }
    ]
});

module.exports = UserStatus;
