/**
 * Product Mongoose Model
 *
 * Attribute values are embedded as an array of { name, value_text, value_number, value_json }.
 * The attribute schema (label, type, unit, etc.) lives in the Category document.
 */
'use strict';

const { Schema, model } = require('mongoose');

const jsonTransform = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
};

// ── Attribute value subdocument ───────────────────────────────────────────────
const AttributeValueSchema = new Schema(
  {
    name:         { type: String, required: true },
    value_text:   { type: String,  default: null },
    value_number: { type: Number,  default: null },
    value_json:   { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

// ── Product schema ────────────────────────────────────────────────────────────
const ProductSchema = new Schema(
  {
    category_id:    { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name:           { type: String, required: true },
    slug:           { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku:            { type: String, default: null },
    description:    { type: String, default: null },
    highlights:     { type: [String], default: [] },
    specifications: { type: Schema.Types.Mixed, default: {} },
    price:          { type: Number, required: true, default: 0 },
    stock:          { type: Number, default: 0 },
    images:         { type: [String], default: [] },
    status:         { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    is_active:      { type: Boolean, default: true },
    attributes:     { type: [AttributeValueSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: jsonTransform,
    },
    toObject: {
      virtuals: true,
      transform: jsonTransform,
    },
  },
);

ProductSchema.index({ category_id: 1 });
ProductSchema.index({ sku: 1 }, { sparse: true });
ProductSchema.index({ status: 1 });
ProductSchema.index({ is_active: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });

module.exports = model('Product', ProductSchema);
