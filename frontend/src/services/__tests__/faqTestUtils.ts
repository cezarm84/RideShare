/**
 * FAQ Test Utilities
 * 
 * This file contains utility functions for testing FAQ-related components.
 * It provides mock data and helper functions that should ONLY be used in tests.
 */

import { FAQ, FAQListResponse } from '../FAQService';
import { mockFAQData } from '../mockData/faqMockData';

/**
 * Get mock FAQ data for testing
 * @returns Mock FAQ data
 */
export const getMockFAQDataForTests = (): FAQListResponse => {
  return mockFAQData;
};

/**
 * Search mock FAQs for testing
 * @param query The search query
 * @returns Filtered mock FAQs
 */
export const searchMockFAQsForTests = (query: string): FAQ[] => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTermLower = query.toLowerCase();

  // Search in categories
  const categoryResults = mockFAQData.categories.flatMap(category =>
    category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTermLower) ||
      faq.answer.toLowerCase().includes(searchTermLower)
    )
  );

  // Search in uncategorized
  const uncategorizedResults = mockFAQData.uncategorized.filter(faq =>
    faq.question.toLowerCase().includes(searchTermLower) ||
    faq.answer.toLowerCase().includes(searchTermLower)
  );

  // Combine results
  return [...categoryResults, ...uncategorizedResults];
};
