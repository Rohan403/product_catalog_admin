/**
 * Inline modal for adding a new attribute to a category.
 */
import { useForm } from 'react-hook-form';

const ATTR_TYPES = [
  { value: 'text',        label: 'Text' },
  { value: 'number',      label: 'Number' },
  { value: 'select',      label: 'Select (single)' },
  { value: 'multiselect', label: 'Multi-select' },
  { value: 'boolean',     label: 'Boolean' },
  { value: 'color',       label: 'Color' },
];

export default function AttributeFormModal({ onSubmit, onClose, isLoading }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { attribute_type: 'text', is_required: false, is_filterable: true },
  });

  const type = watch('attribute_type');
  const needsOptions = type === 'select' || type === 'multiselect';

  function handleFormSubmit(data) {
    const payload = { ...data };
    if (needsOptions && data.options_raw) {
      payload.options = data.options_raw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((v) => ({ value: v, label: v }));
    }
    delete payload.options_raw;
    onSubmit(payload);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Attribute</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="label">
                Name (key) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ram"
                className={`input${errors.name ? ' input-error' : ''}`}
                {...register('name', {
                  required: 'Required',
                  pattern:  { value: /^[a-z0-9_]+$/, message: 'snake_case only' },
                })}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Label */}
            <div className="flex flex-col gap-1">
              <label className="label">
                Label <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. RAM"
                className={`input${errors.label ? ' input-error' : ''}`}
                {...register('label', { required: 'Required' })}
              />
              {errors.label && <p className="text-xs text-red-500">{errors.label.message}</p>}
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <label className="label">Type <span className="text-red-500">*</span></label>
              <select className="input" {...register('attribute_type', { required: true })}>
                {ATTR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div className="flex flex-col gap-1">
              <label className="label">Unit (optional)</label>
              <input type="text" placeholder="e.g. GB, kg" className="input" {...register('unit')} />
            </div>
          </div>

          {/* Options (select/multiselect) */}
          {needsOptions && (
            <div className="flex flex-col gap-1">
              <label className="label">Options <span className="text-xs text-gray-400">(one per line)</span></label>
              <textarea
                rows={4}
                placeholder={"128GB\n256GB\n512GB"}
                className="input font-mono text-sm resize-y"
                {...register('options_raw')}
              />
            </div>
          )}

          {/* Flags */}
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="w-4 h-4 rounded" {...register('is_required')} />
              Required
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="w-4 h-4 rounded" {...register('is_filterable')} defaultChecked />
              Filterable
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" className="w-4 h-4 rounded" {...register('is_searchable')} defaultChecked />
              Searchable
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Add Attribute'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
