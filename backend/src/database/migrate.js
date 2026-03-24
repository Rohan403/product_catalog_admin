/**
 * MongoDB index synchronisation script.
 * Connects to MongoDB and calls syncIndexes() on every Mongoose model,
 * which creates any missing indexes and drops any indexes that are no
 * longer declared in the schema.
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage:  node src/database/migrate.js
 */
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product  = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_catalog';

async function migrate() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB. Syncing indexes…');

  await Category.syncIndexes();
  console.log('  ✔ Category indexes synced');

  await Product.syncIndexes();
  console.log('  ✔ Product indexes synced');

  console.log('Migration completed successfully.');
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
