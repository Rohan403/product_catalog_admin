/**
 * MongoDB connection via Mongoose.
 * Call connectDB() once at server startup.
 */
'use strict';

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_catalog';

mongoose.connection.on('error', (err) => {
  logger.error('[DB] Mongoose connection error:', err.message);
});

async function connectDB() {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
  });
  logger.info('[DB] MongoDB connected');
}

async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('[DB] MongoDB disconnected');
}

module.exports = { connectDB, disconnectDB, mongoose };
