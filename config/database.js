require('dotenv').config();
const { Sequelize } = require('sequelize');
const mysql2 = require('mysql2');

// Optional: use native global Promise
mysql2.Promise = global.Promise;

// Create Sequelize instance using .env variables
const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    define: {
      timestamps: false,
    },
logging: process.env.NODE_ENV==='development'?console.log:false, // disable SQL logging
  }
);

// Test the connection
(async () => {
  try {
    await db.authenticate();
    console.log('✅ Database connected successfully.');
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
})();

module.exports = db;
