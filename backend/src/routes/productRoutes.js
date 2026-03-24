/**
 * Product Routes
 */
'use strict';

const express = require('express');
const ctrl    = require('../controllers/productController');

const router = express.Router();

router.get   ('/',    ctrl.listProducts);
router.get   ('/:id', ctrl.getProduct);
router.post  ('/',    ctrl.createProductValidation, ctrl.createProduct);
router.put   ('/:id', ctrl.updateProductValidation, ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
