/**
 * SearchPage
 *
 * Full search experience: free-text input + dynamic category-driven filter panel.
 * All filter options are fetched from the backend — no hardcoded category logic.
 */

import { useState, useCallback } from 'react';
import { useSearchParams }  from 'react-router-dom';
import { useSearch, useFilterOptions } from '../../hooks/useSearch';
import { useCategories }               from '../../hooks/useCategories';
import SearchBar    from '../../components/SearchFilter/SearchBar';
import FilterPanel  from '../../components/SearchFilter/FilterPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage   from '../../components/common/ErrorMessage';
import Pagination     from '../../components/common/Pagination';
import { Link }       from 'react-router-dom';

const SORT_OPTIONS = [
  { value: 'relevance',  label: 'Most Relevant' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest',     label: 'Newest First' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ]                   = useState(searchParams.get('q') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy]         = useState('relevance');
  const [page, setPage]             = useState(1);
  const [activeFilters, setActiveFilters] = useState({});

  // Load categories for the category selector
  const { data: categories = [] } = useCategories();

  // Load filter panel options for the selected category
  const { data: filterOptions = [] } = useFilterOptions(categoryId || null);

  // Run search
  const { data: results, isLoading, error, isFetching } = useSearch({
    q,
    categoryId: categoryId || undefined,
    filters:    activeFilters,
    page,
    limit:      12,
    sortBy,
  });

  const products   = results?.products   || [];
  const total      = results?.total      || 0;
  const totalPages = results?.total_pages || 1;
  const facets     = results?.facets     || {};

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSearch(value) {
    setQ(value);
    setPage(1);
    setSearchParams(value ? { q: value } : {});
  }

  function handleCategoryChange(catId) {
    setCategoryId(catId);
    setActiveFilters({});
    setPage(1);
  }

  function handleFilterChange(attrName, value) {
    setActiveFilters((prev) => {
      const next = { ...prev };
      if (value === null || value === undefined ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
        delete next[attrName];
      } else {
        next[attrName] = value;
      }
      return next;
    });
    setPage(1);
  }

  const hasActiveSearch = q || categoryId || Object.keys(activeFilters).length > 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Search Products</h1>
      </div>

      {/* ── Search bar + category selector ─────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <SearchBar value={q} onSearch={handleSearch} />
        <select
          value={categoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="input w-auto"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input w-auto"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Main layout: filter sidebar + results ──────────────── */}
      <div className="flex gap-6 items-start">
        {/* Filter Panel – shown when category is selected */}
        {categoryId && filterOptions.length > 0 && (
          <FilterPanel
            filters={filterOptions}
            activeFilters={activeFilters}
            onChange={handleFilterChange}
          />
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {!hasActiveSearch ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-3">🔍</p>
              <p className="text-lg font-medium">Enter a search term or select a category</p>
            </div>
          ) : isLoading ? (
            <LoadingSpinner message="Searching…" />
          ) : error ? (
            <ErrorMessage message="Search failed. Please try again." />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  {isFetching && <span className="mr-2 opacity-60">↻</span>}
                  {total === 0 ? 'No results found' : `${total} result${total !== 1 ? 's' : ''}`}
                  {q && <span className="ml-1">for "<strong>{q}</strong>"</span>}
                </p>
                {Object.keys(activeFilters).length > 0 && (
                  <button
                    onClick={() => setActiveFilters({})}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {products.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-4xl mb-2">😞</p>
                  <p>No products match your query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <SearchResultCard key={p.id || p.slug} product={p} q={q} />
                  ))}
                </div>
              )}

              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function SearchResultCard({ product, q }) {
  const highlight = product._highlight;

  return (
    <Link
      to={`/products/${product.id}`}
      className="card hover:shadow-md transition-shadow block cursor-pointer"
    >
      {product.images?.[0] && (
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-36 object-contain bg-gray-50 rounded-lg mb-3"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}
      <div>
        {highlight?.name ? (
          <h3
            className="text-sm font-semibold text-gray-900"
            dangerouslySetInnerHTML={{ __html: highlight.name[0] }}
          />
        ) : (
          <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{product.category_name}</p>
        {highlight?.description && (
          <p
            className="text-xs text-gray-500 mt-1 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: highlight.description[0] }}
          />
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-primary-700">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <span className="btn btn-secondary btn-sm">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
