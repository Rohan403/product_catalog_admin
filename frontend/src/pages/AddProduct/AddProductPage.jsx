import { useNavigate } from 'react-router-dom';
import DynamicProductForm from '../../components/DynamicForm/DynamicProductForm';
import { useCreateProduct } from '../../hooks/useProducts';

export default function AddProductPage() {
  const navigate       = useNavigate();
  const createMutation = useCreateProduct();

  async function handleSubmit(data) {
    try {
      const product = await createMutation.mutateAsync(data);
      navigate(`/products/${product.id}`);
    } catch {
      // Error already shown via toast from mutation
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="page-header">
        <h1 className="page-title">Add Product</h1>
      </div>
      <DynamicProductForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
