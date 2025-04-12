import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Polyfill TextEncoder for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = function TextEncoder() {
    return {
      encode: function encode(str) {
        const buf = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
          buf[i] = str.charCodeAt(i);
        }
        return buf;
      }
    };
  };
}

// Create a simple wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Mock the router context directly in tests that need it
// Don't use requireActual which causes TextEncoder issues
export const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNavigate: jest.fn(() => mockNavigate),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

// Make mockNavigate available for tests
(jest.requireMock('react-router-dom').useNavigate as jest.Mock).mockReturnValue = jest.fn();

// Mock the auth context
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
    loading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Custom render function that includes the providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: TestWrapper, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };
