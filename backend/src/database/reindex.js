/**
 * Reindex all products from MongoDB into OpenSearch.
 * Deletes the existing index (wrong auto-inferred mapping) and recreates
 * it with the correct schema, then bulk-indexes all active products.
 *
 * Usage: node src/database/reindex.js
 */
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const Category = require('../models/Category');
const { client: osClient, INDEX_PRODUCTS, ensureProductIndex } = require('../config/opensearch');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_catalog';

async function reindex() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB.');

  // 1. Drop existing index (stale/wrong mapping)
  try {
    const exists = await osClient.indices.exists({ index: INDEX_PRODUCTS });
    if (exists.body) {
      await osClient.indices.delete({ index: INDEX_PRODUCTS });
      console.log(`Deleted index "${INDEX_PRODUCTS}".`);
    }
  } catch (err) {
    console.warn('Could not delete index:', err.message);
  }

  // 2. Recreate with correct mapping
  await ensureProductIndex();
  console.log(`Index "${INDEX_PRODUCTS}" recreated with correct mapping.`);

  // 3. Fetch all products and build category lookup
  const products   = await Product.find({}).lean();
  const categories = await Category.find({}).lean();
  const catMap     = Object.fromEntries(categories.map((c) => [String(c._id), c]));

  if (!products.length) {
    console.log('No products found in MongoDB. Nothing to index.');
    return;
  }

  // 4. Build OpenSearch bulk body
  const bulkBody = [];
  for (const product of products) {
    const cat = catMap[String(product.category_id)] || {};

    // Build normalised attribute list (merge attr defs + values)
    const attrDefs = cat.attributes || [];
    const attrVals = product.attributes || [];
    const attributes = attrVals.map((av) => {
      const def    = attrDefs.find((d) => d.name === av.name) || {};
      return {
        name:         av.name,
        label:        def.label        || av.name,
        type:         def.attribute_type || 'text',
        value_text:   av.value_text   || null,
        value_number: av.value_number != null ? Number(av.value_number) : null,
      };
    });

    const doc = {
      id:            String(product._id),
      name:          product.name,
      slug:          product.slug,
      sku:           product.sku           || null,
      description:   product.description  || '',
      category_id:   String(product.category_id),
      category_name: cat.name             || '',
      category_slug: cat.slug             || '',
      price:         parseFloat(product.price),
      stock:         product.stock        || 0,
      status:        product.status,
      is_active:     product.is_active    !== false,
      highlights:    product.highlights   || [],
      created_at:    product.createdAt    || null,
      updated_at:    product.updatedAt    || null,
      attributes,
    };

    bulkBody.push({ index: { _index: INDEX_PRODUCTS, _id: doc.id } });
    bulkBody.push(doc);
  }

  const response = await osClient.bulk({ body: bulkBody, refresh: true });
  const errors   = (response.body.items || []).filter((i) => i.index?.error);

  console.log(`Indexed ${products.length - errors.length}/${products.length} products.`);
  if (errors.length) {
    console.error('Errors:', JSON.stringify(errors, null, 2));
  } else {
    console.log('Reindex completed successfully.');
  }
}

reindex()
  .catch((err) => { console.error('Reindex failed:', err); process.exit(1); })
  .finally(() => mongoose.disconnect());
