// test-project/models/user.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for phone-only registration
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('employer', 'employee', 'buyer', 'seller', 'connector', 'reviewer', 'admin', 'service_provider', 'customer', 'renter', 'tenant', 'husband', 'wife'),
        allowNull: false,
        defaultValue: 'employee',
        validate: {
            isIn: [['employer', 'employee', 'buyer', 'seller', 'connector', 'reviewer', 'admin', 'service_provider', 'customer', 'renter', 'tenant', 'husband', 'wife']]
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
        defaultValue: 'active',
        allowNull: false
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isNumeric: true
        }
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    }
    
},
 {
    tableName: 'users',
    timestamps: true,
});

module.exports = User;
