/**
 * SearchBar with debounced autocomplete suggestions.
 */
import { useState, useRef, useEffect } from 'react';
import { useSuggestions } from '../../hooks/useSearch';

export default function SearchBar({ value, onSearch, placeholder = 'Search products…' }) {
  const [query, setQuery]         = useState(value || '');
  const [showDrop, setShowDrop]   = useState(false);
  const containerRef              = useRef(null);

  const { data: suggestions = [] } = useSuggestions(query);

  // Sync external value changes
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function submit(q = query) {
    onSearch(q);
    setShowDrop(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="search"
            value={query}
            placeholder={placeholder}
            className="input pl-9 pr-4 w-full"
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDrop(true);
            }}
            onFocus={() => setShowDrop(true)}
          />
        </div>
        <button type="submit" className="btn-primary whitespace-nowrap">
          Search
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {showDrop && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.id || s.slug}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between gap-2"
                onClick={() => submit(s.name)}
              >
                <span className="text-sm text-gray-800 font-medium">{s.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{s.category_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
