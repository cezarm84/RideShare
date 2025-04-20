import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * A route component that protects admin-only routes.
 * It checks if the user is authenticated AND has admin privileges.
 * If not, it redirects to the sign-in page or dashboard based on authentication status.
 */
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" message="Loading your profile..." />;
  }

  // If not authenticated, redirect to sign-in
  // but only for admin routes
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting from admin route to sign-in');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If authenticated but not admin, redirect to dashboard
  const isAdmin = user?.is_admin || user?.is_superadmin || user?.is_superuser;
  if (!isAdmin) {
    console.log('User is authenticated but not an admin, redirecting to dashboard');
    return <Navigate to="/" replace />;
  }

  console.log('User is authenticated and has admin privileges, allowing access');

  // User is authenticated and has admin privileges
  return <>{children}</>;
};

export default AdminProtectedRoute;
