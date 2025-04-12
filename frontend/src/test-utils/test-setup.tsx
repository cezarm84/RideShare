// Add TextEncoder polyfill
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import React, { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Custom render function that includes all necessary providers
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    ...renderOptions
  } = {}
) {
  const queryClient = createTestQueryClient();
  window.history.pushState({}, 'Test page', route);

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>,
    renderOptions
  );
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});
