import { getAllFAQs, searchFAQs } from '../FAQService';
import { getMockFAQDataForTests, searchMockFAQsForTests } from './faqTestUtils';

// Mock the fetch function
global.fetch = jest.fn();

// Mock console.error to prevent test output pollution
console.error = jest.fn();

describe('FAQService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  describe('getAllFAQs', () => {
    it('fetches FAQs from the API', async () => {
      // Mock the fetch response
      const mockData = getMockFAQDataForTests();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // Call the function
      const result = await getAllFAQs();

      // Check that fetch was called with the correct URL and signal
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/faqs', expect.objectContaining({
        signal: expect.any(Object)
      }));

      // Check that the result is the mock data
      expect(result).toEqual(mockData);
    });

    it('returns empty data structure when the API call fails', async () => {
      // Mock the fetch response to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      // Call the function and expect it to return empty data structure
      const result = await getAllFAQs();
      expect(result).toEqual({
        categories: [],
        uncategorized: []
      });

      // Verify that console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('searchFAQs', () => {
    it('returns empty array when query is less than 2 characters', async () => {
      // Call the function with a short query
      const result = await searchFAQs('a');

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();

      // Check that the result is an empty array
      expect(result).toEqual([]);
    });

    it('fetches search results from the API', async () => {
      // Mock the fetch response
      const mockResults = searchMockFAQsForTests('booking');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      // Call the function
      const result = await searchFAQs('booking');

      // Check that fetch was called with the correct URL and signal
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/faqs/search?query=booking', expect.objectContaining({
        signal: expect.any(Object)
      }));

      // Check that the result is the mock data
      expect(result).toEqual(mockResults);
    });

    it('returns empty array when the API call fails', async () => {
      // Mock the fetch response to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      // Call the function and expect it to return empty array
      const result = await searchFAQs('booking');
      expect(result).toEqual([]);

      // Verify that console.error was called
      expect(console.error).toHaveBeenCalled();
    });
  });
});
