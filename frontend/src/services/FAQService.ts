/**
 * FAQ Service - Provides methods for interacting with the FAQ API
 *
 * This service handles fetching FAQ data from the backend API,
 * including categories, individual FAQs, and search functionality.
 */

import { API_BASE_URL } from '../config/constants';
import { getMockFAQData } from './mockData/faqMockData';

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
    const response = await fetch(`${API_BASE_URL}/faqs`);

    if (!response.ok) {
      throw new Error(`Error fetching FAQs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    console.log('Falling back to mock data');
    // Fall back to mock data when API is not available
    return await getMockFAQData();
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
    const response = await fetch(`${API_BASE_URL}/faqs/${faqId}`);

    if (!response.ok) {
      throw new Error(`Error fetching FAQ: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching FAQ ${faqId}:`, error);
    return null;
  }
};

/**
 * Search FAQs by query
 * @param query The search query
 * @returns Promise with matching FAQs
 */
export const searchFAQs = async (query: string): Promise<FAQ[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/faqs/search?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`Error searching FAQs: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error searching FAQs with query "${query}":`, error);
    console.log('Falling back to client-side search with mock data');

    // Fall back to client-side search with mock data
    const mockData = await getMockFAQData();
    const searchTermLower = query.toLowerCase();

    // Search in categories
    const categoryResults = mockData.categories.flatMap(category =>
      category.faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTermLower) ||
        faq.answer.toLowerCase().includes(searchTermLower)
      )
    );

    // Search in uncategorized
    const uncategorizedResults = mockData.uncategorized.filter(faq =>
      faq.question.toLowerCase().includes(searchTermLower) ||
      faq.answer.toLowerCase().includes(searchTermLower)
    );

    // Combine results
    return [...categoryResults, ...uncategorizedResults];
  }
};
