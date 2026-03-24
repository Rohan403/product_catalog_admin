/**
 * Uniform API response helpers.
 */
'use strict';

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {object|Array} data
 * @param {string} [message]
 * @param {number} [statusCode=200]
 * @param {object} [meta]  – pagination or extra metadata
 */
function success(res, data, message = 'Success', statusCode = 200, meta = undefined) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * Send a created (201) response.
 */
function created(res, data, message = 'Created successfully') {
  return success(res, data, message, 201);
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {Array}  [errors]
 */
function error(res, message, statusCode = 500, errors = undefined) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * Build pagination metadata from a query result.
 */
function paginate(total, page, limit) {
  return {
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
}

module.exports = { success, created, error, paginate };
