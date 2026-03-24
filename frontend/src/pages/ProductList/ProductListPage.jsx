import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useDeleteProduct } from '../../hooks/useProducts';
import ProductCard    from '../../components/Products/ProductCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage   from '../../components/common/ErrorMessage';
import Pagination     from '../../components/common/Pagination';
import { useCategories } from '../../hooks/useCategories';

export default function ProductListPage() {
  const [page, setPage]           = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus]       = useState('');

  const { data: categories = [] } = useCategories();
  const { data, isLoading, error, refetch } = useProducts({
    page,
    limit: 12,
    categoryId: categoryId || undefined,
    status:     status     || undefined,
  });

  const deleteMutation = useDeleteProduct();

  const products    = data?.data      || [];
  const meta        = data?.meta      || {};
  const totalPages  = meta.total_pages || 1;

  function handleDelete(id) {
    if (window.confirm('Deactivate this product?')) {
      deleteMutation.mutate(id);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <Link to="/products/add" className="btn-primary">
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="input w-auto"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {isLoading && <LoadingSpinner message="Loading products…" />}
      {error    && <ErrorMessage message="Failed to load products" onRetry={refetch} />}

      {!isLoading && !error && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">📦</p>
              <p className="text-lg font-medium">No products found</p>
              <Link to="/products/add" className="btn-primary mt-4 inline-flex">
                Add your first product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onDelete={handleDelete} />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />

          {meta.total !== undefined && (
            <p className="text-xs text-center text-gray-400 mt-2">
              {meta.total} product{meta.total !== 1 ? 's' : ''} total
            </p>
          )}
        </>
      )}
    </div>
  );
}
