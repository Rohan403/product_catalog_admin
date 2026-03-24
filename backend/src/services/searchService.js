/**
 * Search Service
 * All OpenSearch interactions: indexing, full-text search, dynamic filters.
 */
'use strict';

const mongoose = require('mongoose');
const Category = require('../models/Category');
const { client: osClient, INDEX_PRODUCTS, ensureProductIndex } = require('../config/opensearch');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ─────────────────────────────────────────────────────────────────────────────
// INDEXING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Index (create or update) a single product document in OpenSearch.
 * Product must already have .attributes populated.
 * @param {object} product
 */
async function indexProduct(product) {
  try {
    await ensureProductIndex();
    const doc = buildDocument(product);
    await osClient.index({
      index:   INDEX_PRODUCTS,
      id:      product.id,
      body:    doc,
      refresh: 'wait_for',
    });
    logger.debug(`[Search] Indexed product ${product.id}`);
  } catch (err) {
    logger.warn(`[Search] Failed to index product ${product.id}: ${err.message}`);
  }
}

/**
 * Remove a product from the index.
 * @param {string} productId
 */
async function removeProduct(productId) {
  try {
    await osClient.delete({ index: INDEX_PRODUCTS, id: productId });
    logger.debug(`[Search] Removed product ${productId} from index`);
  } catch (err) {
    if (err.meta?.statusCode !== 404) {
      logger.warn(`[Search] Failed to delete product ${productId}: ${err.message}`);
    }
  }
}

/**
 * Convert a product record into an OpenSearch document.
 */
function buildDocument(product) {
  const attributes = (product.attributes || []).map((attr) => ({
    name:         attr.name,
    label:        attr.label,
    type:         attr.type,
    value_text:   attr.value_text   || null,
    value_number: attr.value_number != null ? Number(attr.value_number) : null,
  }));

  return {
    id:            product.id,
    name:          product.name,
    slug:          product.slug,
    sku:           product.sku,
    description:   product.description,
    category_id:   product.category_id,
    category_name: product.category_name,
    category_slug: product.category_slug,
    price:         parseFloat(product.price),
    stock:         product.stock,
    status:        product.status,
    is_active:     product.is_active,
    highlights:    product.highlights || [],
    created_at:    product.createdAt  || product.created_at  || null,
    updated_at:    product.updatedAt  || product.updated_at  || null,
    attributes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-text + filter search against OpenSearch.
 *
 * @param {object} params
 * @param {string}  [params.q]           – free-text query
 * @param {string}  [params.categoryId]  – restrict to one category
 * @param {object}  [params.filters]     – { attrName: value | [values] | { min, max } }
 * @param {number}  [params.page]
 * @param {number}  [params.limit]
 * @param {string}  [params.sortBy]      – price_asc | price_desc | newest | relevance
 */
async function searchProducts({
  q          = '',
  categoryId = null,
  filters    = {},
  page       = 1,
  limit      = 20,
  sortBy     = 'relevance',
} = {}) {
  try {
    return await searchProductsOpenSearch({ q, categoryId, filters, page, limit, sortBy });
  } catch (err) {
    logger.warn(`[Search] OpenSearch unavailable, falling back to MongoDB: ${err.message}`);
    return searchProductsMongo({ q, categoryId, page, limit, sortBy });
  }
}

async function searchProductsOpenSearch({
  q          = '',
  categoryId = null,
  filters    = {},
  page       = 1,
  limit      = 20,
  sortBy     = 'relevance',
} = {}) {
  const from  = (page - 1) * limit;
  const musts = [{ term: { is_active: true } }, { term: { status: 'published' } }];

  // ── Category filter ──────────────────────────────────────────────
  if (categoryId) {
    musts.push({ term: { category_id: categoryId } });
  }

  // ── Full-text query ──────────────────────────────────────────────
  if (q && q.trim()) {
    musts.push({
      multi_match: {
        query:    q.trim(),
        fields:   ['name^3', 'description', 'highlights^2'],
        type:     'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  // ── Attribute filters ────────────────────────────────────────────
  const nestedFilters = buildNestedAttributeFilters(filters);
  for (const nf of nestedFilters) {
    musts.push(nf);
  }

  // ── Sorting ──────────────────────────────────────────────────────
  const sort = resolveSortClause(sortBy, q);

  // ── Aggregations (facets) ────────────────────────────────────────
  const aggs = {
    category_buckets: {
      terms: { field: 'category_name', size: 20 },
    },
    price_stats: {
      stats: { field: 'price' },
    },
  };

  const body = {
    from,
    size: limit,
    query: { bool: { must: musts } },
    sort,
    aggs,
    highlight: {
      fields: {
        name:        { number_of_fragments: 0 },
        description: { fragment_size: 150, number_of_fragments: 2 },
      },
    },
  };

  const response = await osClient.search({ index: INDEX_PRODUCTS, body });
  return formatSearchResponse(response.body, page, limit);
}

/**
 * MongoDB fallback for product search when OpenSearch is unavailable.
 */
async function searchProductsMongo({ q, categoryId, page, limit, sortBy }) {
  const Product = require('../models/Product');
  const mongoQuery = { status: 'published', is_active: true };
  if (categoryId) mongoQuery.category_id = categoryId;
  if (q && q.trim()) {
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    mongoQuery.$or = [{ name: regex }, { description: regex }];
  }

  const sortMap = {
    price_asc:  { price:  1 },
    price_desc: { price: -1 },
    newest:     { createdAt: -1 },
    relevance:  { createdAt: -1 },
  };
  const mongoSort = sortMap[sortBy] || { createdAt: -1 };
  const skip  = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(mongoQuery).sort(mongoSort).skip(skip).limit(limit).lean(),
    Product.countDocuments(mongoQuery),
  ]);

  return {
    products:    products.map((p) => ({ ...p, id: p._id.toString() })),
    total,
    page,
    total_pages: Math.ceil(total / limit),
    facets:      {},
  };
}

// DYNAMIC FILTERS  (for the filter sidebar)

/**
 * Build dynamic filter options for a given category.
 * Returns attribute definitions enriched with available values from the index.
 *
 * @param {string} categoryId
 */
async function getFilterOptions(categoryId) {
  // Step 1: fetch filterable attributes from MongoDB (embedded in Category)
  const category = await Category.findById(categoryId);
  if (!category) return [];

  const attrs = category.toJSON().attributes
    .filter((a) => a.is_filterable)
    .sort((a, b) => a.display_order - b.display_order)
    .map((a) => ({ ...a, category_name: category.name }));
  if (!attrs.length) return [];

  try {
    // Step 2: for each attribute, get available value counts from OpenSearch
    const filterOptions = await Promise.all(
      attrs.map((attr) => resolveFilterOption(attr, categoryId)),
    );
    return filterOptions.filter(Boolean);
  } catch (err) {
    logger.warn(`[Search] OpenSearch unavailable for filters, returning attribute definitions: ${err.message}`);
    // Fallback: return attribute definitions with options from the category schema
    return attrs.map((attr) => ({
      name:           attr.name,
      label:          attr.label,
      attribute_type: attr.attribute_type,
      unit:           attr.unit,
      options:        attr.options || [],
    }));
  }
}

/**
 * Resolve individual filter option (buckets or range) from OpenSearch aggs.
 */
async function resolveFilterOption(attr, categoryId) {
  const nestedPath = 'attributes';

  // Base filter: only this category + active + published
  const filterClause = {
    bool: {
      must: [
        { term: { category_id: categoryId } },
        { term: { is_active: true } },
        { term: { status: 'published' } },
      ],
    },
  };

  let agg;
  if (attr.attribute_type === 'number') {
    agg = {
      nested: { path: nestedPath },
      aggs: {
        filtered_attr: {
          filter: { term: { [`${nestedPath}.name`]: attr.name } },
          aggs: {
            stats: { stats: { field: `${nestedPath}.value_number` } },
          },
        },
      },
    };
  } else {
    agg = {
      nested: { path: nestedPath },
      aggs: {
        filtered_attr: {
          filter: { term: { [`${nestedPath}.name`]: attr.name } },
          aggs: {
            buckets: {
              terms: { field: `${nestedPath}.value_text`, size: 100 },
            },
          },
        },
      },
    };
  }

  try {
    const res = await osClient.search({
      index: INDEX_PRODUCTS,
      body:  {
        size:  0,
        query: filterClause,
        aggs:  { attr_agg: agg },
      },
    });

    const aggResult = res.body.aggregations?.attr_agg?.filtered_attr;
    if (!aggResult) return null;

    if (attr.attribute_type === 'number') {
      const { min, max, count } = aggResult.stats;
      if (!count) return null;
      return {
        attribute_id:   attr.id,
        name:           attr.name,
        label:          attr.label,
        type:           attr.attribute_type,
        unit:           attr.unit,
        min,
        max,
        validation_rules: attr.validation_rules,
      };
    } else {
      const buckets = aggResult.buckets?.buckets || [];
      if (!buckets.length) return null;
      return {
        attribute_id:   attr.id,
        name:           attr.name,
        label:          attr.label,
        type:           attr.attribute_type,
        unit:           attr.unit,
        options:        buckets.map((b) => ({ value: b.key, count: b.doc_count })),
        defined_options: attr.options,
      };
    }
  } catch (err) {
    logger.warn(`[Search] getFilterOptions for ${attr.name} failed: ${err.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUGGESTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return search suggestions (autocomplete) based on a partial query.
 * @param {string} q
 * @param {number} [size=8]
 */
async function getSuggestions(q, size = 8) {
  if (!q || q.trim().length < 1) return [];

  try {
    const response = await osClient.search({
      index: INDEX_PRODUCTS,
      body: {
        size,
        _source: ['name', 'slug', 'category_name'],
        query: {
          bool: {
            must: [
              { term: { is_active: true } },
              { term: { status: 'published' } },
              {
                multi_match: {
                  query:    q.trim(),
                  fields:   ['name^2', 'description'],
                  type:     'phrase_prefix',
                },
              },
            ],
          },
        },
      },
    });

    return (response.body.hits?.hits || []).map((h) => ({
      id:            h._source.id || h._id,
      name:          h._source.name,
      slug:          h._source.slug,
      category_name: h._source.category_name,
    }));
  } catch (err) {
    logger.warn(`[Search] OpenSearch unavailable for suggestions, falling back to MongoDB: ${err.message}`);
    return getSuggestionsMongo(q, size);
  }
}

/**
 * MongoDB fallback for suggestions when OpenSearch is unavailable.
 */
async function getSuggestionsMongo(q, size = 8) {
  const Product  = require('../models/Product');
  const Category = require('../models/Category');
  const regex    = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const products = await Product.find(
    { name: regex, status: 'published', is_active: true },
    { name: 1, slug: 1, category_id: 1 },
  ).limit(size).lean();

  const categoryIds = [...new Set(products.map((p) => p.category_id?.toString()).filter(Boolean))];
  const categories  = await Category.find({ _id: { $in: categoryIds } }, { name: 1 }).lean();
  const catMap      = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));

  return products.map((p) => ({
    id:            p._id.toString(),
    name:          p.name,
    slug:          p.slug,
    category_name: catMap[p.category_id?.toString()] || null,
  }));
}

// HELPERS

function buildNestedAttributeFilters(filters) {
  const clauses = [];
  for (const [attrName, filterValue] of Object.entries(filters)) {
    if (filterValue === null || filterValue === undefined || filterValue === '') continue;

    // Range filter  { min, max }
    if (typeof filterValue === 'object' && !Array.isArray(filterValue) && ('min' in filterValue || 'max' in filterValue)) {
      const rangeClause = {};
      if (filterValue.min !== undefined) rangeClause.gte = Number(filterValue.min);
      if (filterValue.max !== undefined) rangeClause.lte = Number(filterValue.max);

      clauses.push({
        nested: {
          path: 'attributes',
          query: {
            bool: {
              must: [
                { term:  { 'attributes.name': attrName } },
                { range: { 'attributes.value_number': rangeClause } },
              ],
            },
          },
        },
      });
    }
    // Multi-value filter (OR)
    else if (Array.isArray(filterValue) && filterValue.length) {
      clauses.push({
        nested: {
          path: 'attributes',
          query: {
            bool: {
              must: [
                { term:  { 'attributes.name': attrName } },
                { terms: { 'attributes.value_text': filterValue } },
              ],
            },
          },
        },
      });
    }
    // Exact-match filter
    else if (typeof filterValue === 'string') {
      clauses.push({
        nested: {
          path: 'attributes',
          query: {
            bool: {
              must: [
                { term: { 'attributes.name': attrName } },
                { term: { 'attributes.value_text': filterValue } },
              ],
            },
          },
        },
      });
    }
  }
  return clauses;
}

function resolveSortClause(sortBy, q) {
  switch (sortBy) {
    case 'price_asc':  return [{ price: 'asc' }];
    case 'price_desc': return [{ price: 'desc' }];
    case 'newest':     return [{ created_at: 'desc' }];
    default:           return q ? ['_score'] : [{ created_at: 'desc' }];
  }
}

function formatSearchResponse(body, page, limit) {
  const hits  = body.hits?.hits || [];
  const total = body.hits?.total?.value ?? 0;

  const products = hits.map((h) => ({
    ...h._source,
    _score:     h._score,
    _highlight: h.highlight,
  }));

  const aggs = body.aggregations || {};

  return {
    products,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
    facets: {
      categories:  aggs.category_buckets?.buckets || [],
      price_stats: aggs.price_stats || null,
    },
  };
}

module.exports = {
  indexProduct,
  removeProduct,
  searchProducts,
  getFilterOptions,
  getSuggestions,
};
