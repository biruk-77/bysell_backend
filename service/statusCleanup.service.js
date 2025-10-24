// service/statusCleanup.service.js

const { UserStatus } = require('../models');
const { Op } = require('sequelize');

class StatusCleanupService {
    constructor() {
        this.cleanupInterval = null;
        this.intervalDuration = 2 * 60 * 1000; // 2 minutes
    }

    start() {
        console.log('🧹 Starting status cleanup service...');
        
        // Run cleanup immediately
        this.cleanup();
        
        // Set up recurring cleanup
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.intervalDuration);
    }

    stop() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('🛑 Status cleanup service stopped');
        }
    }

    async cleanup() {
        try {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

            // Mark users as offline if they haven't been seen in the last 5 minutes
            const offlineUpdate = await UserStatus.update(
                { 
                    status: 'offline',
                    isTypingTo: null,
                    typingStartedAt: null,
                    socketId: null
                },
                {
                    where: {
                        lastSeen: {
                            [Op.lt]: fiveMinutesAgo
                        },
                        status: {
                            [Op.ne]: 'offline'
                        }
                    }
                }
            );

            // Clear typing indicators that are older than 1 minute
            const typingUpdate = await UserStatus.update(
                {
                    isTypingTo: null,
                    typingStartedAt: null
                },
                {
                    where: {
                        typingStartedAt: {
                            [Op.lt]: oneMinuteAgo
                        },
                        isTypingTo: {
                            [Op.ne]: null
                        }
                    }
                }
            );

            if (offlineUpdate[0] > 0 || typingUpdate[0] > 0) {
                console.log(`🧹 Cleanup: ${offlineUpdate[0]} users marked offline, ${typingUpdate[0]} typing indicators cleared`);
            }

        } catch (error) {
            console.error('❌ Status cleanup error:', error);
        }
    }
}

module.exports = new StatusCleanupService();
