/**
 * OpenSearch / Elasticsearch client.
 * Compatible with both OpenSearch 2.x and Elasticsearch 7/8 via the
 * @opensearch-project/opensearch package.
 *
 * Index name: OPENSEARCH_INDEX_PRODUCTS (default: "products")
 */
'use strict';

const { Client } = require('@opensearch-project/opensearch');

const client = new Client({
  node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.OPENSEARCH_USERNAME || 'admin',
    password: process.env.OPENSEARCH_PASSWORD || 'admin',
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

const INDEX_PRODUCTS = process.env.OPENSEARCH_INDEX_PRODUCTS || 'products';

/**
 * Ensures the products index exists with correct mappings.
 * Call once at application start.
 */
async function ensureProductIndex() {
  try {
    const exists = await client.indices.exists({ index: INDEX_PRODUCTS });
    if (!exists.body) {
      await client.indices.create({
        index: INDEX_PRODUCTS,
        body: {
          settings: {
            number_of_shards:   1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                product_analyzer: {
                  type:      'custom',
                  tokenizer: 'standard',
                  filter:    ['lowercase', 'asciifolding'],
                },
              },
            },
          },
          mappings: {
            properties: {
              id:            { type: 'keyword' },
              name: {
                type:   'text',
                analyzer: 'product_analyzer',
                fields: { keyword: { type: 'keyword' } },
              },
              slug:          { type: 'keyword' },
              sku:           { type: 'keyword' },
              description:   { type: 'text', analyzer: 'product_analyzer' },
              category_id:   { type: 'keyword' },
              category_name: { type: 'keyword' },
              category_slug: { type: 'keyword' },
              price:         { type: 'double' },
              stock:         { type: 'integer' },
              status:        { type: 'keyword' },
              is_active:     { type: 'boolean' },
              highlights:    { type: 'text' },
              created_at:    { type: 'date' },
              updated_at:    { type: 'date' },
              /**
               * Nested attributes allow per-attribute filtering.
               * Each element:  { name, label, type, value_text, value_number }
               */
              attributes: {
                type: 'nested',
                properties: {
                  name:         { type: 'keyword' },
                  label:        { type: 'keyword' },
                  type:         { type: 'keyword' },
                  value_text:   { type: 'keyword' },
                  value_number: { type: 'double' },
                },
              },
            },
          },
        },
      });
      console.log(`[OpenSearch] Index "${INDEX_PRODUCTS}" created.`);
    }
  } catch (err) {
    console.warn('[OpenSearch] Could not verify/create index:', err.message);
  }
}

module.exports = { client, INDEX_PRODUCTS, ensureProductIndex };
