import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import FAQ from '../FAQ';
import * as FAQService from '../../../services/FAQService';
import { getMockFAQDataForTests } from '../../../services/__tests__/faqTestUtils';

// Mock the FAQService
jest.mock('../../../services/FAQService');

describe('FAQ Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock the getAllFAQs function to return a promise that never resolves
    jest.spyOn(FAQService, 'getAllFAQs').mockImplementation(() => new Promise(() => {}));

    render(
      <HelmetProvider>
        <MemoryRouter>
          <FAQ />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Check that loading indicator is displayed
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders FAQ data when loaded successfully', async () => {
    // Mock the getAllFAQs function to return mock data
    const mockData = getMockFAQDataForTests();
    jest.spyOn(FAQService, 'getAllFAQs').mockResolvedValue(mockData);

    render(
      <HelmetProvider>
        <MemoryRouter>
          <FAQ />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Wait for the data to load
    await waitFor(() => {
      // Check that the first category name is displayed
      expect(screen.getByText(mockData.categories[0].name)).toBeInTheDocument();

      // Check that the first FAQ question is displayed
      expect(screen.getByText(mockData.categories[0].faqs[0].question)).toBeInTheDocument();
    });
  });

  it('renders error message when API call fails', async () => {
    // Mock the getAllFAQs function to throw an error
    jest.spyOn(FAQService, 'getAllFAQs').mockRejectedValue(new Error('API error'));

    render(
      <HelmetProvider>
        <MemoryRouter>
          <FAQ />
        </MemoryRouter>
      </HelmetProvider>
    );

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load FAQs. Please try again later.')).toBeInTheDocument();
    });
  });
});
