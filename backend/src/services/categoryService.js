/**
 * Category & Attribute Service
 * All database interactions for categories and their embedded attributes live here.
 */
'use strict';

const mongoose        = require('mongoose');
const Category        = require('../models/Category');
const Product         = require('../models/Product');
const { toSlug }      = require('../utils/slugify');
const { AppError }    = require('../middleware/errorHandler');

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function isObjectId(val) {
  return mongoose.Types.ObjectId.isValid(val) && String(new mongoose.Types.ObjectId(val)) === val;
}

/** Convert a Mongoose doc to a plain object with id (string) instead of _id */
function toPlain(doc) {
  return doc ? doc.toJSON() : null;
}

/**
 * Enrich categories with a product_count field.
 * @param {object[]} categories â€“ plain objects (already toJSON'd)
 */
async function withProductCounts(categories) {
  if (!categories.length) return categories;
  const ids    = categories.map((c) => c.id);
  const counts = await Product.aggregate([
    { $match: { category_id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) }, is_active: true } },
    { $group: { _id: '$category_id', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  return categories.map((c) => ({ ...c, product_count: countMap[c.id] || 0 }));
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CATEGORIES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Return all active categories.
 * @param {{ includeInactive?: boolean }} options
 */
async function getAllCategories({ includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { is_active: true };
  const docs   = await Category.find(filter).sort({ name: 1 });
  const cats   = docs.map(toPlain);
  return withProductCounts(cats);
}

/**
 * Find a category by ObjectId or slug, including its embedded attributes.
 * @param {string} idOrSlug
 */
async function getCategoryByIdOrSlug(idOrSlug) {
  const filter = isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const doc    = await Category.findOne(filter);
  if (!doc) throw new AppError('Category not found', 404);

  const cat    = toPlain(doc);
  const [enriched] = await withProductCounts([cat]);
  return enriched;
}

/**
 * Create a new category.
 * @param {{ name: string, description?: string, parent_id?: string }} data
 */
async function createCategory(data) {
  const { name, description = null, parent_id = null } = data;
  const slug = toSlug(name);

  const doc = await Category.create({ name, slug, description, parent_id });
  return toPlain(doc);
}

/**
 * Update an existing category.
 * @param {string} id
 * @param {{ name?: string, description?: string, parent_id?: string, is_active?: boolean }} data
 */
async function updateCategory(id, data) {
  const existing = await getCategoryByIdOrSlug(id);

  const update = {
    name:        data.name        ?? existing.name,
    description: data.description ?? existing.description,
    parent_id:   data.parent_id   !== undefined ? data.parent_id : existing.parent_id,
    is_active:   data.is_active   !== undefined ? data.is_active : existing.is_active,
    slug:        data.name ? toSlug(data.name) : existing.slug,
  };

  const doc = await Category.findByIdAndUpdate(existing.id, { $set: update }, { new: true, runValidators: true });
  if (!doc) throw new AppError('Category not found', 404);
  return toPlain(doc);
}

/**
 * Soft-delete (deactivate) a category.
 * @param {string} id
 */
async function deleteCategory(id) {
  const filter = isObjectId(id) ? { _id: id } : { slug: id };
  const result = await Category.findOneAndUpdate(filter, { $set: { is_active: false } });
  if (!result) throw new AppError('Category not found', 404);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ATTRIBUTES  (embedded in the Category document)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Return all attributes for a given category, ordered by display_order.
 * @param {string} categoryId
 */
async function getAttributesByCategory(categoryId) {
  const filter = isObjectId(categoryId) ? { _id: categoryId } : { slug: categoryId };
  const doc    = await Category.findOne(filter);
  if (!doc) throw new AppError('Category not found', 404);

  return doc.toJSON().attributes.sort((a, b) => a.display_order - b.display_order);
}

/**
 * Add an attribute to a category.
 */
async function createAttribute(categoryId, data) {
  const {
    name, label, attribute_type,
    unit             = null,
    is_required      = false,
    is_filterable    = true,
    is_searchable    = true,
    options          = null,
    validation_rules = null,
    display_order    = 0,
  } = data;

  const doc = await Category.findById(categoryId);
  if (!doc) throw new AppError('Category not found', 404);

  // Enforce uniqueness of attribute name within the category
  if (doc.attributes.some((a) => a.name === name)) {
    throw new AppError(`Attribute "${name}" already exists in this category`, 409);
  }

  doc.attributes.push({ name, label, attribute_type, unit, is_required, is_filterable, is_searchable, options, validation_rules, display_order });
  await doc.save();

  const saved = doc.attributes[doc.attributes.length - 1];
  return { ...saved.toJSON(), category_id: categoryId };
}

/**
 * Update an attribute definition.
 */
async function updateAttribute(categoryId, attrId, data) {
  const doc = await Category.findById(categoryId);
  if (!doc) throw new AppError('Category not found', 404);

  const attr = doc.attributes.id(attrId);
  if (!attr) throw new AppError('Attribute not found', 404);

  const updatableFields = ['label', 'attribute_type', 'unit', 'is_required', 'is_filterable', 'is_searchable', 'options', 'validation_rules', 'display_order'];
  for (const field of updatableFields) {
    if (data[field] !== undefined) attr[field] = data[field];
  }

  await doc.save();
  return { ...attr.toJSON(), category_id: categoryId };
}

/**
 * Delete an attribute definition.
 * Products that stored a value for this attribute keep the raw value but it becomes
 * unreferenced â€” callers may choose to clean up product attribute values separately.
 */
async function deleteAttribute(categoryId, attrId) {
  const doc = await Category.findById(categoryId);
  if (!doc) throw new AppError('Category not found', 404);

  const before = doc.attributes.length;
  doc.attributes.pull({ _id: attrId });
  if (doc.attributes.length === before) throw new AppError('Attribute not found', 404);

  await doc.save();
}

module.exports = {
  getAllCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getAttributesByCategory,
  createAttribute,
  updateAttribute,
  deleteAttribute,
};

