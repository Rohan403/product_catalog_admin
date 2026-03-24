import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useCategories, useDeleteCategory,
  useCreateAttribute, useDeleteAttribute,
} from '../../hooks/useCategories';
import { useCategoryAttributes } from '../../hooks/useCategories';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage   from '../../components/common/ErrorMessage';
import AttributeFormModal from './AttributeFormModal';

export default function CategoriesPage() {
  const [expandedId, setExpandedId]         = useState(null);
  const [showAttrModal, setShowAttrModal]   = useState(false);
  const [selectedCatId, setSelectedCatId]   = useState(null);

  const { data: categories = [], isLoading, error, refetch } = useCategories({ includeInactive: true });
  const deleteMutation  = useDeleteCategory();
  const createAttrMut   = useCreateAttribute();
  const deleteAttrMut   = useDeleteAttribute();

  async function handleDeleteCategory(id) {
    if (window.confirm('Deactivate this category?')) {
      deleteMutation.mutate(id);
    }
  }

  function openAddAttr(catId) {
    setSelectedCatId(catId);
    setShowAttrModal(true);
  }

  async function handleCreateAttr(data) {
    await createAttrMut.mutateAsync({ categoryId: selectedCatId, data });
    setShowAttrModal(false);
  }

  if (isLoading) return <LoadingSpinner message="Loading categories…" />;
  if (error)     return <ErrorMessage message="Failed to load categories" onRetry={refetch} />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <Link to="/categories/add" className="btn-primary">
          + Add Category
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">🗂</p>
          <p className="text-lg font-medium">No categories yet</p>
          <Link to="/categories/add" className="btn-primary mt-4 inline-flex">
            Create first category
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              isExpanded={expandedId === cat.id}
              onToggle={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
              onDelete={() => handleDeleteCategory(cat.id)}
              onAddAttr={() => openAddAttr(cat.id)}
              onDeleteAttr={(attrId) => deleteAttrMut.mutate({ categoryId: cat.id, attrId })}
            />
          ))}
        </div>
      )}

      {/* Attribute form modal */}
      {showAttrModal && (
        <AttributeFormModal
          onSubmit={handleCreateAttr}
          onClose={() => setShowAttrModal(false)}
          isLoading={createAttrMut.isPending}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function CategoryRow({ category, isExpanded, onToggle, onDelete, onAddAttr, onDeleteAttr }) {
  const { data: attributes = [], isLoading } = useCategoryAttributes(
    isExpanded ? category.id : null,
  );

  return (
    <div className={`card ${!category.is_active ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3">
        <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 font-mono text-lg w-6">
          {isExpanded ? '▼' : '▶'}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{category.name}</span>
            {!category.is_active && <span className="badge-gray">Inactive</span>}
          </div>
          {category.description && (
            <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
          )}
        </div>

        <span className="text-xs text-gray-400">{category.product_count} products</span>

        <div className="flex gap-2">
          <Link to={`/categories/${category.id}/edit`} className="btn btn-secondary btn-sm">
            Edit
          </Link>
          <button onClick={onAddAttr} className="btn btn-primary btn-sm">
            + Attribute
          </button>
          <button onClick={onDelete} className="btn btn-danger btn-sm">
            🗑
          </button>
        </div>
      </div>

      {/* Attributes table */}
      {isExpanded && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {isLoading ? (
            <LoadingSpinner message="" />
          ) : attributes.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No attributes defined.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Label</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Unit</th>
                  <th className="pb-2 pr-4">Required</th>
                  <th className="pb-2 pr-4">Filterable</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attributes.map((attr) => (
                  <tr key={attr.id}>
                    <td className="py-2 pr-4 font-mono text-xs">{attr.name}</td>
                    <td className="py-2 pr-4">{attr.label}</td>
                    <td className="py-2 pr-4">
                      <span className="badge badge-gray">{attr.attribute_type}</span>
                    </td>
                    <td className="py-2 pr-4 text-gray-400">{attr.unit || '—'}</td>
                    <td className="py-2 pr-4">{attr.is_required ? '✓' : '—'}</td>
                    <td className="py-2 pr-4">{attr.is_filterable ? '✓' : '—'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete attribute "${attr.label}"?`)) {
                            onDeleteAttr(attr.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
