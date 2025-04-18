/**
 * FAQ Service - Provides methods for interacting with the FAQ API
 *
 * This service handles fetching FAQ data from the backend API,
 * including categories, individual FAQs, and search functionality.
 */

import { API_BASE_URL } from '../config/constants';
// Import mock data for fallback when API is unavailable
import { mockFAQData } from './mockData/faqMockData';
// Import the API client for making requests
import { apiClient } from './apiClient';

/**
 * Helper function to search in mock data
 * @param query The search query
 * @returns Array of matching FAQs
 */
const searchInMockData = (query: string): FAQ[] => {
  const searchTerm = query.toLowerCase();

  // Search in mock categories
  const categoryResults = mockFAQData.categories.flatMap(category =>
    category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm) ||
      faq.answer.toLowerCase().includes(searchTerm)
    )
  );

  // Search in mock uncategorized
  const uncategorizedResults = mockFAQData.uncategorized.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm) ||
    faq.answer.toLowerCase().includes(searchTerm)
  );

  // Combine and return results
  return [...categoryResults, ...uncategorizedResults];
};

/**
 * FAQ Category interface
 */
export interface FAQCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  faqs: FAQ[];
}

/**
 * FAQ interface
 */
export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category_id: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * FAQ with Category interface
 */
export interface FAQWithCategory extends FAQ {
  category: FAQCategory | null;
}

/**
 * FAQ List Response interface
 */
export interface FAQListResponse {
  categories: FAQCategory[];
  uncategorized: FAQ[];
}

/**
 * Get all FAQs organized by category
 * @returns Promise with FAQs organized by category
 */
export const getAllFAQs = async (): Promise<FAQListResponse> => {
  try {
    // Use the API client to make the request
    console.log('Fetching FAQs from API...');
    const data = await apiClient.get<FAQListResponse>('/faqs');
    console.log('Successfully fetched FAQs from API');
    return data;
  } catch (error) {
    console.log('Error fetching FAQs from API, using mock data:', error);
    return mockFAQData;
  }
};

/**
 * Get all FAQ categories
 * @returns Promise with FAQ categories
 */
export const getFAQCategories = async (): Promise<FAQCategory[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/faqs/categories`);

    if (!response.ok) {
      throw new Error(`Error fetching FAQ categories: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    return [];
  }
};

/**
 * Get a specific FAQ category with its FAQs
 * @param categoryId The ID of the category to fetch
 * @returns Promise with the FAQ category and its FAQs
 */
export const getFAQCategory = async (categoryId: number): Promise<FAQCategory | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/faqs/categories/${categoryId}`);

    if (!response.ok) {
      throw new Error(`Error fetching FAQ category: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching FAQ category ${categoryId}:`, error);
    return null;
  }
};

/**
 * Get a specific FAQ
 * @param faqId The ID of the FAQ to fetch
 * @returns Promise with the FAQ
 */
export const getFAQ = async (faqId: number): Promise<FAQWithCategory | null> => {
  try {
    // Use the API client to make the request
    console.log(`Fetching FAQ ${faqId} from API...`);
    const data = await apiClient.get<FAQWithCategory>(`/faqs/${faqId}`);
    console.log(`Successfully fetched FAQ ${faqId} from API`);
    return data;
  } catch (error) {
    console.log(`Error fetching FAQ ${faqId} from API, using mock data if available:`, error);
    // Try to find the FAQ in mock data
    const mockFaq = mockFAQData.categories
      .flatMap(category => category.faqs)
      .concat(mockFAQData.uncategorized)
      .find(faq => faq.id === faqId);

    if (mockFaq) {
      const category = mockFaq.category_id
        ? mockFAQData.categories.find(cat => cat.id === mockFaq.category_id)
        : null;

      return {
        ...mockFaq,
        category: category ? {
          id: category.id,
          name: category.name,
          description: category.description,
          icon: category.icon,
        } : null
      };
    }
    return null;
  }
};

/**
 * Search FAQs by query
 * @param query The search query
 * @returns Promise with matching FAQs
 */
export const searchFAQs = async (query: string): Promise<FAQ[]> => {
  try {
    // Validate query length to match backend requirements
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Use the API client to make the request
    console.log('Searching FAQs from API...');
    const data = await apiClient.get<FAQ[]>(`/faqs/search?query=${encodeURIComponent(query)}`);
    console.log('Successfully searched FAQs from API');
    return data;
  } catch (error) {
    console.log('Error searching FAQs from API, using mock data:', error);
    return searchInMockData(query);
  }
};
