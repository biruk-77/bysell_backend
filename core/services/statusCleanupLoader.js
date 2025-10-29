function loadStatusCleanupService() {
    let statusCleanupService;
    try {
        statusCleanupService = require('../../service/statusCleanup.service');
        return statusCleanupService;
    } catch (error) {
        console.warn('Status cleanup service not found, skipping...');
        return null;
    }
}

module.exports = { loadStatusCleanupService };
