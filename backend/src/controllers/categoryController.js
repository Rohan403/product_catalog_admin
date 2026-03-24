/**
 * Category Controller
 * Handles HTTP layer for category and attribute CRUD operations.
 *
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Manage product categories
 *   - name: Attributes
 *     description: Manage category-specific attribute definitions
 */
'use strict';

const { body, param }    = require('express-validator');
const categorySvc        = require('../services/categoryService');
const { validate }       = require('../middleware/validate');
const { success, created, error } = require('../utils/response');

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
async function listCategories(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const categories      = await categorySvc.getAllCategories({ includeInactive });
    return success(res, categories, 'Categories retrieved');
  } catch (err) {
    return next(err);
  }
}

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category by ID or slug (includes attributes)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category with attributes
 *       404:
 *         description: Not found
 */
async function getCategory(req, res, next) {
  try {
    const category = await categorySvc.getCategoryByIdOrSlug(req.params.id);
    return success(res, category);
  } catch (err) {
    return next(err);
  }
}

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:        { type: string, example: "Laptops" }
 *               description: { type: string }
 *               parent_id:   { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Created category
 *       422:
 *         description: Validation error
 */
const createCategoryValidation = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('parent_id').optional({ nullable: true }).isMongoId().withMessage('parent_id must be a valid MongoDB ID'),
  validate,
];

async function createCategory(req, res, next) {
  try {
    const category = await categorySvc.createCategory(req.body);
    return created(res, category, 'Category created');
  } catch (err) {
    return next(err);
  }
}

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               description: { type: string }
 *               is_active:   { type: boolean }
 *     responses:
 *       200:
 *         description: Updated category
 */
const updateCategoryValidation = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ID'),
  body('name').optional().trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('is_active').optional().isBoolean(),
  body('parent_id').optional({ nullable: true }).isMongoId(),
  validate,
];

async function updateCategory(req, res, next) {
  try {
    const category = await categorySvc.updateCategory(req.params.id, req.body);
    return success(res, category, 'Category updated');
  } catch (err) {
    return next(err);
  }
}

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Deactivate (soft-delete) a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deactivated
 */
async function deleteCategory(req, res, next) {
  try {
    await categorySvc.deleteCategory(req.params.id);
    return success(res, null, 'Category deactivated');
  } catch (err) {
    return next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /categories/{id}/attributes:
 *   get:
 *     tags: [Attributes]
 *     summary: List attributes for a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of attribute definitions
 */
async function listAttributes(req, res, next) {
  try {
    const attrs = await categorySvc.getAttributesByCategory(req.params.id);
    return success(res, attrs, 'Attributes retrieved');
  } catch (err) {
    return next(err);
  }
}

/**
 * @swagger
 * /categories/{id}/attributes:
 *   post:
 *     tags: [Attributes]
 *     summary: Add an attribute to a category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryAttribute'
 *     responses:
 *       201:
 *         description: Created attribute
 */
const VALID_TYPES = ['text', 'number', 'select', 'multiselect', 'boolean', 'color'];

const createAttributeValidation = [
  param('id').isMongoId(),
  body('name').trim().notEmpty().withMessage('name is required').matches(/^[a-z0-9_]+$/).withMessage('name must be snake_case'),
  body('label').trim().notEmpty().withMessage('label is required'),
  body('attribute_type').isIn(VALID_TYPES).withMessage(`attribute_type must be one of: ${VALID_TYPES.join(', ')}`),
  body('unit').optional().trim(),
  body('is_required').optional().isBoolean(),
  body('is_filterable').optional().isBoolean(),
  body('is_searchable').optional().isBoolean(),
  body('options').optional().isArray().withMessage('options must be an array'),
  body('display_order').optional().isInt({ min: 0 }),
  validate,
];

async function createAttribute(req, res, next) {
  try {
    const attr = await categorySvc.createAttribute(req.params.id, req.body);
    return created(res, attr, 'Attribute created');
  } catch (err) {
    return next(err);
  }
}

/**
 * @swagger
 * /categories/{id}/attributes/{attrId}:
 *   put:
 *     tags: [Attributes]
 *     summary: Update an attribute
 */
const updateAttributeValidation = [
  param('id').isMongoId(),
  param('attrId').isMongoId(),
  body('label').optional().trim().notEmpty(),
  body('attribute_type').optional().isIn(VALID_TYPES),
  body('is_required').optional().isBoolean(),
  body('is_filterable').optional().isBoolean(),
  body('is_searchable').optional().isBoolean(),
  body('options').optional().isArray(),
  body('display_order').optional().isInt({ min: 0 }),
  validate,
];

async function updateAttribute(req, res, next) {
  try {
    const attr = await categorySvc.updateAttribute(req.params.id, req.params.attrId, req.body);
    return success(res, attr, 'Attribute updated');
  } catch (err) {
    return next(err);
  }
}

/**
 * @swagger
 * /categories/{id}/attributes/{attrId}:
 *   delete:
 *     tags: [Attributes]
 *     summary: Delete an attribute
 */
async function deleteAttribute(req, res, next) {
  try {
    await categorySvc.deleteAttribute(req.params.id, req.params.attrId);
    return success(res, null, 'Attribute deleted');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listCategories,
  getCategory,
  createCategoryValidation,
  createCategory,
  updateCategoryValidation,
  updateCategory,
  deleteCategory,
  listAttributes,
  createAttributeValidation,
  createAttribute,
  updateAttributeValidation,
  updateAttribute,
  deleteAttribute,
};
