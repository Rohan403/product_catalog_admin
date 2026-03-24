/**
 * Category Mongoose Model
 *
 * Attributes are embedded as a subdocument array inside the category,
 * eliminating the need for a separate category_attributes collection.
 */
'use strict';

const { Schema, model } = require('mongoose');

const jsonTransform = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
};

// ── Attribute definition subdocument ─────────────────────────────────────────
const AttributeDefinitionSchema = new Schema(
  {
    name:             { type: String, required: true },
    label:            { type: String, required: true },
    attribute_type:   {
      type:     String,
      required: true,
      enum:     ['text', 'number', 'select', 'multiselect', 'boolean', 'color'],
    },
    unit:             { type: String, default: null },
    is_required:      { type: Boolean, default: false },
    is_filterable:    { type: Boolean, default: true },
    is_searchable:    { type: Boolean, default: true },
    options:          { type: Schema.Types.Mixed, default: null },   // [{value, label}]
    validation_rules: { type: Schema.Types.Mixed, default: null },
    display_order:    { type: Number, default: 0 },
  },
  {
    _id: true,
    timestamps: true,
    toJSON:   { transform: jsonTransform },
    toObject: { transform: jsonTransform },
  },
);

// ── Category schema ───────────────────────────────────────────────────────────
const CategorySchema = new Schema(
  {
    name:        { type: String, required: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: null },
    parent_id:   { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    is_active:   { type: Boolean, default: true },
    attributes:  { type: [AttributeDefinitionSchema], default: [] },
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

CategorySchema.index({ parent_id: 1 });
CategorySchema.index({ is_active: 1 });

// Enforce unique (name, parent_id) constraint
CategorySchema.index({ name: 1, parent_id: 1 }, { unique: true });

module.exports = model('Category', CategorySchema);
