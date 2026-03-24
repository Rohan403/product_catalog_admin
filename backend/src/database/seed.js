/**
 * MongoDB seeder â€“ upserts sample categories (with embedded attributes) and products.
 * Safe to re-run; uses findOneAndUpdate with upsert: true.
 *
 * Usage:  node src/database/seed.js
 */
'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product  = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product_catalog';

const CATEGORIES_DATA = [
  {
    name:        'Mobile',
    slug:        'mobile',
    description: 'Smartphones and mobile devices',
    attributes: [
      { name: 'ram',       label: 'RAM',       attribute_type: 'number', unit: 'GB', is_required: true,  is_filterable: true,  display_order: 1 },
      { name: 'processor', label: 'Processor', attribute_type: 'text',               is_required: true,  is_filterable: false, display_order: 2 },
      { name: 'storage',   label: 'Storage',   attribute_type: 'select', unit: 'GB', is_required: true,  is_filterable: true,  display_order: 3,
        options: [{ value: '64GB', label: '64 GB' }, { value: '128GB', label: '128 GB' }, { value: '256GB', label: '256 GB' }, { value: '512GB', label: '512 GB' }] },
      { name: 'color',     label: 'Color',     attribute_type: 'select',             is_required: true,  is_filterable: true,  display_order: 4,
        options: [{ value: 'Black', label: 'Black' }, { value: 'White', label: 'White' }, { value: 'Gold', label: 'Gold' }, { value: 'Silver', label: 'Silver' }] },
    ],
  },
  {
    name:        'Bangles',
    slug:        'bangles',
    description: 'Traditional and modern bangles',
    attributes: [
      { name: 'color',    label: 'Color',    attribute_type: 'select',          is_required: true,  is_filterable: true, display_order: 1,
        options: [{ value: 'Gold', label: 'Gold' }, { value: 'Silver', label: 'Silver' }, { value: 'Rose Gold', label: 'Rose Gold' }, { value: 'Multi', label: 'Multi Color' }] },
      { name: 'size',     label: 'Size',     attribute_type: 'select',          is_required: true,  is_filterable: true, display_order: 2,
        options: [{ value: '2.4', label: '2.4' }, { value: '2.6', label: '2.6' }, { value: '2.8', label: '2.8' }] },
      { name: 'material', label: 'Material', attribute_type: 'select',          is_required: true,  is_filterable: true, display_order: 3,
        options: [{ value: 'Gold', label: 'Gold' }, { value: 'Silver', label: 'Silver' }, { value: 'Brass', label: 'Brass' }, { value: 'Copper', label: 'Copper' }] },
      { name: 'weight',   label: 'Weight',   attribute_type: 'number', unit: 'g', is_required: false, is_filterable: true, display_order: 4 },
    ],
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB. Seedingâ€¦');

  // â”€â”€ Categories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const categoryMap = {};
  for (const catData of CATEGORIES_DATA) {
    const category = await Category.findOneAndUpdate(
      { slug: catData.slug },
      { $set: catData },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categoryMap[catData.slug] = category;
    console.log(`Category "${category.name}" â†’ ${category._id}`);
  }

  // â”€â”€ Mobile product â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const mobile = categoryMap['mobile'];
  if (mobile) {
    await Product.findOneAndUpdate(
      { slug: 'nexus-pro-x1' },
      {
        $set: {
          category_id: mobile._id,
          name:        'Nexus Pro X1',
          slug:        'nexus-pro-x1',
          sku:         'NPX1-001',
          description: 'A flagship smartphone with cutting-edge performance and stunning design.',
          highlights:  ['5G connectivity', 'Triple camera system', '120Hz AMOLED display'],
          price:       899.99,
          stock:       50,
          status:      'published',
          attributes: [
            { name: 'ram',       value_number: 8 },
            { name: 'processor', value_text: 'Snapdragon 8 Gen 3' },
            { name: 'storage',   value_text: '256GB' },
            { name: 'color',     value_text: 'Black' },
          ],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log('Sample Mobile product seeded.');
  }

  // â”€â”€ Bangles product â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const bangles = categoryMap['bangles'];
  if (bangles) {
    await Product.findOneAndUpdate(
      { slug: 'royal-gold-bangle-set' },
      {
        $set: {
          category_id: bangles._id,
          name:        'Royal Gold Bangle Set',
          slug:        'royal-gold-bangle-set',
          sku:         'RGB-001',
          description: 'Exquisite handcrafted gold bangles with traditional motifs.',
          highlights:  ['22K gold purity', 'Handcrafted', 'Hallmarked'],
          price:       249.99,
          stock:       20,
          status:      'published',
          attributes: [
            { name: 'color',    value_text:   'Gold' },
            { name: 'size',     value_text:   '2.6'  },
            { name: 'material', value_text:   'Gold' },
            { name: 'weight',   value_number: 24.5   },
          ],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log('Sample Bangle product seeded.');
  }

  console.log('Seeding completed successfully.');
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
