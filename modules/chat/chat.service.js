const { Message, Conversation } = require('../../models');

class ChatService {
    // Send message
    async sendMessage(senderId, receiverId, content, messageType = 'text') {
        // Find or create conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        // Create message
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            receiverId,
            content,
            messageType
        });

        // Update conversation's last message
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Populate message
        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'username email')
            .populate('receiverId', 'username email');

        // Message sent
        return populatedMessage;
    }

    // Get conversation messages
    async getConversationMessages(conversationId, limit = 50, skip = 0) {
        return await Message.find({ conversationId })
            .populate('senderId', 'username email')
            .populate('receiverId', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip);
    }

    // Get user conversations
    async getUserConversations(userId, limit = 20, skip = 0) {
        return await Conversation.find({
            participants: userId
        })
        .populate('participants', 'username email')
        .populate('lastMessage')
        .sort({ lastMessageAt: -1 })
        .limit(limit)
        .skip(skip);
    }

    // Mark message as read
    async markMessageAsRead(messageId, userId) {
        const message = await Message.findOneAndUpdate(
            { _id: messageId, receiverId: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (message) {
            // Message marked as read
        }
        return message;
    }

    // Mark conversation messages as read
    async markConversationAsRead(conversationId, userId) {
        const result = await Message.updateMany(
            { conversationId, receiverId: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        // Conversation marked as read
        return result;
    }

    // Delete message
    async deleteMessage(messageId, userId) {
        const message = await Message.findOneAndDelete({
            _id: messageId,
            senderId: userId
        });

        if (message) {
            // Message deleted
        }
        return message;
    }

    // Get unread message count
    async getUnreadCount(userId) {
        return await Message.countDocuments({
            receiverId: userId,
            isRead: false
        });
    }
}

module.exports = new ChatService();
