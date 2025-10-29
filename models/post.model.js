// test-project/models/post.model.js
// models/post.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../core/config/db');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    postType: {
        type: DataTypes.ENUM('offer', 'request'),
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('job', 'product', 'service', 'rental_property', 'matchmaking'),
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    userId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
            model: 'users', // This should match the table name for your User model
            key: 'id'
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Price for products/services/rent'
    },
    salary: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Salary range for job posts'
    },
    propertyType: {
        type: DataTypes.ENUM('apartment', 'house', 'room', 'office', 'land', 'other'),
        allowNull: true,
        comment: 'Type of property for rental posts'
    },
    bedrooms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of bedrooms for rental properties'
    },
    bathrooms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Number of bathrooms for rental properties'
    },
    squareFeet: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Size of property in square feet'
    },
    amenities: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Amenities for rental properties (JSON string)'
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Image URLs (JSON array as string)'
    },
    tags: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Tags for better search (JSON array as string)'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether the post is currently active'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Expiration date for the post'
    }
}, {
    tableName: 'posts',
    timestamps: true
});

module.exports = Post;
