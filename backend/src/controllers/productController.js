/**
 * Product Controller
 * HTTP layer for product CRUD operations.
 */
'use strict';

const { body, param, query } = require('express-validator');
const productSvc             = require('../services/productService');
const { validate }           = require('../middleware/validate');
const { success, created, paginate } = require('../utils/response');

// ─────────────────────────────────────────────────────────────────────────────
// LIST / GET
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List products (paginated)
 *     parameters:
 *       - { in: query, name: page,       schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,      schema: { type: integer, default: 20 } }
 *       - { in: query, name: categoryId, schema: { type: string } }
 *       - { in: query, name: status,     schema: { type: string, enum: [draft, published, archived] } }
 *     responses:
 *       200:
 *         description: Paginated product list
 */
async function listProducts(req, res, next) {
  try {
    const page       = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit      = Math.min(100, parseInt(req.query.limit || '20', 10));
    const categoryId = req.query.categoryId || null;
    const status     = req.query.status     || null;

    const { products, total } = await productSvc.getProducts({ page, limit, categoryId, status });
    return success(res, products, 'Products retrieved', 200, paginate(total, page, limit));
  } catch (err) {
    return next(err);
  }
}

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID or slug (includes attributes)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Product detail
 *       404:
 *         description: Not found
 */
async function getProduct(req, res, next) {
  try {
    const product = await productSvc.getProductByIdOrSlug(req.params.id);
    return success(res, product);
  } catch (err) {
    return next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category_id, name, price]
 *             properties:
 *               category_id:    { type: string, format: uuid }
 *               name:           { type: string }
 *               sku:            { type: string }
 *               description:    { type: string }
 *               highlights:     { type: array, items: { type: string } }
 *               specifications: { type: object }
 *               price:          { type: number }
 *               stock:          { type: integer }
 *               images:         { type: array, items: { type: string } }
 *               status:         { type: string, enum: [draft, published, archived] }
 *               attributes:
 *                 type: array
 *                 description: Category-specific attribute values
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:  { type: string, description: "Attribute name from category definition" }
 *                     value: { description: "Value (type depends on attribute_type)" }
 *     responses:
 *       201:
 *         description: Created product
 */
const createProductValidation = [
  body('category_id').isMongoId().withMessage('category_id must be a valid MongoDB ID'),
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 500 }),
  body('sku').optional().trim().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('highlights').optional().isArray(),
  body('specifications').optional().isObject(),
  body('price').isFloat({ min: 0 }).withMessage('price must be a non-negative number'),
  body('stock').optional().isInt({ min: 0 }),
  body('images').optional().isArray(),
  body('images.*').optional().isURL({ require_tld: false, require_protocol: false }).withMessage('Each image must be a valid URL'),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('attributes').optional().isArray(),
  body('attributes.*.name').optional().notEmpty(),
  validate,
];

async function createProduct(req, res, next) {
  try {
    const product = await productSvc.createProduct(req.body);
    return created(res, product, 'Product created');
  } catch (err) {
    return next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 */
const updateProductValidation = [
  param('id').notEmpty(),
  body('name').optional().trim().notEmpty().isLength({ max: 500 }),
  body('price').optional().isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('images.*').optional().isURL(),
  validate,
];

async function updateProduct(req, res, next) {
  try {
    const product = await productSvc.updateProduct(req.params.id, req.body);
    return success(res, product, 'Product updated');
  } catch (err) {
    return next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Deactivate (soft-delete) a product
 */
async function deleteProduct(req, res, next) {
  try {
    await productSvc.deleteProduct(req.params.id);
    return success(res, null, 'Product deactivated');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProductValidation,
  createProduct,
  updateProductValidation,
  updateProduct,
  deleteProduct,
};
