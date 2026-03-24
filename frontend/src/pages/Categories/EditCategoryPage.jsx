import { useNavigate, useParams } from 'react-router-dom';
import { useEffect }              from 'react';
import { useForm }                from 'react-hook-form';
import { useCategory, useUpdateCategory } from '../../hooks/useCategories';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage   from '../../components/common/ErrorMessage';

export default function EditCategoryPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const updateMutation = useUpdateCategory();

  const { data: category, isLoading, error } = useCategory(id);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (category) {
      reset({
        name:        category.name,
        description: category.description || '',
        is_active:   category.is_active,
      });
    }
  }, [category, reset]);

  async function onSubmit(data) {
    try {
      await updateMutation.mutateAsync({ id, data });
      navigate('/categories');
    } catch { /* toast shown by hook */ }
  }

  if (isLoading) return <LoadingSpinner message="Loading category…" />;
  if (error)     return <ErrorMessage message="Category not found" />;

  return (
    <div className="max-w-lg">
      <div className="page-header">
        <h1 className="page-title">Edit Category</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div className="flex flex-col gap-1">
          <label className="label">Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            className={`input${errors.name ? ' input-error' : ''}`}
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Description</label>
          <textarea rows={3} className="input resize-y" {...register('description')} />
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
          <input type="checkbox" className="w-4 h-4 rounded" {...register('is_active')} />
          Active
        </label>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
