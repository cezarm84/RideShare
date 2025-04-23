import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.service';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/form/input/InputField';
import Select from '../../components/ui/form/select/Select';
import PageMeta from '../../components/common/PageMeta';

interface DomainInfo {
  system_domain: string;
  driver_domain: string;
  enterprise_domains: Record<string, string>;
  system_emails: {
    admin: string;
    support: string;
    noreply: string;
  };
}

const EmailDomainTestingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [fromType, setFromType] = useState('system');
  const [toType, setToType] = useState('user');
  const [subject, setSubject] = useState('Test Email');
  const [content, setContent] = useState('This is a test email from the RideShare system.');
  const [fromEmail, setFromEmail] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDomainInfo();
  }, []);

  const fetchDomainInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/email-domains/domain-info');
      setDomainInfo(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error fetching domain information');
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      setLoading(true);
      setError('');
      setTestResult(null);

      const response = await api.post('/admin/email-domains/test-domain-email', {
        from_type: fromType,
        to_type: toType,
        subject,
        content,
        from_email: fromEmail || undefined,
        to_email: toEmail || undefined
      });

      setTestResult(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error sending test email');
      setLoading(false);
    }
  };

  const handleGenerateUsers = async (domainType: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/admin/email-domains/generate-domain-users', {
        domain_type: domainType,
        count: 5
      });

      alert(`Successfully generated ${response.data.users.length} ${domainType} users`);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || `Error generating ${domainType} users`);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMeta title="Email Domain Testing" />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Email Domain Testing</h1>
        <p className="text-gray-600 mb-4">
          Test sending and receiving emails between different domains in the RideShare system.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {domainInfo && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">Domain Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>System Domain:</strong> {domainInfo.system_domain}</p>
              <p><strong>Driver Domain:</strong> {domainInfo.driver_domain}</p>
            </div>
            <div>
              <p><strong>System Emails:</strong></p>
              <ul className="list-disc pl-5">
                <li>Admin: {domainInfo.system_emails.admin}</li>
                <li>Support: {domainInfo.system_emails.support}</li>
                <li>No-Reply: {domainInfo.system_emails.noreply}</li>
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <p><strong>Enterprise Domains:</strong></p>
            <ul className="list-disc pl-5">
              {Object.entries(domainInfo.enterprise_domains).map(([key, domain]) => (
                <li key={key}>{key}: {domain}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Send Test Email</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Type</label>
            <Select 
              value={fromType} 
              onChange={(e) => setFromType(e.target.value)}
              className="w-full"
            >
              <option value="system">System</option>
              <option value="driver">Driver</option>
              <option value="enterprise">Enterprise</option>
              <option value="user">Regular User</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Type</label>
            <Select 
              value={toType} 
              onChange={(e) => setToType(e.target.value)}
              className="w-full"
            >
              <option value="system">System</option>
              <option value="driver">Driver</option>
              <option value="enterprise">Enterprise</option>
              <option value="user">Regular User</option>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Email (Optional)</label>
            <Input 
              type="email" 
              value={fromEmail} 
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="Leave blank to generate automatically"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Email (Optional)</label>
            <Input 
              type="email" 
              value={toEmail} 
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="Leave blank to generate automatically"
              className="w-full"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <Input 
            type="text" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <Button 
          onClick={handleSendTestEmail} 
          disabled={loading}
          className="w-full md:w-auto"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </Button>
      </div>

      {testResult && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-8">
          <h3 className="font-bold">Email Sent Successfully!</h3>
          <p><strong>From:</strong> {testResult.from_email || 'Generated automatically'}</p>
          <p><strong>To:</strong> {testResult.to_email || 'Generated automatically'}</p>
          <p>
            <Button 
              onClick={() => navigate('/admin/test-emails')} 
              variant="outline" 
              className="mt-2"
            >
              View in Email Viewer
            </Button>
          </p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate Test Users</h2>
        <p className="text-gray-600 mb-4">
          Generate test users with domain-specific email addresses for testing.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <Button 
            onClick={() => handleGenerateUsers('driver')} 
            disabled={loading}
            variant="outline"
          >
            Generate Driver Users
          </Button>
          
          <Button 
            onClick={() => handleGenerateUsers('enterprise')} 
            disabled={loading}
            variant="outline"
          >
            Generate Enterprise Users
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button 
          onClick={() => navigate('/admin/test-emails')} 
          variant="outline"
        >
          View Test Emails
        </Button>
        
        <Button 
          onClick={() => navigate('/admin')} 
          variant="outline"
        >
          Back to Admin
        </Button>
      </div>
    </div>
  );
};

export default EmailDomainTestingPage;
