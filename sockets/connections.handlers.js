// Backend connections socket handlers
const { Connection, User } = require('../models');
const { Op } = require('sequelize');

module.exports = (socket, io, connectedUsers) => {
    
    // Handle connection requests via socket
    socket.on('send_connection_request', async (data, callback) => {
        try {
            const { receiverId, message } = data;
            
            if (!receiverId) {
                const error = { 
                    success: false, 
                    message: 'receiverId is required' 
                };
                console.log(`❌ Connection request failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Prevent self-connection
            if (socket.userId === receiverId) {
                const error = { 
                    success: false, 
                    message: 'You cannot send a connection request to yourself' 
                };
                console.log(`❌ Connection request failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Check if receiver exists
            const receiver = await User.findByPk(receiverId);
            if (!receiver) {
                const error = { 
                    success: false, 
                    message: 'User not found' 
                };
                console.log(`❌ Connection request failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Check if connection already exists
            const existingConnection = await Connection.findOne({
                where: {
                    [Op.or]: [
                        { requesterId: socket.userId, receiverId },
                        { requesterId: receiverId, receiverId: socket.userId }
                    ]
                }
            });

            if (existingConnection) {
                const error = { 
                    success: false, 
                    message: 'Connection request already exists or you are already connected' 
                };
                console.log(`❌ Connection request failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Create connection request
            const newConnection = await Connection.create({
                requesterId: socket.userId,
                receiverId,
                message: message || 'Hi! I would like to connect with you.',
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
            io.to(`user_${receiverId}`).emit('connection_request_received', {
                type: 'connection_request',
                connection: connectionWithDetails,
                message: `${socket.username} sent you a connection request!`
            });

            console.log(`🤝 Connection request sent from ${socket.username} to ${receiverId}`);

            const success = {
                success: true,
                message: 'Connection request sent successfully',
                connection: connectionWithDetails
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to send connection request',
                error: error.message 
            };
            console.log(`❌ Connection request error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Handle connection response via socket
    socket.on('respond_connection_request', async (data, callback) => {
        try {
            const { connectionId, action } = data; // action: 'accept' or 'reject'
            
            if (!connectionId || !action) {
                const error = { 
                    success: false, 
                    message: 'connectionId and action are required' 
                };
                console.log(`❌ Connection response failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            if (!['accept', 'reject'].includes(action)) {
                const error = { 
                    success: false, 
                    message: 'action must be either "accept" or "reject"' 
                };
                console.log(`❌ Connection response failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Find connection request
            const connection = await Connection.findByPk(connectionId);
            if (!connection) {
                const error = { 
                    success: false, 
                    message: 'Connection request not found' 
                };
                console.log(`❌ Connection response failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Check if user is the receiver
            if (connection.receiverId !== socket.userId) {
                const error = { 
                    success: false, 
                    message: 'You are not authorized to respond to this request' 
                };
                console.log(`❌ Connection response failed: ${error.message}`);
                return callback ? callback(error) : null;
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
            io.to(`user_${connection.requesterId}`).emit('connection_request_responded', {
                type: 'connection_response',
                connection: updatedConnection,
                action: action,
                message: `${socket.username} ${action}ed your connection request!`
            });

            console.log(`🤝 Connection request ${action}ed by ${socket.username}`);

            const success = {
                success: true,
                message: `Connection request ${action}ed successfully`,
                connection: updatedConnection
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to respond to connection request',
                error: error.message 
            };
            console.log(`❌ Connection response error:`, error);
            if (callback) callback(errorResponse);
        }
    });

    // Handle connection cancellation
    socket.on('cancel_connection_request', async (data, callback) => {
        try {
            const { connectionId } = data;
            
            if (!connectionId) {
                const error = { 
                    success: false, 
                    message: 'connectionId is required' 
                };
                console.log(`❌ Connection cancellation failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Find connection request
            const connection = await Connection.findByPk(connectionId);
            if (!connection) {
                const error = { 
                    success: false, 
                    message: 'Connection request not found' 
                };
                console.log(`❌ Connection cancellation failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Check if user is the requester
            if (connection.requesterId !== socket.userId) {
                const error = { 
                    success: false, 
                    message: 'You can only cancel your own connection requests' 
                };
                console.log(`❌ Connection cancellation failed: ${error.message}`);
                return callback ? callback(error) : null;
            }

            // Delete the connection request
            await connection.destroy();

            // Notify the receiver that the request was cancelled
            io.to(`user_${connection.receiverId}`).emit('connection_request_cancelled', {
                type: 'connection_cancelled',
                connectionId: connectionId,
                message: `${socket.username} cancelled their connection request`
            });

            console.log(`❌ Connection request cancelled by ${socket.username}`);

            const success = {
                success: true,
                message: 'Connection request cancelled successfully',
                connectionId: connectionId
            };

            if (callback) callback(success);
        } catch (error) {
            const errorResponse = { 
                success: false, 
                message: 'Failed to cancel connection request',
                error: error.message 
            };
            console.log(`❌ Connection cancellation error:`, error);
            if (callback) callback(errorResponse);
        }
    });
};
