/**
 * Simple FAQ Page
 *
 * A simplified version of the FAQ page with built-in search functionality.
 * This component avoids the infinite loop issues by keeping all state and handlers in one place.
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  getAllFAQs,
  FAQ as FAQType,
  FAQCategory as FAQCategoryType,
  FAQListResponse,
  searchFAQs
} from '../../services/FAQService';
import FAQCategory from '../../components/FAQ/FAQCategory';
import FAQAccordion from '../../components/FAQ/FAQAccordion';
import PageMeta from '../../components/common/PageMeta';
import { debounce } from 'lodash';

/**
 * Simple FAQ page component with built-in search
 */
const FAQ: React.FC = () => {
  // State for all FAQs and categories
  const [faqData, setFaqData] = useState<FAQListResponse | null>(null);
  // State for search results
  const [searchResults, setSearchResults] = useState<FAQType[]>([]);
  // State for search query
  const [query, setQuery] = useState('');
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
  // State for search loading
  const [isSearching, setIsSearching] = useState(false);
  // State for error message
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all FAQs on component mount
   */
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setIsLoading(true);
        const data = await getAllFAQs();
        setFaqData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        // The getAllFAQs function now returns mock data on error
        // so we should still have data to display
        const fallbackData = await getAllFAQs();
        setFaqData(fallbackData);

        // Only show error if we still don't have data
        if (!fallbackData || (fallbackData.categories.length === 0 && fallbackData.uncategorized.length === 0)) {
          setError('Failed to load FAQs. Please try again later.');
        } else {
          setError(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  /**
   * Handle search input change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length >= 2) {
      setIsSearching(true);
      debouncedSearch(value);
    } else {
      setSearchResults([]);
    }
  };

  /**
   * Clear search
   */
  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
  };

  /**
   * Debounced search function
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = React.useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const results = await searchFAQs(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching FAQs:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  /**
   * Cleanup debounced search on unmount
   */
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  /**
   * Determine if we're in search mode
   */
  const isSearchMode = searchResults.length > 0 || (query.trim().length >= 2 && !isSearching);

  return (
    <>
      <PageMeta title="Frequently Asked Questions" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/images/logo/rideshare-logo-dark.svg"
              alt="RideShare Logo"
              className="h-16"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Find answers to common questions about RideShare's collective mobility platform, our innovative approach to transportation, booking process, and more.
          </p>
        </div>

        {/* Search input */}
        <div className="mb-8" data-testid="faq-search">
          <form className="relative" onSubmit={(e) => e.preventDefault()}>
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
                onChange={handleSearchChange}
                aria-label="Search FAQs"
              />

              {/* Loading indicator or clear button */}
              {query.length > 0 && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {isSearching ? (
                    <svg
                      className="animate-spin h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      data-testid="loading-spinner"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:text-gray-500 dark:focus:text-gray-300"
                      onClick={clearSearch}
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" data-testid="loading-spinner" role="status"></div>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4 my-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search results */}
        {isSearchMode && !isLoading && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Search Results ({searchResults.length})
            </h2>

            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((faq) => (
                  <FAQAccordion key={faq.id} faq={faq} initiallyExpanded={searchResults.length === 1} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No results found. Try a different search term.
              </p>
            )}

            <button
              className="mt-4 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium flex items-center"
              onClick={clearSearch}
            >
              <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to all FAQs
            </button>
          </div>
        )}

        {/* All FAQs by category */}
        {!isSearchMode && !isLoading && faqData && (
          <div>
            {/* Categories */}
            {faqData.categories.map((category) => (
              <FAQCategory key={category.id} category={category} />
            ))}

            {/* Uncategorized FAQs */}
            {faqData.uncategorized.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Other Questions
                </h2>
                <div className="space-y-4">
                  {faqData.uncategorized.map((faq) => (
                    <FAQAccordion key={faq.id} faq={faq} />
                  ))}
                </div>
              </div>
            )}

            {/* No FAQs found */}
            {faqData.categories.length === 0 && faqData.uncategorized.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No FAQs available at the moment. Please check back later.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contact support section */}
        <div className="mt-12 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-900/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Still have questions?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            If you couldn't find the answer to your question, our support team is here to help.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            Contact Support
          </a>
        </div>
      </div>
    </>
  );
};

export default FAQ;
