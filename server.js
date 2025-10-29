require('dotenv').config();
const http = require('http');
const sequelize = require('./core/config/db');
const models = require('./models');
const createExpressApp = require('./core/app/expressApp');
const SocketManager = require('./core/socket/socketManager');
const { loadEventHandlers } = require('./core/events/eventLoader');
const { loadStatusCleanupService } = require('./core/services/statusCleanupLoader');

const app = createExpressApp();
const server = http.createServer(app);

const socketManager = new SocketManager(server);
app.set('socketManager', socketManager);

loadEventHandlers();

const PORT = process.env.PORT || 5000;
const statusCleanupService = loadStatusCleanupService();

server.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    await sequelize.sync({ alter: false });
    console.log('✅ Database tables synchronized.');

    if (statusCleanupService) {
      statusCleanupService.start();
      console.log('✅ Status cleanup service started.');
    }

    console.log(`🚀 BySell Server is running on port ${PORT}`);
    console.log(`📡 Socket.IO enabled for real-time communication`);
    console.log(`🌐 API available at http://localhost:${PORT}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
});

process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  if (statusCleanupService) {
    statusCleanupService.stop();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  if (statusCleanupService) {
    statusCleanupService.stop();
  }
  process.exit(0);
});
