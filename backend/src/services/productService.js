/**
 * Product Service
 * Handles all database interactions for products and their attribute values.
 * After every create/update, the product is re-indexed in OpenSearch.
 */
'use strict';

const mongoose        = require('mongoose');
const Product         = require('../models/Product');
const Category        = require('../models/Category');
const { toSlug }      = require('../utils/slugify');
const { AppError }    = require('../middleware/errorHandler');
const searchService   = require('./searchService');

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// READ
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Paginated list of products with optional category filter.
 */
async function getProducts({ page = 1, limit = 20, categoryId, status = 'published' } = {}) {
  const filter = { is_active: true };
  if (status)     filter.status      = status;
  if (categoryId) filter.category_id = new mongoose.Types.ObjectId(categoryId);

  const offset = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category_id', 'name slug')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    products: products.map((p) => normalizeProduct(p)),
    total,
  };
}

/**
 * Fetch a single product by id or slug with all attribute values enriched.
 * @param {string} idOrSlug
 */
async function getProductByIdOrSlug(idOrSlug) {
  const isObjId = mongoose.Types.ObjectId.isValid(idOrSlug) && String(new mongoose.Types.ObjectId(idOrSlug)) === idOrSlug;
  const filter  = isObjId ? { _id: idOrSlug, is_active: true } : { slug: idOrSlug, is_active: true };

  const doc = await Product.findOne(filter).populate('category_id', 'name slug description attributes');
  if (!doc) throw new AppError('Product not found', 404);

  return normalizeProduct(doc);
}

/**
 * Convert a Mongoose Product document to a plain API-compatible object.
 * Merges attribute values with the category attribute definitions so the response
 * includes label, type, unit etc. alongside the stored value â€” same shape as
 * the previous PostgreSQL implementation.
 */
function normalizeProduct(doc) {
  const product        = doc.toJSON();
  const category       = doc.populated('category_id') ? doc.category_id : null;

  // Rename populated category_id â†’ category fields
  if (category) {
    product.category_id          = category._id ? category._id.toString() : category.id;
    product.category_name        = category.name;
    product.category_slug        = category.slug;
    product.category_description = category.description;
  }

  // Enrich attribute values with schema metadata from the category
  if (category && category.attributes) {
    const attrDefs = Object.fromEntries(
      (category.attributes || []).map((a) => [a.name, a]),
    );
    product.attributes = (product.attributes || []).map((av) => {
      const def = attrDefs[av.name] || {};
      const value = av.value_number != null ? av.value_number
                  : av.value_json   != null ? av.value_json
                  : av.value_text;
      return {
        name:         av.name,
        label:        def.label        || av.name,
        type:         def.attribute_type,
        unit:         def.unit         || null,
        is_filterable: def.is_filterable ?? true,
        display_order: def.display_order ?? 0,
        value_text:   av.value_text   || null,
        value_number: av.value_number != null ? Number(av.value_number) : null,
        value_json:   av.value_json   || null,
        value,
      };
    });
  }

  // Ensure consistent snake_case date fields regardless of Mongoose camelCase
  product.created_at = product.created_at || product.createdAt || null;
  product.updated_at = product.updated_at || product.updatedAt || null;

  return product;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// WRITE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Create a new product with its attribute values.
 * @param {object} data  â€“ see ProductInput schema
 */
async function createProduct(data) {
  const {
    category_id, name, sku = null, description = null,
    highlights = [], specifications = {}, price = 0,
    stock = 0, images = [], status = 'draft',
    attributes = [],
  } = data;

  const slug      = await generateUniqueSlug(toSlug(name));
  const attrValues = await buildAttributeValues(category_id, attributes);

  const doc = await Product.create({
    category_id, name, slug, sku, description,
    highlights, specifications, price, stock, images, status,
    attributes: attrValues,
  });

  const full = await getProductByIdOrSlug(doc._id.toString());
  searchService.indexProduct(full).catch(() => {});
  return full;
}

/**
 * Update an existing product.
 */
async function updateProduct(idOrSlug, data) {
  const existing = await getProductByIdOrSlug(idOrSlug);

  const {
    name           = existing.name,
    sku            = existing.sku,
    description    = existing.description,
    highlights     = existing.highlights,
    specifications = existing.specifications,
    price          = existing.price,
    stock          = existing.stock,
    images         = existing.images,
    status         = existing.status,
    attributes     = [],
  } = data;

  const slug      = name !== existing.name ? await generateUniqueSlug(toSlug(name), existing.id) : existing.slug;
  const attrValues = attributes.length
    ? await buildAttributeValues(existing.category_id, attributes)
    : undefined;

  const update = { name, slug, sku, description, highlights, specifications, price, stock, images, status };
  if (attrValues) update.attributes = attrValues;

  await Product.findByIdAndUpdate(existing.id, { $set: update }, { runValidators: true });

  const updated = await getProductByIdOrSlug(existing.id);
  searchService.indexProduct(updated).catch(() => {});
  return updated;
}

/**
 * Soft-delete a product.
 */
async function deleteProduct(idOrSlug) {
  const product = await getProductByIdOrSlug(idOrSlug);
  await Product.findByIdAndUpdate(product.id, { $set: { is_active: false } });
  searchService.removeProduct(product.id).catch(() => {});
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INTERNALS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Convert incoming [{name, value}] to the stored AttributeValue subdocument
 * format, routing values to the correct column based on attribute_type.
 * Only attributes defined on the category are accepted; others are silently ignored.
 */
async function buildAttributeValues(categoryId, attributes) {
  if (!attributes.length) return [];

  const category = await Category.findById(categoryId).select('attributes');
  if (!category) return [];

  const attrMap = Object.fromEntries(category.attributes.map((a) => [a.name, a]));

  return attributes
    .map(({ name, value }) => {
      const def = attrMap[name];
      if (!def) return null;  // ignore unknown attribute names

      const av = { name };
      switch (def.attribute_type) {
        case 'number':
          av.value_number = value !== null && value !== '' ? parseFloat(value) : null;
          break;
        case 'multiselect':
          av.value_json = Array.isArray(value) ? value : null;
          break;
        default:
          av.value_text = value !== null ? String(value) : null;
      }
      return av;
    })
    .filter(Boolean);
}

/**
 * Generate a slug guaranteed to be unique in the products collection.
 * Appends a numeric suffix on collision.
 */
async function generateUniqueSlug(baseSlug, excludeId = null) {
  let slug    = baseSlug;
  let counter = 0;

  while (true) {
    const filter = excludeId
      ? { slug, _id: { $ne: excludeId } }
      : { slug };

    const exists = await Product.exists(filter);
    if (!exists) return slug;
    slug = `${baseSlug}-${++counter}`;
  }
}

module.exports = {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
