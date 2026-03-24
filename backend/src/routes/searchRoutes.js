/**
 * Search Routes
 */
'use strict';

const express = require('express');
const ctrl    = require('../controllers/searchController');

const router = express.Router();

router.get('/',                        ctrl.searchValidation,       ctrl.searchProducts);
router.get('/suggestions',             ctrl.suggestionsValidation,  ctrl.getSuggestions);
router.get('/filters/:categoryId',     ctrl.filterOptionsValidation,ctrl.getFilterOptions);

module.exports = router;
