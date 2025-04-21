import React, { createContext, useContext, useState, useEffect } from 'react';
// Import the real auth service
import RealAuthService, { SignupCredentials } from '../services/auth.service';
import { UserProfile } from '../services/auth.service';
import api from '../services/api';

// Use the real service for production
const AuthService = RealAuthService;

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        console.log('Token in localStorage:', token ? 'exists' : 'not found');

        if (AuthService.isAuthenticated()) {
          console.log('User is authenticated, fetching user data');
          try {
            const userData = await AuthService.getCurrentUser();
            console.log('User data fetched successfully:', userData);
            // Save user data to state and localStorage
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
            console.log('Authentication state set to true and persisted to localStorage');
          } catch (fetchErr) {
            console.error('Failed to fetch user data, but keeping session active:', fetchErr);
            // Don't log out - just set authenticated state based on token
            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', 'true');
            console.log('Authentication state set to true despite fetch error and persisted to localStorage');

            // Try to create a minimal user object from the token or localStorage
            const mockUserEmail = localStorage.getItem('mock_user_email');
            if (mockUserEmail) {
              const mockUser = {
                id: 1,
                email: mockUserEmail,
                first_name: 'User',
                last_name: '',
                is_active: true,
                is_superuser: mockUserEmail.includes('admin'),
                is_admin: mockUserEmail.includes('admin'),
                is_superadmin: mockUserEmail.includes('admin'),
                created_at: new Date().toISOString()
              };
              console.log('Created mock user from localStorage:', mockUser);
              setUser(mockUser);
              localStorage.setItem('user', JSON.stringify(mockUser));
              console.log('Created mock user and persisted to localStorage');
            }
          }
        } else {
          console.log('User is not authenticated');
          setIsAuthenticated(false);
          localStorage.removeItem('isAuthenticated');
          setUser(null);
          localStorage.removeItem('user');
          console.log('Authentication state cleared from state and localStorage');
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        // Clear any error state
        setError(null);
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        setUser(null);
        localStorage.removeItem('user');
        console.log('Authentication state cleared due to error');
      } finally {
        setLoading(false);
        console.log('Final auth state:', { isAuthenticated, user });
      }
    };

    checkAuth();

    // Set up an interval to refresh the token or check session validity
    const intervalId = setInterval(() => {
      if (AuthService.isAuthenticated()) {
        // Silently verify the token is still valid
        AuthService.verifySession().catch(err => {
          console.error('Session verification failed:', err);

          // Only log out for authentication errors (401/403)
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            console.log('Authentication error - logging out');
            AuthService.logout();
            setUser(null);
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            localStorage.removeItem('isAuthenticated');
          } else {
            console.log('Non-authentication error - keeping session active');
          }
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Login attempt with email:', email);
    setLoading(true);
    setError(null);
    try {
      const authResponse = await AuthService.login({ username: email, password });
      console.log('Login successful, token received:', !!authResponse.access_token);

      try {
        const userData = await AuthService.getCurrentUser();
        console.log('User data fetched successfully after login:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        console.log('Authentication state set to true after login and persisted to localStorage');
        return true; // Return success status
      } catch (userErr) {
        console.error('Failed to fetch user data after login:', userErr);
        // Even if we can't get user data, we're still authenticated with a token
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        console.log('Authentication state set to true despite user data fetch error and persisted to localStorage');
        return true; // Still return success since we have a token
      }
    } catch (err: any) {
      console.error('Login error in AuthContext:', err);

      // Check if this is an email verification error (403 Forbidden)
      if (err.response && err.response.status === 403 &&
          err.response.data && err.response.data.detail &&
          err.response.data.detail.includes('Email not verified')) {
        setError('Email not verified. Please check your inbox for a verification email.');
      } else {
        setError('Invalid credentials. Please try again.');
      }

      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
      setUser(null);
      localStorage.removeItem('user');
      return false; // Return failure status
    } finally {
      setLoading(false);
      console.log('Final auth state after login attempt:', { isAuthenticated: isAuthenticated, user: user });
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.signup(credentials);
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      console.log('User signed up successfully, authentication state persisted to localStorage');
    } catch (err) {
      setError('Signup failed. Please try again.');
      setIsAuthenticated(false);
      localStorage.removeItem('isAuthenticated');
      setUser(null);
      localStorage.removeItem('user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user from AuthContext');
    // Clear auth state
    setUser(null);
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');

    // Clear token and other auth data
    AuthService.logout();

    // Clear API authorization header
    delete api.defaults.headers.common['Authorization'];

    console.log('User logged out successfully, auth state cleared from state and localStorage');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
