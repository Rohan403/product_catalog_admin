/**
 * Validation middleware factory.
 * Wraps express-validator's validationResult into a standardised error object.
 */
'use strict';

const { validationResult } = require('express-validator');

/**
 * Checks for validation errors produced by preceding express-validator chains.
 * If errors exist, calls next() with a typed error so errorHandler can format it.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const err    = new Error('Validation failed');
  err.type     = 'validation';
  err.errors   = result.array().map(({ path, msg, value }) => ({ field: path, message: msg, value }));
  return next(err);
}

module.exports = { validate };
