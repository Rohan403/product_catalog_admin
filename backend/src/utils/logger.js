/**
 * Centralized Winston logger.
 * Outputs JSON in production, colorized text in development.
 */
'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, colorize, simple } = format;

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProd
    ? combine(timestamp(), json())
    : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), simple()),
  transports: [new transports.Console()],
  exitOnError: false,
});

module.exports = logger;
