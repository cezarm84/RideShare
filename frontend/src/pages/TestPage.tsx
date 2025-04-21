import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageMeta from '../components/common/PageMeta';
import AppLayout from '../layout/AppLayout';

const TestPage: React.FC = () => {
  const { isAuthenticated, user, loading, login, logout } = useAuth();
  const navigate = useNavigate();

  // Log authentication state on mount and when it changes
  useEffect(() => {
    console.log('TestPage - Auth State:', { isAuthenticated, user, loading });
  }, [isAuthenticated, user, loading]);

  const handleTestLogin = async () => {
    try {
      const success = await login('admin@example.com', 'admin123n');
      console.log('Login result:', success);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleTestLogout = () => {
    logout();
    console.log('User logged out');
  };

  const handleNavigateToDriver = () => {
    navigate('/driver');
  };

  return (
    <AppLayout>
      <PageMeta title="Test Page" description="Testing authentication" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Authentication Test Page</h1>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleTestLogin}
              className="px-4 py-2 bg-brand-500 text-white rounded hover:bg-brand-600"
            >
              Test Login (admin@rideshare.com)
            </button>

            <button
              onClick={handleTestLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test Logout
            </button>

            <button
              onClick={handleNavigateToDriver}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Navigate to Driver Page
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Local Storage</h2>
          <div className="space-y-2">
            <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Not present'}</p>
            {localStorage.getItem('token') && (
              <p className="break-all">
                <strong>Token Value:</strong> {localStorage.getItem('token')}
              </p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TestPage;
