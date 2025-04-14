/**
 * FAQSearch Component
 *
 * A search input component for filtering FAQs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FAQ, searchFAQs } from '../../services/FAQService';
import { debounce } from 'lodash';

interface FAQSearchProps {
  /**
   * Callback function that receives the search results
   */
  onSearchResults: (results: FAQ[]) => void;

  /**
   * Optional CSS class name for additional styling
   */
  className?: string;
}

/**
 * FAQSearch component provides a search input for filtering FAQs
 */
const FAQSearch: React.FC<FAQSearchProps> = ({ onSearchResults, className = '' }) => {
  // State for the search query
  const [query, setQuery] = useState('');
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Debounced search function to avoid too many API calls
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        onSearchResults([]);
        setIsLoading(false);
        return;
      }

      try {
        const results = await searchFAQs(searchQuery);
        onSearchResults(results);
      } catch (error) {
        console.error('Error searching FAQs:', error);
        onSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [onSearchResults]
  );

  /**
   * Effect to trigger search when query changes
   */
  useEffect(() => {
    if (query.trim().length >= 2) {
      setIsLoading(true);
      debouncedSearch(query);
    } else if (query.trim().length === 0) {
      onSearchResults([]);
    }

    // Cleanup function to cancel debounced search on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch, onSearchResults]);

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setIsLoading(true);
      debouncedSearch.cancel();
      debouncedSearch(query);
    }
  };

  return (
    <div className={`mb-8 ${className}`} data-testid="faq-search">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          {/* Search icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Search input */}
          <input
            type="text"
            name="search"
            id="faq-search-input"
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-brand-500 dark:focus:border-brand-400"
            placeholder="Search frequently asked questions..."
            value={query}
            onChange={handleInputChange}
            aria-label="Search FAQs"
          />

          {/* Loading indicator or clear button */}
          {query.length > 0 && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:text-gray-500 dark:focus:text-gray-300"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Search instructions */}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Type at least 2 characters to search. Search for keywords like "booking", "payment", "driver", etc.
        </p>
      </form>
    </div>
  );
};

export default FAQSearch;
