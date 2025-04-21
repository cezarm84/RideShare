import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api.service';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/form/input/InputField';
import Checkbox from '../../components/ui/form/input/Checkbox';
import PageMeta from '../../components/common/PageMeta';
import { formatDate } from '../../utils/dateUtils';

interface EmailVerificationStatus {
  user_id: number;
  email: string;
  is_verified: boolean;
  verification_token?: string;
  verification_token_expires?: string;
  last_verification_sent?: string;
}

const EmailVerificationAdmin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<EmailVerificationStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unverifiedCount, setUnverifiedCount] = useState<number>(0);

  // Filter states
  const [emailFilter, setEmailFilter] = useState<string>('');
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | null>(false);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch unverified count
  const fetchUnverifiedCount = async () => {
    try {
      const response = await api.get('/admin/email/unverified-count');
      setUnverifiedCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unverified count:', err);
    }
  };

  // Fetch users based on filters
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = '/admin/email/verification-status?';

      if (emailFilter) {
        url += `email=${encodeURIComponent(emailFilter)}&`;
      }

      if (verifiedFilter !== null) {
        url += `verified=${verifiedFilter}&`;
      }

      const response = await api.get(url);
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.is_admin) {
      fetchUsers();
      fetchUnverifiedCount();
    }
  }, [isAuthenticated, user]);

  // Fetch when filters change
  useEffect(() => {
    if (isAuthenticated && user?.is_admin) {
      fetchUsers();
    }
  }, [verifiedFilter]);

  // Handle resend verification email
  const handleResendVerification = async (userId: number) => {
    try {
      setSuccess(null);
      setError(null);

      const response = await api.post(`/admin/email/resend-verification/${userId}`);

      setSuccess(response.data.message);

      // Refresh the list
      fetchUsers();
    } catch (err: any) {
      console.error('Error resending verification:', err);
      setError(err.response?.data?.detail || 'Failed to resend verification email');
    }
  };

  // Handle manual verification
  const handleManualVerification = async (userId: number) => {
    try {
      setSuccess(null);
      setError(null);

      const response = await api.post(`/admin/email/verify-user/${userId}`);

      setSuccess(response.data.message);

      // Refresh the list and count
      fetchUsers();
      fetchUnverifiedCount();
    } catch (err: any) {
      console.error('Error manually verifying user:', err);
      setError(err.response?.data?.detail || 'Failed to verify user');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMeta title="Email Verification Management" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Email Verification Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage user email verification status
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Verification Statistics
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            <p className="text-sm text-gray-500 dark:text-gray-400">Unverified Users</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{unverifiedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filters
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              placeholder="Filter by email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
            />
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <Checkbox
              checked={verifiedFilter === true}
              onChange={() => setVerifiedFilter(verifiedFilter === true ? null : true)}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Verified</span>
          </div>

          <div className="w-full md:w-auto flex items-center gap-2">
            <Checkbox
              checked={verifiedFilter === false}
              onChange={() => setVerifiedFilter(verifiedFilter === false ? null : false)}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Unverified</span>
          </div>

          <div className="w-full md:w-auto">
            <Button
              onClick={() => fetchUsers()}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-md mb-6">
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Token Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.user_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_verified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.verification_token_expires
                        ? formatDate(new Date(user.verification_token_expires))
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!user.is_verified && (
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            onClick={() => handleResendVerification(user.user_id)}
                          >
                            Resend Email
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => handleManualVerification(user.user_id)}
                          >
                            Verify
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationAdmin;
