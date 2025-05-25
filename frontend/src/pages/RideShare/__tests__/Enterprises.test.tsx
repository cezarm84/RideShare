import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Enterprises from '../Enterprises';

// Mock the API module
jest.mock('@/services/api', () => ({
  default: {
    get: jest.fn(),
  },
}));

// Mock the auth context
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
};

// Mock PageMeta component
jest.mock('@/components/common/PageMeta', () => {
  return function PageMeta() {
    return null;
  };
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Enterprises Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the enterprises page component', () => {
    renderWithProviders(<Enterprises />);

    // Check if the component renders without crashing
    expect(screen.getByText('Loading enterprises...')).toBeInTheDocument();
  });
});
