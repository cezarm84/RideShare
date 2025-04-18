import React, { createContext, useContext, useState, useEffect } from 'react';
// Import the real auth service
import RealAuthService from '../services/auth.service';
import { UserProfile } from '../services/auth.service';

// Use the real service for production
const AuthService = RealAuthService;

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
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
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        // Clear any error state
        setError(null);
        // Log the user out
        AuthService.logout();
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
          AuthService.logout();
          setUser(null);
          setIsAuthenticated(false);
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
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
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
