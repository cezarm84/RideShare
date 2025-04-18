import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import FAQ from '../FAQ';
import * as FAQService from '../../../services/FAQService';
import { getMockFAQDataForTests, searchMockFAQsForTests } from '../../../services/__tests__/faqTestUtils';

// Mock the FAQService
jest.mock('../../../services/FAQService');

describe('FAQ Search Functionality', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Mock the getAllFAQs function to return mock data
    const mockData = getMockFAQDataForTests();
    jest.spyOn(FAQService, 'getAllFAQs').mockResolvedValue(mockData);
  });

  it('renders the search input', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <FAQ />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search frequently asked questions...')).toBeInTheDocument();
    });
  });

  it('shows search results when user types in search box', async () => {
    // Mock the searchFAQs function to return search results
    const mockResults = searchMockFAQsForTests('booking');
    jest.spyOn(FAQService, 'searchFAQs').mockResolvedValue(mockResults);

    render(
      <HelmetProvider>
        <MemoryRouter>
          <FAQ />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search frequently asked questions...')).toBeInTheDocument();
    });

    // Type in the search box
    const searchInput = screen.getByPlaceholderText('Search frequently asked questions...');
    fireEvent.change(searchInput, { target: { value: 'booking' } });

    // Wait for the search results to be displayed
    await waitFor(() => {
      expect(screen.getByText(`Search Results (${mockResults.length})`)).toBeInTheDocument();
    });
  });

  it('shows loading indicator while searching', async () => {
    // Mock the searchFAQs function to return a promise that resolves after a delay
    jest.spyOn(FAQService, 'searchFAQs').mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(
      <HelmetProvider>
        <MemoryRouter>
          <FAQ />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search frequently asked questions...')).toBeInTheDocument();
    });

    // Type in the search box
    const searchInput = screen.getByPlaceholderText('Search frequently asked questions...');
    fireEvent.change(searchInput, { target: { value: 'booking' } });

    // Check that loading indicator is displayed
    // The loading spinner is an SVG with animate-spin class
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('clears the search when clear button is clicked', async () => {
    // Mock the searchFAQs function to return search results
    const mockResults = searchMockFAQsForTests('booking');
    jest.spyOn(FAQService, 'searchFAQs').mockResolvedValue(mockResults);

    render(
      <HelmetProvider>
        <MemoryRouter>
          <FAQ />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search frequently asked questions...')).toBeInTheDocument();
    });

    // Type in the search box
    const searchInput = screen.getByPlaceholderText('Search frequently asked questions...');
    fireEvent.change(searchInput, { target: { value: 'booking' } });

    // Wait for the search results to be displayed
    await waitFor(() => {
      expect(screen.getByText(`Search Results (${mockResults.length})`)).toBeInTheDocument();
    });

    // Click the clear button
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    // Check that the search results are cleared
    await waitFor(() => {
      expect(screen.queryByText(`Search Results (${mockResults.length})`)).not.toBeInTheDocument();
    });
  });
});
