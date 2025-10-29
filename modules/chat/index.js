const chatRoutes = require('./chat.routes');
const chatController = require('./chat.controller');
const chatService = require('./chat.service');
const chatSocket = require('./chat.socket');

module.exports = {
    routes: chatRoutes,
    controller: chatController,
    service: chatService,
    socket: chatSocket
};
