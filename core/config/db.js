require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

mysql2.Promise = global.Promise;

const db = new Sequelize(
  process.env.DB_NAME || 'bysell_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    define: {
      timestamps: false,
    },
    logging: false,
  }
);

(async () => {
  try {
    await db.authenticate();
    console.log('✅ Database connected successfully.');
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
})();

module.exports = db;
