/**
 * DynamicProductForm
 *
 * The core "Add / Edit Product" form component.
 *
 * Design principle: this component has NO knowledge of specific categories.
 * Category selection triggers a fetch from the backend, which returns the
 * attribute schema.  The form fields are then rendered dynamically from that
 * schema via DynamicAttributeField – no hardcoding required.
 *
 * Adding a new category with new attributes requires ZERO frontend changes.
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useCategories, useCategoryAttributes } from '../../hooks/useCategories';
import DynamicAttributeField from './DynamicAttributeField';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage  from '../common/ErrorMessage';

export default function DynamicProductForm({ onSubmit, defaultValues = {}, isLoading = false }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    defaultValues.category_id || '',
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: buildFormDefaults(defaultValues) });

  // ── Fetch categories list ─────────────────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading, error: catsError } = useCategories();

  // ── Fetch attributes for selected category ────────────────────────────────
  const {
    data: attributes = [],
    isLoading: attrsLoading,
  } = useCategoryAttributes(selectedCategoryId);

  // Pre-fill attribute values when editing an existing product
  useEffect(() => {
    if (defaultValues.attributes?.length && attributes.length) {
      for (const { name, value } of defaultValues.attributes) {
        setValue(`attributes.${name}`, value ?? '');
      }
    }
  }, [attributes, defaultValues.attributes, setValue]);

  // Pre-select category when editing
  useEffect(() => {
    if (defaultValues.category_id && !selectedCategoryId) {
      setSelectedCategoryId(defaultValues.category_id);
    }
  }, [defaultValues.category_id]);

  // ── Form submission ───────────────────────────────────────────────────────
  function handleFormSubmit(formData) {
    // Transform attributes from { attributes: { ram: 8, color: "Black" } }
    // into [{ name: "ram", value: 8 }, { name: "color", value: "Black" }]
    const attrValues = Object.entries(formData.attributes || {}).map(([name, value]) => ({
      name,
      value,
    }));

    const highlights = (formData.highlights_raw || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const images = (formData.images_raw || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      category_id:    formData.category_id,
      name:           formData.name,
      sku:            formData.sku || undefined,
      description:    formData.description || '',
      highlights,
      specifications: {},
      price:          Number(formData.price),
      stock:          Number(formData.stock || 0),
      images,
      status:         formData.status,
      attributes:     attrValues,
    });
  }

  if (catsLoading) return <LoadingSpinner message="Loading categories…" />;
  if (catsError)   return <ErrorMessage message="Failed to load categories" />;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8" noValidate>

      {/* ── Core Product Fields ─────────────────────────────────────────── */}
      <section className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Product Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Category selector */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="category_id" className="label">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category_id"
              className={`input${errors.category_id ? ' input-error' : ''}`}
              {...register('category_id', { required: 'Category is required' })}
              onChange={(e) => {
                setValue('category_id', e.target.value);
                setSelectedCategoryId(e.target.value);
                // Clear previous attribute values
                reset((prev) => ({ ...prev, category_id: e.target.value, attributes: {} }));
              }}
            >
              <option value="">Select a category…</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="text-xs text-red-500">{errors.category_id.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="label">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. iPhone 15 Pro"
              className={`input${errors.name ? ' input-error' : ''}`}
              {...register('name', { required: 'Product name is required', maxLength: { value: 500, message: 'Max 500 characters' } })}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* SKU */}
          <div className="flex flex-col gap-1">
            <label htmlFor="sku" className="label">SKU</label>
            <input
              id="sku"
              type="text"
              placeholder="e.g. IPH-15-PRO-256"
              className="input"
              {...register('sku')}
            />
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1">
            <label htmlFor="price" className="label">
              Price ($) <span className="text-red-500">*</span>
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`input${errors.price ? ' input-error' : ''}`}
              {...register('price', {
                required:       'Price is required',
                min:            { value: 0, message: 'Price must be ≥ 0' },
                valueAsNumber:  true,
              })}
            />
            {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
          </div>

          {/* Stock */}
          <div className="flex flex-col gap-1">
            <label htmlFor="stock" className="label">Stock</label>
            <input
              id="stock"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="input"
              {...register('stock', { min: { value: 0, message: 'Stock must be ≥ 0' }, valueAsNumber: true })}
            />
            {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="label">Status</label>
            <select id="status" className="input" {...register('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2 flex flex-col gap-1">
            <label htmlFor="description" className="label">Description</label>
            <textarea
              id="description"
              rows={4}
              placeholder="Enter product description…"
              className="input resize-y"
              {...register('description')}
            />
          </div>

          {/* Highlights */}
          <div className="flex flex-col gap-1">
            <label htmlFor="highlights_raw" className="label">
              Highlights <span className="text-xs text-gray-400">(one per line)</span>
            </label>
            <textarea
              id="highlights_raw"
              rows={4}
              placeholder={"5G connectivity\nTriple camera\nFast charging"}
              className="input resize-y font-mono text-sm"
              {...register('highlights_raw')}
            />
          </div>

          {/* Images */}
          <div className="flex flex-col gap-1">
            <label htmlFor="images_raw" className="label">
              Image URLs <span className="text-xs text-gray-400">(one per line)</span>
            </label>
            <textarea
              id="images_raw"
              rows={4}
              placeholder="https://example.com/image1.jpg"
              className="input resize-y font-mono text-sm"
              {...register('images_raw')}
            />
          </div>

        </div>
      </section>

      {/* ── Dynamic Attribute Fields ─────────────────────────────────────── */}
      {selectedCategoryId && (
        <section className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Category Attributes
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Fields are loaded dynamically based on the selected category.
          </p>

          {attrsLoading ? (
            <LoadingSpinner message="Loading attribute fields…" />
          ) : attributes.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No attributes defined for this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attributes.map((attr) => (
                <DynamicAttributeField
                  key={attr.id}
                  attribute={attr}
                  register={register}
                  error={errors.attributes?.[attr.name]}
                  defaultValue=""
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save Product'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function buildFormDefaults(product) {
  const highlights = Array.isArray(product.highlights) ? product.highlights.join('\n') : '';
  const images     = Array.isArray(product.images)     ? product.images.join('\n')     : '';
  return {
    category_id:    product.category_id    || '',
    name:           product.name           || '',
    sku:            product.sku            || '',
    description:    product.description    || '',
    price:          product.price          ?? '',
    stock:          product.stock          ?? 0,
    status:         product.status         || 'draft',
    highlights_raw: highlights,
    images_raw:     images,
    attributes:     {},
  };
}
