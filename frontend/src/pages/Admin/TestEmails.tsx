import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api.service';
import Button from '../../components/ui/button/Button';
import PageMeta from '../../components/common/PageMeta';
import { formatDate } from '../../utils/dateUtils';

interface TestEmail {
  id: number;
  to_email: string;
  from_email: string;
  subject: string;
  html_content: string;
  text_content?: string;
  cc?: string;
  bcc?: string;
  created_at: string;
  user_id?: number;
}

const TestEmailsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [emails, setEmails] = useState<TestEmail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<TestEmail | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!isAuthenticated || !user?.is_admin) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch emails
  const fetchEmails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/test-emails/test-emails');
      setEmails(response.data);
    } catch (err: any) {
      console.error('Error fetching test emails:', err);
      setError(err.response?.data?.detail || 'Failed to fetch test emails');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.is_admin) {
      fetchEmails();
    }
  }, [isAuthenticated, user]);

  // Handle delete email
  const handleDeleteEmail = async (id: number) => {
    try {
      setSuccess(null);
      setError(null);

      await api.delete(`/admin/test-emails/test-emails/${id}`);

      setSuccess(`Email with ID ${id} deleted successfully`);

      // Refresh the list
      fetchEmails();
    } catch (err: any) {
      console.error('Error deleting email:', err);
      setError(err.response?.data?.detail || 'Failed to delete email');
    }
  };

  // Handle delete all emails
  const handleDeleteAllEmails = async () => {
    if (!window.confirm('Are you sure you want to delete all test emails? This action cannot be undone.')) {
      return;
    }

    try {
      setSuccess(null);
      setError(null);

      const response = await api.delete('/admin/test-emails/test-emails');

      setSuccess(response.data.message);

      // Refresh the list
      fetchEmails();
    } catch (err: any) {
      console.error('Error deleting all emails:', err);
      setError(err.response?.data?.detail || 'Failed to delete all emails');
    }
  };

  // Handle view email
  const handleViewEmail = (email: TestEmail) => {
    setSelectedEmail(email);
  };

  // Handle close email view
  const handleCloseEmailView = () => {
    setSelectedEmail(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMeta title="Test Emails" />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Test Emails
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage test emails sent by the system
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center">
        <Button onClick={fetchEmails} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>

        <Button onClick={handleDeleteAllEmails} variant="outline" disabled={loading || emails.length === 0}>
          Delete All Emails
        </Button>
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

      {/* Email List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Loading emails...</p>
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No test emails found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {emails.map((email) => (
                  <tr key={email.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {email.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {email.to_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {email.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(new Date(email.created_at))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          onClick={() => handleViewEmail(email)}
                        >
                          View
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleDeleteEmail(email.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Viewer Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Email Details
              </h2>
              <button
                onClick={handleCloseEmailView}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                &times;
              </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
              <p><strong>To:</strong> {selectedEmail.to_email}</p>
              <p><strong>From:</strong> {selectedEmail.from_email}</p>
              <p><strong>Subject:</strong> {selectedEmail.subject}</p>
              <p><strong>Date:</strong> {formatDate(new Date(selectedEmail.created_at))}</p>
              {selectedEmail.cc && <p><strong>CC:</strong> {selectedEmail.cc}</p>}
              {selectedEmail.bcc && <p><strong>BCC:</strong> {selectedEmail.bcc}</p>}
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={selectedEmail.html_content}
                  className="w-full h-[50vh] bg-white"
                  title={`Email ${selectedEmail.id}`}
                  sandbox="allow-same-origin"
                />
              </div>

              {selectedEmail.text_content && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Plain Text Version
                  </h3>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                    {selectedEmail.text_content}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button onClick={handleCloseEmailView}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestEmailsPage;
