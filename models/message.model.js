// test-project/models/message.model.js
// models/message.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    senderId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    receiverId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    messageType: {
        type: DataTypes.ENUM('text', 'image', 'file'),
        allowNull: false,
        defaultValue: 'text'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    readAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'messages',
    timestamps: true,
    indexes: [
        {
            fields: ['senderId', 'receiverId']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = Message;
