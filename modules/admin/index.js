const adminRoutes = require('./admin.routes');
const adminController = require('./admin.controller');
const adminService = require('./admin.service');

module.exports = {
    routes: adminRoutes,
    controller: adminController,
    service: adminService
};
