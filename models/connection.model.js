 // models/connection.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
