/**
 * DynamicAttributeField
 *
 * Renders the appropriate HTML input for any attribute definition returned
 * by the backend.  No category-specific logic lives here – the component is
 * fully driven by the `attribute` prop received from the API.
 *
 * Supported attribute_type values:
 *   text | number | select | multiselect | boolean | color
 */

export default function DynamicAttributeField({ attribute, register, error, defaultValue }) {
  const {
    name,
    label,
    attribute_type: type,
    unit,
    is_required: required,
    options = [],
    validation_rules: rawRules = null,
  } = attribute;

  const rules = rawRules || {};

  const fieldName  = `attributes.${name}`;
  const fieldLabel = `${label}${unit ? ` (${unit})` : ''}`;

  // Build register options from attribute definition
  const registerOpts = {
    required: required ? `${label} is required` : false,
    ...(type === 'number' && {
      valueAsNumber: true,
      min: rules.min !== undefined ? { value: rules.min, message: `Min value is ${rules.min}` } : undefined,
      max: rules.max !== undefined ? { value: rules.max, message: `Max value is ${rules.max}` } : undefined,
    }),
    ...(type === 'text' && rules.pattern && {
      pattern: { value: new RegExp(rules.pattern), message: `Invalid format for ${label}` },
    }),
  };

  const inputClass = `input${error ? ' input-error' : ''}`;

  const renderInput = () => {
    switch (type) {
      case 'number':
        return (
          <input
            id={fieldName}
            type="number"
            step="any"
            placeholder={`Enter ${label}${unit ? ` in ${unit}` : ''}`}
            className={inputClass}
            {...register(fieldName, registerOpts)}
          />
        );

      case 'boolean':
        return (
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              id={fieldName}
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              {...register(fieldName)}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </label>
        );

      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              id={`${fieldName}-picker`}
              type="color"
              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              {...register(fieldName, registerOpts)}
            />
            <input
              type="text"
              placeholder="#000000"
              className={inputClass}
              {...register(fieldName, registerOpts)}
            />
          </div>
        );

      case 'select':
        return (
          <select id={fieldName} className={inputClass} {...register(fieldName, registerOpts)}>
            <option value="">Select {label}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-1.5">
            {options.map((opt) => (
              <label key={opt.value} className="inline-flex items-center gap-2 w-full cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.value}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  {...register(fieldName, registerOpts)}
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
      default:
        return (
          <input
            id={fieldName}
            type="text"
            placeholder={`Enter ${label}`}
            className={inputClass}
            {...register(fieldName, {
              ...registerOpts,
              maxLength: rules.maxLength
                ? { value: rules.maxLength, message: `Max ${rules.maxLength} characters` }
                : undefined,
            })}
          />
        );
    }
  };

  // Boolean renders its own label inline
  if (type === 'boolean') {
    return (
      <div className="flex flex-col gap-1">
        {renderInput()}
        {error && <p className="text-xs text-red-500">{error.message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldName} className="label">
        {fieldLabel}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
}
