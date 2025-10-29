// test-project/models/connection.model.js
 // test-project/models/connection.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../core/config/db');

const Connection = sequelize.define('Connection', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    requesterId: {
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
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true // Optional message when sending connection request
    },
    connectionType: {
        type: DataTypes.ENUM('employment', 'rental', 'service', 'marketplace', 'matchmaking', 'general'),
        allowNull: false,
        defaultValue: 'general',
        comment: 'Type of connection: employment (employer-employee), rental (renter-tenant), service (provider-customer), marketplace (buyer-seller), matchmaking (husband-wife)'
    },
    purpose: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Specific purpose or reason for the connection'
    }
}, {
    tableName: 'connections',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['requesterId', 'receiverId']
        }
    ]
});

module.exports = Connection;
