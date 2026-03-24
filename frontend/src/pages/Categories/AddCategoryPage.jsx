import { useNavigate } from 'react-router-dom';
import { useForm }     from 'react-hook-form';
import { useCreateCategory } from '../../hooks/useCategories';

export default function AddCategoryPage() {
  const navigate        = useNavigate();
  const createMutation  = useCreateCategory();
  const { register, handleSubmit, formState: { errors } } = useForm();

  async function onSubmit(data) {
    try {
      await createMutation.mutateAsync(data);
      navigate('/categories');
    } catch { /* toast shown by hook */ }
  }

  return (
    <div className="max-w-lg">
      <div className="page-header">
        <h1 className="page-title">Add Category</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div className="flex flex-col gap-1">
          <label className="label">Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            placeholder="e.g. Mobile"
            className={`input${errors.name ? ' input-error' : ''}`}
            {...register('name', { required: 'Name is required' })}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="label">Description</label>
          <textarea
            rows={3}
            placeholder="Short description"
            className="input resize-y"
            {...register('description')}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Category'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
