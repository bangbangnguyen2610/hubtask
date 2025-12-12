import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, Loader2, Sparkles, Type } from 'lucide-react';
import { searchTasks } from '../services/dbService';

export function SearchBar({ onResults, onClear, placeholder = 'Search tasks...' }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState(null);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      onClear?.();
      setSearchType(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const result = await searchTasks(searchQuery, { limit: 20 });
      setSearchType(result.searchType);
      onResults?.(result.tasks, result.searchType);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [onResults, onClear]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  const handleClear = () => {
    setQuery('');
    setSearchType(null);
    setError(null);
    onClear?.();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all shadow-sm">
        {isSearching ? (
          <Loader2 size={18} className="text-primary-500 animate-spin flex-shrink-0" />
        ) : (
          <Search size={18} className="text-surface-400 flex-shrink-0" />
        )}

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-surface-900 dark:text-white placeholder-surface-400 text-sm"
        />

        {/* Search type indicator */}
        {searchType && query && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            searchType === 'semantic'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          }`}>
            {searchType === 'semantic' ? (
              <>
                <Sparkles size={10} />
                AI
              </>
            ) : (
              <>
                <Type size={10} />
                Text
              </>
            )}
          </div>
        )}

        {query && (
          <button
            onClick={handleClear}
            className="p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
