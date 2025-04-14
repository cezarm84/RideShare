/**
 * FAQ Page
 *
 * Displays a searchable list of frequently asked questions organized by categories.
 * Users can search for specific questions or browse by category.
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  getAllFAQs,
  FAQ as FAQType,
  FAQCategory as FAQCategoryType,
  FAQListResponse
} from '../../services/FAQService';
import FAQSearch from '../../components/FAQ/FAQSearch';
import FAQCategory from '../../components/FAQ/FAQCategory';
import FAQAccordion from '../../components/FAQ/FAQAccordion';
import PageMeta from '../../components/common/PageMeta';

/**
 * FAQ page component
 */
const FAQ: React.FC = () => {
  // State for all FAQs and categories
  const [faqData, setFaqData] = useState<FAQListResponse | null>(null);
  // State for search results
  const [searchResults, setSearchResults] = useState<FAQType[]>([]);
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(true);
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
        setError('Failed to load FAQs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  /**
   * Handle search results
   */
  const handleSearchResults = (results: FAQType[]) => {
    setSearchResults(results);
  };

  /**
   * Determine if we're in search mode
   */
  const isSearchMode = searchResults.length > 0;

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

        {/* Search component */}
        <FAQSearch onSearchResults={handleSearchResults} />

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
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
              onClick={() => setSearchResults([])}
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
