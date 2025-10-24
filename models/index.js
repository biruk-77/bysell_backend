// models/index.js (or your main association file)

const User = require('./user.model');
const Profile = require('./Profile');
const Post = require('./post.model');
const Connection = require('./connection.model');
const Message = require('./message.model');
const Notification = require('./notification.model');
const Conversation = require('./conversation.model');
const UserStatus = require('./userStatus.model');

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

// --- Conversation Relationships ---
// Conversation belongs to two participants
Conversation.belongsTo(User, {
    foreignKey: 'participant1Id',
    as: 'participant1'
});

Conversation.belongsTo(User, {
    foreignKey: 'participant2Id',
    as: 'participant2'
});

// Conversation belongs to last message
Conversation.belongsTo(Message, {
    foreignKey: 'lastMessageId',
    as: 'lastMessage'
});

// User can have many conversations as participant1
User.hasMany(Conversation, {
    foreignKey: 'participant1Id',
    as: 'conversationsAsParticipant1'
});

// User can have many conversations as participant2
User.hasMany(Conversation, {
    foreignKey: 'participant2Id',
    as: 'conversationsAsParticipant2'
});

// Message can be the last message of a conversation
Message.hasOne(Conversation, {
    foreignKey: 'lastMessageId',
    as: 'conversationAsLastMessage'
});

// --- UserStatus Relationships ---
// User has one status
User.hasOne(UserStatus, {
    foreignKey: 'userId',
    as: 'userStatus',
    onDelete: 'CASCADE'
});

// UserStatus belongs to user
UserStatus.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// UserStatus can reference another user (typing to)
UserStatus.belongsTo(User, {
    foreignKey: 'isTypingTo',
    as: 'typingToUser'
});

module.exports = {
    User,
    Profile,
    Post,
    Connection,
    Message,
    Notification,
    Conversation,
    UserStatus
};