/**
 * Search Controller
 * HTTP layer for OpenSearch-powered product search, filters, and suggestions.
 */
'use strict';

const { query, param } = require('express-validator');
const searchSvc        = require('../services/searchService');
const { validate }     = require('../middleware/validate');
const { success }      = require('../utils/response');

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Search and filter products (OpenSearch-backed)
 *     description: |
 *       Full-text search with dynamic attribute-level filters.
 *       Filter syntax: `filter[attrName]=value`  or  `filter[attrName][min]=N&filter[attrName][max]=N`
 *     parameters:
 *       - { in: query, name: q,          schema: { type: string },  description: "Free text search" }
 *       - { in: query, name: categoryId, schema: { type: string },  description: "Restrict to a single category" }
 *       - { in: query, name: sortBy,     schema: { type: string, enum: [relevance, price_asc, price_desc, newest] } }
 *       - { in: query, name: page,       schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,      schema: { type: integer, default: 20 } }
 *       - { in: query, name: filter,     schema: { type: object, additionalProperties: true }, style: deepObject, explode: true }
 *     responses:
 *       200:
 *         description: Search results with facets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:    { type: array }
 *                     total:       { type: integer }
 *                     page:        { type: integer }
 *                     total_pages: { type: integer }
 *                     facets:      { type: object }
 */
const searchValidation = [
  query('q').optional().trim().isLength({ max: 500 }),
  query('categoryId').optional().isMongoId(),
  query('sortBy').optional().isIn(['relevance', 'price_asc', 'price_desc', 'newest']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
];

async function searchProducts(req, res, next) {
  try {
    const q          = req.query.q          || '';
    const categoryId = req.query.categoryId || null;
    const sortBy     = req.query.sortBy     || 'relevance';
    const page       = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit      = Math.min(100, parseInt(req.query.limit || '20', 10));

    // Parse dynamic `filter` object from query string
    // Express receives ?filter[ram][min]=4&filter[color]=Black as req.query.filter
    const filters = parseFilters(req.query.filter);

    const result = await searchSvc.searchProducts({ q, categoryId, filters, page, limit, sortBy });
    return success(res, result, 'Search results');
  } catch (err) {
    return next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /search/filters/{categoryId}:
 *   get:
 *     tags: [Search]
 *     summary: Get dynamic filter options for a category
 *     description: |
 *       Returns available filter values for all filterable attributes in the category.
 *       Counts reflect the current product index only.
 *     parameters:
 *       - { in: path, name: categoryId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Array of filter objects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:    { type: string }
 *                       label:   { type: string }
 *                       type:    { type: string }
 *                       options: { type: array }
 *                       min:     { type: number }
 *                       max:     { type: number }
 */
const filterOptionsValidation = [
  param('categoryId').isMongoId().withMessage('categoryId must be a valid MongoDB ObjectId'),
  validate,
];

async function getFilterOptions(req, res, next) {
  try {
    const filters = await searchSvc.getFilterOptions(req.params.categoryId);
    return success(res, filters, 'Filter options');
  } catch (err) {
    return next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     tags: [Search]
 *     summary: Autocomplete / search suggestions
 *     parameters:
 *       - { in: query, name: q,    required: true, schema: { type: string } }
 *       - { in: query, name: size, schema: { type: integer, default: 8 } }
 *     responses:
 *       200:
 *         description: Suggestion list
 */
const suggestionsValidation = [
  query('q').trim().notEmpty().withMessage('q is required'),
  validate,
];

async function getSuggestions(req, res, next) {
  try {
    const size        = Math.min(20, parseInt(req.query.size || '8', 10));
    const suggestions = await searchSvc.getSuggestions(req.query.q, size);
    return success(res, suggestions, 'Suggestions');
  } catch (err) {
    return next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitize and normalise filter values coming from query params.
 * Input:  { ram: { min: "4", max: "16" }, color: "Black", storage: ["128GB","256GB"] }
 * Output: { ram: { min: 4, max: 16 }, color: "Black", storage: ["128GB","256GB"] }
 */
function parseFilters(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const result = {};

  for (const [key, val] of Object.entries(raw)) {
    // Sanitize key – must be alphanumeric/underscore
    if (!/^[a-z0-9_]+$/i.test(key)) continue;

    if (typeof val === 'object' && !Array.isArray(val)) {
      if ('min' in val || 'max' in val) {
        const rangeFilter = {};
        if (val.min !== undefined && val.min !== '') rangeFilter.min = Number(val.min);
        if (val.max !== undefined && val.max !== '') rangeFilter.max = Number(val.max);
        result[key] = rangeFilter;
      }
    } else if (Array.isArray(val)) {
      result[key] = val.filter((v) => typeof v === 'string' && v.length < 300);
    } else if (typeof val === 'string' && val.length < 300) {
      result[key] = val;
    }
  }
  return result;
}

module.exports = {
  searchValidation,
  searchProducts,
  filterOptionsValidation,
  getFilterOptions,
  suggestionsValidation,
  getSuggestions,
};
