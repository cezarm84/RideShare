import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api.service';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/form/input/InputField';
import Select from '../../components/ui/form/select/Select';
import PageMeta from '../../components/common/PageMeta';

interface Enterprise {
  id: number;
  name: string;
  website?: string;
}

interface FakeUser {
  id: number;
  email: string;
  name: string;
  employee_id: string;
  department: string;
  position: string;
}

interface FakeUserResponse {
  message: string;
  count: number;
  users: FakeUser[];
}

const FakeEnterpriseUsersPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedUsers, setGeneratedUsers] = useState<FakeUser[]>([]);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch enterprises
  const fetchEnterprises = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/enterprises');
      setEnterprises(response.data);

      // Set first enterprise as default if available
      if (response.data.length > 0 && !selectedEnterpriseId) {
        setSelectedEnterpriseId(response.data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching enterprises:', err);
      setError(err.response?.data?.detail || 'Failed to fetch enterprises');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.is_admin) {
      fetchEnterprises();
    }
  }, [isAuthenticated, user]);

  // Handle generate users
  const handleGenerateUsers = async () => {
    if (!selectedEnterpriseId) {
      setError('Please select an enterprise');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);
    setGeneratedUsers([]);

    try {
      const response = await api.post<FakeUserResponse>('/admin/test-emails/create-fake-enterprise-users', {
        enterprise_id: selectedEnterpriseId,
        count: userCount
      });

      setSuccess(response.data.message);
      setGeneratedUsers(response.data.users);
    } catch (err: any) {
      console.error('Error generating fake users:', err);
      setError(err.response?.data?.detail || 'Failed to generate fake users');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMeta title="Generate Fake Enterprise Users" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Generate Fake Enterprise Users
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create fake users for testing enterprise features
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enterprise
            </label>
            <Select
              value={selectedEnterpriseId?.toString() || ''}
              onChange={(e) => setSelectedEnterpriseId(parseInt(e.target.value))}
              disabled={loading || enterprises.length === 0}
            >
              <option value="">Select an enterprise</option>
              {enterprises.map((enterprise) => (
                <option key={enterprise.id} value={enterprise.id}>
                  {enterprise.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Users
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={userCount}
              onChange={(e) => setUserCount(parseInt(e.target.value))}
              disabled={loading}
            />
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={handleGenerateUsers}
            disabled={loading || generating || !selectedEnterpriseId}
          >
            {generating ? 'Generating...' : 'Generate Fake Users'}
          </Button>
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

      {/* Generated Users */}
      {generatedUsers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generated Users
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All users have the default password: password123
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Position
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {generatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.employee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.position}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FakeEnterpriseUsersPage;
