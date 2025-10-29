const authRoutes = require('./auth.routes');
const authController = require('./auth.controller');
const otpAuthController = require('./otpAuth.controller');
const authService = require('./auth.service');
const authEvents = require('./auth.events');

module.exports = {
    routes: authRoutes,
    controller: authController,
    otpController: otpAuthController,
    service: authService,
    events: authEvents
};
