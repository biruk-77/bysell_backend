// test-project/models/conversation.model.js
// models/conversation.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    participant1Id: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    participant2Id: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    lastMessageId: {
        type: DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'messages',
            key: 'id'
        }
    },
    lastActivityAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'conversations',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['participant1Id', 'participant2Id']
        },
        {
            fields: ['lastActivityAt']
        }
    ]
});

module.exports = Conversation;
