// test-project/models/review.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    reviewerId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    reviewedUserId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    connectionId: {
        type: DataTypes.STRING(36),
        allowNull: true,
        references: {
            model: 'connections',
            key: 'id'
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reviewType: {
        type: DataTypes.ENUM('employment', 'rental', 'service', 'marketplace', 'matchmaking'),
        allowNull: false
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this review is from a verified transaction'
    }
}, {
    tableName: 'reviews',
    timestamps: true,
    indexes: [
        {
            fields: ['reviewerId', 'reviewedUserId']
        },
        {
            fields: ['reviewedUserId']
        },
        {
            fields: ['connectionId']
        }
    ]
});

module.exports = Review;
