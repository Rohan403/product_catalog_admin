/**
 * Category & Attribute Routes
 */
'use strict';

const express    = require('express');
const ctrl       = require('../controllers/categoryController');

const router = express.Router();

// ── Categories ────────────────────────────────────────────────
router.get  ('/',    ctrl.listCategories);
router.get  ('/:id', ctrl.getCategory);
router.post ('/',    ctrl.createCategoryValidation, ctrl.createCategory);
router.put  ('/:id', ctrl.updateCategoryValidation, ctrl.updateCategory);
router.delete('/:id', ctrl.deleteCategory);

// ── Attributes (nested under category) ───────────────────────
router.get   ('/:id/attributes',           ctrl.listAttributes);
router.post  ('/:id/attributes',           ctrl.createAttributeValidation, ctrl.createAttribute);
router.put   ('/:id/attributes/:attrId',   ctrl.updateAttributeValidation, ctrl.updateAttribute);
router.delete('/:id/attributes/:attrId',   ctrl.deleteAttribute);

module.exports = router;
