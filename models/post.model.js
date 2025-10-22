// models/post.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
        type: DataTypes.ENUM('job', 'product', 'service'),
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
    }
}, {
    tableName: 'posts',
    timestamps: true
});

module.exports = Post;