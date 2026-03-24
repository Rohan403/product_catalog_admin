/**
 * HTTP server entry point.
 * Starts the Express app and initialises dependent services.
 */
'use strict';

const app    = require('./app');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/database');
const { ensureProductIndex } = require('./config/opensearch');

const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  // Connect to MongoDB
  try {
    await connectDB();
  } catch (err) {
    logger.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // Ensure OpenSearch index exists (non-blocking on failure)
  await ensureProductIndex();

  const server = app.listen(PORT, () => {
    logger.info(`[Server] Running on http://localhost:${PORT}`);
    logger.info(`[Docs]   Swagger UI at http://localhost:${PORT}/api-docs`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`[Server] Received ${signal}, shutting down…`);
    server.close(async () => {
      await disconnectDB();
      logger.info('[Server] Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start();
