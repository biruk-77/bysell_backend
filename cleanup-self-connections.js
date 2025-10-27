// cleanup-self-connections.js
// Run this script to clean up any existing self-connections in the database

const { Connection, Message } = require('./models');
const { Op } = require('sequelize');

async function cleanupSelfConnections() {
    try {
        console.log('🧹 Starting cleanup of self-connections...');

        // Remove self-connections
        const deletedConnections = await Connection.destroy({
            where: {
                [Op.and]: [
                    { requesterId: { [Op.col]: 'receiverId' } }
                ]
            }
        });

        console.log(`✅ Deleted ${deletedConnections} self-connections`);

        // Remove self-messages
        const deletedMessages = await Message.destroy({
            where: {
                [Op.and]: [
                    { senderId: { [Op.col]: 'receiverId' } }
                ]
            }
        });

        console.log(`✅ Deleted ${deletedMessages} self-messages`);

        console.log('🎉 Cleanup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupSelfConnections();
