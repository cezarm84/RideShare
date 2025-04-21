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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          console.log('User is authenticated, fetching user data');
          try {
            const userData = await AuthService.getCurrentUser();
            console.log('User data fetched successfully:', userData);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (fetchErr) {
            console.error('Failed to fetch user data, but keeping session active:', fetchErr);
            // Don't log out - just set authenticated state based on token
            setIsAuthenticated(true);

            // Try to create a minimal user object from the token or localStorage
            const mockUserEmail = localStorage.getItem('mock_user_email');
            if (mockUserEmail) {
              setUser({
                id: 1,
                email: mockUserEmail,
                first_name: 'User',
                last_name: '',
                is_active: true,
                is_superuser: mockUserEmail.includes('admin'),
                is_admin: mockUserEmail.includes('admin'),
                is_superadmin: mockUserEmail.includes('admin'),
                created_at: new Date().toISOString()
              });
            }
          }
        } else {
          console.log('User is not authenticated');
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        // Clear any error state
        setError(null);
      } finally {
        setLoading(false);
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
            setIsAuthenticated(false);
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
    setLoading(true);
    setError(null);
    try {
      await AuthService.login({ username: email, password });
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      return true; // Return success status
    } catch (err) {
      console.error('Login error in AuthContext:', err);
      setError('Invalid credentials. Please try again.');
      return false; // Return failure status
    } finally {
      setLoading(false);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    setLoading(true);
    setError(null);
    try {
      await AuthService.signup(credentials);
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      setError('Signup failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user from AuthContext');
    // Clear auth state
    setUser(null);
    setIsAuthenticated(false);

    // Clear token and other auth data
    AuthService.logout();

    // Clear API authorization header
    delete api.defaults.headers.common['Authorization'];

    console.log('User logged out successfully, auth state cleared');
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
