// test-project/models/otp.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OTP = sequelize.define('OTP', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Normalized phone number with country code'
    },
    hashedSecret: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Hashed TOTP secret'
    },
    expiresAt: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: 'Expiration timestamp in milliseconds'
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Number of verification attempts'
    },
    status: {
        type: DataTypes.ENUM('pending', 'verified', 'expired', 'locked'),
        defaultValue: 'pending',
        allowNull: false
    },
    referenceType: {
        type: DataTypes.ENUM('Tenant', 'User'),
        allowNull: false,
        comment: 'Model type this OTP is for'
    },
    referenceId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        comment: 'ID of the Tenant or User'
    }
}, {
    tableName: 'otps',
    timestamps: true,
    indexes: [
        {
            fields: ['phone']
        },
        {
            fields: ['referenceType', 'referenceId']
        },
        {
            fields: ['status']
        },
        {
            fields: ['expiresAt']
        }
    ]
});

module.exports = OTP;
