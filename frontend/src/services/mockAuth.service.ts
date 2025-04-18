/**
 * Mock Authentication Service
 * 
 * This service provides mock authentication functionality for testing purposes.
 * It simulates a backend authentication service without requiring an actual backend.
 */

import { LoginCredentials, UserProfile, AuthResponse } from './auth.service';

// Mock user data
const mockUsers: Record<string, UserProfile> = {
  'user@example.com': {
    id: 1,
    email: 'user@example.com',
    first_name: 'Regular',
    last_name: 'User',
    is_active: true,
    is_superuser: false,
    created_at: new Date().toISOString(),
  },
  'driver@example.com': {
    id: 2,
    email: 'driver@example.com',
    first_name: 'Driver',
    last_name: 'User',
    is_active: true,
    is_superuser: false,
    created_at: new Date().toISOString(),
  },
  'admin@example.com': {
    id: 3,
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    is_superuser: true,
    created_at: new Date().toISOString(),
  },
};

// Mock token
const MOCK_TOKEN = 'mock-jwt-token';

const MockAuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(() => {
        // For testing, accept any well-formed email and password
        if (credentials.username && credentials.password) {
          // Store token in localStorage
          localStorage.setItem('token', MOCK_TOKEN);
          
          // Store the email for getCurrentUser
          localStorage.setItem('currentUserEmail', credentials.username);
          
          resolve({
            access_token: MOCK_TOKEN,
            token_type: 'bearer',
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUserEmail');
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(() => {
        const email = localStorage.getItem('currentUserEmail');
        
        if (email && mockUsers[email]) {
          resolve(mockUsers[email]);
        } else if (email) {
          // If email exists but not in our mock data, create a new user
          const newUser: UserProfile = {
            id: Math.floor(Math.random() * 1000) + 10,
            email: email,
            first_name: 'Test',
            last_name: 'User',
            is_active: true,
            is_superuser: false,
            created_at: new Date().toISOString(),
          };
          
          resolve(newUser);
        } else {
          reject(new Error('User not found'));
        }
      }, 300);
    });
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  verifySession: async () => {
    return new Promise((resolve) => {
      // Always verify session as valid for mock service
      setTimeout(() => {
        resolve({ valid: true });
      }, 100);
    });
  },
};

export default MockAuthService;
