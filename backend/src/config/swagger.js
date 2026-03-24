/**
 * Swagger / OpenAPI 3.0 configuration.
 * Serves interactive API docs at /api-docs.
 */
'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title:       'Product Catalog API',
      version:     '1.0.0',
      description: `
## Scalable Product Catalog with Dynamic Category Attributes

This API powers an admin panel for managing products whose fields are driven by
configurable category definitions.  New categories and their attributes can be
added at any time without frontend code changes.

### Key Concepts
- **Categories** define the product types (e.g. Mobile, Bangles).
- **Category Attributes** define the schema (e.g. RAM, Color) for a category.
- **Products** store core data plus a set of attribute values matching their category.
- **Search** is powered by OpenSearch with fully dynamic, category-driven filters.
      `,
      contact: {
        name:  'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      { url: '/api', description: 'Current environment' },
    ],
    components: {
      schemas: {
        Category: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            name:        { type: 'string', example: 'Mobile' },
            slug:        { type: 'string', example: 'mobile' },
            description: { type: 'string' },
            parent_id:   { type: 'string', format: 'uuid', nullable: true },
            is_active:   { type: 'boolean' },
            created_at:  { type: 'string', format: 'date-time' },
            updated_at:  { type: 'string', format: 'date-time' },
          },
        },
        CategoryAttribute: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            category_id:      { type: 'string', format: 'uuid' },
            name:             { type: 'string', example: 'ram' },
            label:            { type: 'string', example: 'RAM' },
            attribute_type:   { type: 'string', enum: ['text','number','select','multiselect','boolean','color'] },
            unit:             { type: 'string', example: 'GB', nullable: true },
            is_required:      { type: 'boolean' },
            is_filterable:    { type: 'boolean' },
            is_searchable:    { type: 'boolean' },
            options:          { type: 'array', items: { type: 'object', properties: { value: { type: 'string' }, label: { type: 'string' } } } },
            validation_rules: { type: 'object' },
            display_order:    { type: 'integer' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id:             { type: 'string', format: 'uuid' },
            category_id:    { type: 'string', format: 'uuid' },
            name:           { type: 'string' },
            slug:           { type: 'string' },
            sku:            { type: 'string' },
            description:    { type: 'string' },
            highlights:     { type: 'array', items: { type: 'string' } },
            specifications: { type: 'object' },
            price:          { type: 'number', format: 'float' },
            stock:          { type: 'integer' },
            images:         { type: 'array', items: { type: 'string' } },
            status:         { type: 'string', enum: ['draft','published','archived'] },
            attributes:     { type: 'array', items: { type: 'object' } },
            category:       { $ref: '#/components/schemas/Category' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors:  { type: 'array', items: { type: 'object' } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page:        { type: 'integer' },
            limit:       { type: 'integer' },
            total:       { type: 'integer' },
            total_pages: { type: 'integer' },
          },
        },
      },
    },
    tags: [
      { name: 'Categories',  description: 'Manage product categories' },
      { name: 'Attributes',  description: 'Manage category-specific attributes' },
      { name: 'Products',    description: 'CRUD operations for products' },
      { name: 'Search',      description: 'OpenSearch-powered dynamic search and filters' },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
