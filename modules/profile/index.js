const profileRoutes = require('./profile.routes');
const profileController = require('./profile.controller');
const profileService = require('./profile.service');

module.exports = {
    routes: profileRoutes,
    controller: profileController,
    service: profileService
};
