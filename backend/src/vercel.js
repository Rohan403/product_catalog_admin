/**
 * Vercel serverless entry point.
 * Exports the Express app as a handler instead of calling app.listen().
 * MongoDB connection is cached across warm invocations.
 * OpenSearch init is best-effort — failure does not block HTTP requests.
 */
'use strict';

require('dotenv').config();

const app                    = require('./app');
const { connectDB, mongoose } = require('./config/database');
const { ensureProductIndex } = require('./config/opensearch');

let initialised = false;

async function init() {
  if (initialised && mongoose.connection.readyState === 1) return;

  // MongoDB is required — let this throw so Vercel surfaces the real error.
  await connectDB();

  // OpenSearch is optional for most routes; log but don't crash.
  try {
    await ensureProductIndex();
  } catch (err) {
    console.warn('[vercel] OpenSearch init skipped:', err.message);
  }

  initialised = true;
}

module.exports = async (req, res) => {
  try {
    await init();
  } catch (err) {
    console.error('[vercel] init failed:', err.message);
    return res.status(500).json({ success: false, message: 'Service unavailable — check environment variables.' });
  }
  return app(req, res);
};
