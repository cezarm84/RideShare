import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const DriverLayout = () => {
  const { user, isAuthenticated } = useAuth();

  // Check if user is authenticated and has admin privileges
  // The user object might have is_admin, is_superadmin, or is_superuser properties
  const isAdmin = isAuthenticated && (user?.is_admin || user?.is_superadmin || user?.is_superuser);

  // Check if user is a driver (user_type or role property)
  const isDriver = isAuthenticated && (
    user?.user_type === 'driver' ||
    user?.role === 'driver' ||
    user?.is_driver
  );

  // Only allow drivers or admins to access driver pages
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // If user is authenticated but not a driver or admin, redirect to dashboard
  if (!isDriver && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default DriverLayout;
