// controller/connection.controller.js

const { Connection, User } = require('../models');
const { Op } = require('sequelize');

// --- SEND CONNECTION REQUEST ---
exports.sendConnectionRequest = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { receiverId, message } = req.body;

        // Validate input
        if (!receiverId) {
            return res.status(400).json({ message: 'Receiver ID is required.' });
        }

        // Check if trying to connect to self
        if (requesterId === receiverId) {
            return res.status(400).json({ message: 'You cannot send a connection request to yourself.' });
        }

        // Check if receiver exists
        const receiver = await User.findByPk(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if connection already exists (in either direction)
        const existingConnection = await Connection.findOne({
            where: {
                [Op.or]: [
                    { requesterId, receiverId },
                    { requesterId: receiverId, receiverId: requesterId }
                ]
            }
        });

        if (existingConnection) {
            return res.status(400).json({ 
                message: 'Connection request already exists or you are already connected.' 
            });
        }

        // Create connection request
        const newConnection = await Connection.create({
            requesterId,
            receiverId,
            message: message || null,
            status: 'pending'
        });

        // Get connection with user details
        const connectionWithDetails = await Connection.findByPk(newConnection.id, {
            include: [
                {
                    model: User,
                    as: 'requester',
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'username']
                }
            ]
        });

        // Send real-time notification to receiver
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${receiverId}`).emit('connection_request_received', {
                type: 'connection_request',
                connection: connectionWithDetails,
                message: 'You have a new connection request!'
            });
        }

        res.status(201).json({
            message: 'Connection request sent successfully',
            connection: connectionWithDetails
        });
    } catch (error) {
        console.error('Send connection request error:', error);
        res.status(500).json({ message: 'Something went wrong while sending the connection request.' });
    }
};

// --- RESPOND TO CONNECTION REQUEST ---
exports.respondToConnectionRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;
        const { action } = req.body; // 'accept' or 'reject'

        // Validate input
        if (!action || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Action must be either "accept" or "reject".' });
        }

        // Find connection request
        const connection = await Connection.findByPk(connectionId);
        if (!connection) {
            return res.status(404).json({ message: 'Connection request not found.' });
        }

        // Check if user is the receiver of this request
        if (connection.receiverId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to respond to this request.' });
        }

        // Check if request is still pending
        if (connection.status !== 'pending') {
            return res.status(400).json({ message: 'This connection request has already been responded to.' });
        }

        // Update connection status
        const newStatus = action === 'accept' ? 'accepted' : 'rejected';
        await connection.update({ status: newStatus });

        // Get updated connection with user details
        const updatedConnection = await Connection.findByPk(connectionId, {
            include: [
                {
                    model: User,
                    as: 'requester',
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'username']
                }
            ]
        });

        // Send real-time notification to requester
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${connection.requesterId}`).emit('connection_request_responded', {
                type: 'connection_response',
                connection: updatedConnection,
                action: action,
                message: `Your connection request was ${action}ed!`
            });
        }

        res.status(200).json({
            message: `Connection request ${action}ed successfully`,
            connection: updatedConnection
        });
    } catch (error) {
        console.error('Respond to connection request error:', error);
        res.status(500).json({ message: 'Something went wrong while responding to the connection request.' });
    }
};

// --- GET MY CONNECTIONS (ACCEPTED) ---
exports.getMyConnections = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Connection.findAndCountAll({
            where: {
                [Op.or]: [
                    { requesterId: userId },
                    { receiverId: userId }
                ],
                status: 'accepted'
            },
            include: [
                {
                    model: User,
                    as: 'requester',
                    attributes: ['id', 'username']
                },
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'username']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['updatedAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Connections retrieved successfully',
            totalConnections: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            connections: rows
        });
    } catch (error) {
        console.error('Get connections error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving connections.' });
    }
};

// --- GET PENDING CONNECTION REQUESTS (RECEIVED) ---
exports.getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Connection.findAndCountAll({
            where: {
                receiverId: userId,
                status: 'pending'
            },
            include: [
                {
                    model: User,
                    as: 'requester',
                    attributes: ['id', 'username']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Pending requests retrieved successfully',
            totalRequests: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            requests: rows
        });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving pending requests.' });
    }
};

// --- GET SENT CONNECTION REQUESTS ---
exports.getSentRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Connection.findAndCountAll({
            where: {
                requesterId: userId
            },
            include: [
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'username']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Sent requests retrieved successfully',
            totalRequests: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            requests: rows
        });
    } catch (error) {
        console.error('Get sent requests error:', error);
        res.status(500).json({ message: 'Something went wrong while retrieving sent requests.' });
    }
};

// --- REMOVE CONNECTION ---
exports.removeConnection = async (req, res) => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;

        // Find connection
        const connection = await Connection.findByPk(connectionId);
        if (!connection) {
            return res.status(404).json({ message: 'Connection not found.' });
        }

        // Check if user is part of this connection
        if (connection.requesterId !== userId && connection.receiverId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to remove this connection.' });
        }

        // Delete connection
        await connection.destroy();

        res.status(200).json({ message: 'Connection removed successfully.' });
    } catch (error) {
        console.error('Remove connection error:', error);
        res.status(500).json({ message: 'Something went wrong while removing the connection.' });
    }
};
