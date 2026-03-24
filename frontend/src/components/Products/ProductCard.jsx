import { Link } from 'react-router-dom';

const STATUS_BADGE = {
  published: 'badge-green',
  draft:     'badge-yellow',
  archived:  'badge-gray',
};

export default function ProductCard({ product, onDelete }) {
  const badge = STATUS_BADGE[product.status] || 'badge-gray';

  return (
    <div className="card flex flex-col gap-3 hover:shadow-md transition-shadow relative group">
      {/* Whole-card link — sits behind action buttons */}
      <Link
        to={`/products/${product.id}`}
        className="absolute inset-0 z-0 rounded-xl"
        aria-label={`View ${product.name}`}
      />

      {/* Image */}
      {product.images?.[0] ? (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-40 object-cover rounded-lg bg-gray-100"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
          📦
        </div>
      )}

      {/* Body */}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
          <span className={badge}>{product.status}</span>
        </div>

        {product.category_name && (
          <p className="text-xs text-gray-400 mt-0.5">{product.category_name}</p>
        )}

        <p className="text-lg font-bold text-primary-700 mt-2">
          ${parseFloat(product.price).toFixed(2)}
        </p>

        {product.stock !== undefined && (
          <p className="text-xs text-gray-500 mt-0.5">
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
        )}
      </div>

      {/* Actions — z-10 so they sit above the card link */}
      <div className="relative z-10 flex gap-2 pt-2 border-t border-gray-100">
        <Link to={`/products/${product.id}`} className="btn btn-secondary btn-sm flex-1 text-center">
          View
        </Link>
        <Link to={`/products/${product.id}/edit`} className="btn btn-primary btn-sm flex-1 text-center">
          Edit
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(product.id)}
            className="btn btn-danger btn-sm"
            title="Deactivate"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
