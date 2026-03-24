import { useNavigate, useParams } from 'react-router-dom';
import DynamicProductForm from '../../components/DynamicForm/DynamicProductForm';
import { useProduct, useUpdateProduct } from '../../hooks/useProducts';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage   from '../../components/common/ErrorMessage';

export default function EditProductPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const updateMutation = useUpdateProduct();

  const { data: product, isLoading, error, refetch } = useProduct(id);

  async function handleSubmit(data) {
    try {
      const updated = await updateMutation.mutateAsync({ id: product.id, data });
      navigate(`/products/${updated.id}`);
    } catch {
      // Error already shown via toast from mutation
    }
  }

  if (isLoading) return <LoadingSpinner message="Loading product…" />;
  if (error)     return <ErrorMessage message="Failed to load product" onRetry={refetch} />;

  return (
    <div className="max-w-4xl">
      <div className="page-header">
        <h1 className="page-title">Edit Product</h1>
        <span className="text-sm text-gray-500 font-mono">{product.sku || product.id}</span>
      </div>
      <DynamicProductForm
        defaultValues={product}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
