/**
 * Global error-handling middleware.
 * Must be registered LAST in Express, after all routes.
 */
'use strict';

const logger = require('../utils/logger');

// Custom application error with an HTTP status code
class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {Array}  [errors]
   */
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.errors     = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handler middleware (4-argument form).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Validation errors emitted by express-validator (passed via next(err))
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  err.errors,
    });
  }

  // Known application errors
  if (err instanceof AppError) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // PostgreSQL unique-violation (23505)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with the same unique value already exists.',
      detail:  err.detail,
    });
  }

  // PostgreSQL foreign-key violation (23503)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
      detail:  err.detail,
    });
  }

  // Unexpected errors – log and return generic 500
  logger.error('[Unhandled Error]', {
    message: err.message,
    stack:   err.stack,
    path:    req.path,
    method:  req.method,
  });

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

module.exports = { errorHandler, AppError };
