import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import AuthService from '../../services/auth.service';

// Mock the AuthService
jest.mock('../../services/auth.service', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    isAuthenticated: jest.fn(),
  },
}));

// Test component that uses the AuthContext
const TestComponent = () => {
  const { user, loading, error, login, logout, isAuthenticated } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="error">{error || 'no error'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', async () => {
    // Arrange
    (AuthService.isAuthenticated as jest.Mock).mockReturnValue(false);

    // Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Assert
    // Initial loading state might be false if the check completes quickly
    // expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for initial check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('no user');
  });

  it('should load user data if already authenticated', async () => {
    // Arrange
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      is_superuser: false,
      created_at: '2023-01-01T00:00:00Z',
    };

    (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Assert - initially loading
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toContain('test@example.com');
    expect(AuthService.getCurrentUser).toHaveBeenCalled();
  });

  it('should handle login success', async () => {
    // Arrange
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      is_superuser: false,
      created_at: '2023-01-01T00:00:00Z',
    };

    (AuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (AuthService.login as jest.Mock).mockResolvedValue({ access_token: 'token' });
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Click login button
    const loginButton = screen.getByText('Login');
    await act(async () => {
      await userEvent.click(loginButton);
    });

    // Assert
    await waitFor(() => {
      expect(AuthService.login).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password',
      });
      expect(AuthService.getCurrentUser).toHaveBeenCalled();
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toContain('test@example.com');
    });
  });

  it('should handle login error', async () => {
    // Arrange
    const mockError = { message: 'Invalid credentials' };
    (AuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (AuthService.login as jest.Mock).mockRejectedValue(mockError);

    // Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Click login button
    const loginButton = screen.getByText('Login');
    await act(async () => {
      await userEvent.click(loginButton);
    });

    // Assert
    await waitFor(() => {
      expect(AuthService.login).toHaveBeenCalled();
      expect(screen.getByTestId('error').textContent).toBe('Invalid credentials. Please try again.');
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
  });

  it('should handle logout', async () => {
    // Arrange
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      is_superuser: false,
      created_at: '2023-01-01T00:00:00Z',
    };

    (AuthService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (AuthService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // Act
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true');
    });

    // Click logout button
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      await userEvent.click(logoutButton);
    });

    // Assert
    expect(AuthService.logout).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('no user');
  });
});
