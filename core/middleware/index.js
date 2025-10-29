const authMiddleware = require('./authMiddleware');
const errorHandler = require('./errorHandler');
const upload = require('./upload');
const roleAuth = require('./roleAuth');
const security = require('./security');

module.exports = {
    authMiddleware,
    errorHandler,
    upload,
    ...upload,
    ...roleAuth,
    ...security
};
