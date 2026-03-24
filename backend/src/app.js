/**
 * Express application factory.
 * Exported separately from server.js to allow testing without starting the HTTP server.
 */
'use strict';

require('dotenv').config();

const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const compression    = require('compression');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');
const swaggerUi      = require('swagger-ui-express');
const swaggerSpec    = require('./config/swagger');
const apiRoutes      = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler');
const logger         = require('./utils/logger');

const app = express();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

const corsOptions = {
  origin:      process.env.CORS_ORIGIN || 'http://localhost:5173' || '*',
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// ── Request Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(compression());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max:      parseInt(process.env.RATE_LIMIT_MAX       || '200',    10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── API Documentation ─────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Product Catalog API Docs',
  swaggerOptions:  { persistAuthorization: true },
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.path}` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
