// models/index.js (or your main association file)

const User = require('./user.model');
const Profile = require('./Profile');
const Post = require('./post.model');
const Connection = require('./connection.model');
const Message = require('./message.model');
const Notification = require('./notification.model');

// --- User and Profile Relationship ---
User.hasOne(Profile, {
    foreignKey: 'userId',
    as: 'profile',
    onDelete: 'CASCADE' // Optional: if a user is deleted, their profile is also deleted
});

Profile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// --- User and Post Relationship ---
User.hasMany(Post, {
    foreignKey: 'userId',
    as: 'posts',
    onDelete: 'CASCADE' // Optional: if a user is deleted, all their posts are also deleted
});

Post.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author' // You can use 'author' or 'user' to alias the association
});

// --- User and Connection Relationships ---
// User can send many connection requests
User.hasMany(Connection, {
    foreignKey: 'requesterId',
    as: 'sentRequests',
    onDelete: 'CASCADE'
});

// User can receive many connection requests
User.hasMany(Connection, {
    foreignKey: 'receiverId',
    as: 'receivedRequests',
    onDelete: 'CASCADE'
});

// Connection belongs to requester
Connection.belongsTo(User, {
    foreignKey: 'requesterId',
    as: 'requester'
});

// Connection belongs to receiver
Connection.belongsTo(User, {
    foreignKey: 'receiverId',
    as: 'receiver'
});

// --- User and Message Relationships ---
// User can send many messages
User.hasMany(Message, {
    foreignKey: 'senderId',
    as: 'sentMessages',
    onDelete: 'CASCADE'
});

// User can receive many messages
User.hasMany(Message, {
    foreignKey: 'receiverId',
    as: 'receivedMessages',
    onDelete: 'CASCADE'
});

// Message belongs to sender
Message.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender'
});

// Message belongs to receiver
Message.belongsTo(User, {
    foreignKey: 'receiverId',
    as: 'receiver'
});

// --- User and Notification Relationships ---
// User can have many notifications
User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications',
    onDelete: 'CASCADE'
});

// Notification belongs to user
Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Notification can be from another user (optional)
User.hasMany(Notification, {
    foreignKey: 'fromUserId',
    as: 'sentNotifications',
    onDelete: 'SET NULL'
});

Notification.belongsTo(User, {
    foreignKey: 'fromUserId',
    as: 'fromUser'
});

// Fix Post relationship alias
Post.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user' // Changed from 'author' to 'user' for consistency
});

module.exports = {
    User,
    Profile,
    Post,
    Connection,
    Message,
    Notification
};