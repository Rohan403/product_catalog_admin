/**
 * FilterPanel
 *
 * Renders dynamic filter controls driven entirely by the backend's
 * /search/filters/:categoryId response.  No hardcoded fields.
 *
 * Props:
 *   filters      – array from searchApi.getFilterOptions()
 *   activeFilters – { [attrName]: value | [values] | { min, max } }
 *   onChange     – (attrName, value) => void
 *
 */

import { useState } from 'react';

export default function FilterPanel({ filters = [], activeFilters = {}, onChange }) {
  if (!filters.length) return null;

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="card p-4 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
          {Object.keys(activeFilters).length > 0 && (
            <button
              className="text-xs text-primary-600 hover:underline"
              onClick={() => {
                for (const key of Object.keys(activeFilters)) onChange(key, null);
              }}
            >
              Clear all
            </button>
          )}
        </div>

        {filters.map((filter) => (
          <FilterSection
            key={filter.name}
            filter={filter}
            value={activeFilters[filter.name]}
            onChange={(val) => onChange(filter.name, val)}
          />
        ))}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual filter section dispatcher
// ─────────────────────────────────────────────────────────────────────────────
function FilterSection({ filter, value, onChange }) {
  const label = filter.unit ? `${filter.label} (${filter.unit})` : filter.label;

  switch (filter.type) {
    case 'number':
      return <RangeFilter label={label} filter={filter} value={value} onChange={onChange} />;
    case 'select':
    case 'multiselect':
    case 'color':
    case 'text':
    default:
      return <CheckboxFilter label={label} filter={filter} value={value} onChange={onChange} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox list filter (for select, multiselect, color)
// ─────────────────────────────────────────────────────────────────────────────
function CheckboxFilter({ label, filter, value, onChange }) {
  const [open, setOpen] = useState(true);
  const options = filter.options || [];
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(optValue) {
    if (selected.includes(optValue)) {
      const next = selected.filter((v) => v !== optValue);
      onChange(next.length ? next : null);
    } else {
      onChange([...selected, optValue]);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 flex-1">
                {opt.value}
              </span>
              <span className="text-xs text-gray-400">{opt.count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Min/Max range filter (for number attributes)
// ─────────────────────────────────────────────────────────────────────────────
function RangeFilter({ label, filter, value, onChange }) {
  const [open, setOpen] = useState(true);

  const currentMin = value?.min ?? '';
  const currentMax = value?.max ?? '';

  function emit(min, max) {
    if (min === '' && max === '') {
      onChange(null);
    } else {
      const next = {};
      if (min !== '') next.min = Number(min);
      if (max !== '') next.max = Number(max);
      onChange(next);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={`Min${filter.min != null ? ` (${filter.min})` : ''}`}
            value={currentMin}
            step="any"
            className="input text-sm w-full"
            onChange={(e) => emit(e.target.value, currentMax)}
          />
          <span className="text-gray-400 flex-shrink-0">–</span>
          <input
            type="number"
            placeholder={`Max${filter.max != null ? ` (${filter.max})` : ''}`}
            value={currentMax}
            step="any"
            className="input text-sm w-full"
            onChange={(e) => emit(currentMin, e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
