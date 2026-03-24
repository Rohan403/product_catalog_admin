/**
 * Root API Router
 * Mounts all route groups under /api
 */
'use strict';

const express         = require('express');
const categoryRoutes  = require('./categoryRoutes');
const productRoutes   = require('./productRoutes');
const searchRoutes    = require('./searchRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/categories', categoryRoutes);
router.use('/products',   productRoutes);
router.use('/search',     searchRoutes);

module.exports = router;
