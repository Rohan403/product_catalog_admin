/**
 * ProductDetailPage
 *
 * Adapts its display dynamically based on the product's category attributes.
 * The attribute section is rendered from the product.attributes array returned
 * by the backend – no category-specific layout code exists here.
 */

import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProduct, useDeleteProduct } from '../../hooks/useProducts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage   from '../../components/common/ErrorMessage';

const STATUS_BADGE = {
  published: 'badge-green',
  draft:     'badge-yellow',
  archived:  'badge-gray',
};

export default function ProductDetailPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const deleteMutation = useDeleteProduct();

  const { data: product, isLoading, error, refetch } = useProduct(id);

  if (isLoading) return <LoadingSpinner message="Loading product…" />;
  if (error)     return <ErrorMessage message="Product not found or failed to load" onRetry={refetch} />;

  async function handleDelete() {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await deleteMutation.mutateAsync(product.id);
      navigate('/products');
    } catch { /* toast shown by hook */ }
  }

  const attributes  = product.attributes || [];
  const highlights  = product.highlights  || [];
  const images      = product.images      || [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/products" className="hover:underline">Products</Link>
            <span>/</span>
            <span>{product.category_name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.sku && (
            <p className="text-sm text-gray-500 font-mono mt-0.5">SKU: {product.sku}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link to={`/products/${product.id}/edit`} className="btn-primary btn-sm">
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-danger btn-sm">
            Deactivate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column ────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Images */}
          {images.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <img
                src={images[0]}
                alt={product.name}
                className="w-full h-72 object-contain bg-gray-50"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.slice(1).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-800 mb-2">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Highlights</h2>
              <ul className="space-y-1.5">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Dynamic Specifications (category attributes) ──────── */}
          {attributes.length > 0 && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-800 mb-3">Specifications</h2>
              <dl className="divide-y divide-gray-100">
                {attributes.map((attr) => (
                  <div
                    key={attr.attribute_id || attr.name}
                    className="flex items-center py-2.5 gap-4 text-sm"
                  >
                    <dt className="w-32 flex-shrink-0 text-gray-500 font-medium">
                      {attr.label}
                      {attr.unit && <span className="text-xs text-gray-400 ml-1">({attr.unit})</span>}
                    </dt>
                    <dd className="text-gray-900 font-medium">
                      {renderAttrValue(attr)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

        </div>

        {/* ── Right column ───────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-800">Details</h2>
              <span className={STATUS_BADGE[product.status] || 'badge-gray'}>
                {product.status}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span className="font-bold text-primary-700 text-lg">
                  ${parseFloat(product.price).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock</span>
                <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? product.stock : 'Out of stock'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-medium">{product.category_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Slug</span>
                <span className="font-mono text-xs text-gray-600 truncate max-w-[120px]" title={product.slug}>
                  {product.slug}
                </span>
              </div>
            </div>
          </div>

          {/* Date info */}
          <div className="card text-xs text-gray-400 space-y-1">
            <div>Created: {product.created_at || product.createdAt ? new Date(product.created_at || product.createdAt).toLocaleDateString() : '—'}</div>
            <div>Updated: {product.updated_at || product.updatedAt ? new Date(product.updated_at || product.updatedAt).toLocaleDateString() : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderAttrValue(attr) {
  if (attr.value === null || attr.value === undefined || attr.value === '') {
    return <span className="text-gray-400 italic">—</span>;
  }
  if (Array.isArray(attr.value)) {
    return attr.value.join(', ');
  }
  if (attr.type === 'boolean') {
    return attr.value === 'true' || attr.value === true ? '✓ Yes' : '✗ No';
  }
  return String(attr.value);
}
