const notificationRoutes = require('./notification.routes');
const notificationController = require('./notification.controller');
const notificationService = require('./notification.service');
const notificationEvents = require('./notification.events');

module.exports = {
    routes: notificationRoutes,
    controller: notificationController,
    service: notificationService,
    events: notificationEvents
};
