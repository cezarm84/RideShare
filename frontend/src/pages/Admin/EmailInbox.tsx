import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.service';
import Button from '../../components/ui/button/Button';
import Input from '../../components/ui/form/input/InputField';
import Select from '../../components/ui/form/select/Select';
import PageMeta from '../../components/common/PageMeta';
import { formatDate } from '../../utils/dateUtils';

interface InboxEmail {
  id: number;
  to_email: string;
  from_email: string;
  subject: string;
  html_content: string;
  text_content?: string;
  cc?: string;
  bcc?: string;
  created_at: string;
  read: boolean;
  replied: boolean;
}

const EmailInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [domainType, setDomainType] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [error, setError] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, [domainType, unreadOnly, emailAddress]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      let url = '/email/inbox?';
      
      if (domainType !== 'all') {
        url += `domain_type=${domainType}&`;
      }
      
      if (unreadOnly) {
        url += 'unread_only=true&';
      }
      
      if (emailAddress) {
        url += `email_address=${encodeURIComponent(emailAddress)}&`;
      }
      
      const response = await api.get(url);
      setEmails(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error fetching emails');
      setLoading(false);
    }
  };

  const handleViewEmail = async (email: InboxEmail) => {
    setSelectedEmail(email);
    setShowReplyForm(false);
    setReplyContent('');
    
    // Mark as read if not already
    if (!email.read) {
      try {
        await api.put(`/email/inbox/${email.id}`, { read: true });
        // Update the email in the list
        setEmails(emails.map(e => e.id === email.id ? { ...e, read: true } : e));
      } catch (err) {
        console.error('Error marking email as read:', err);
      }
    }
  };

  const handleReply = () => {
    setShowReplyForm(true);
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyContent.trim()) return;
    
    try {
      setLoading(true);
      const response = await api.post(`/email/inbox/reply/${selectedEmail.id}`, {
        content: replyContent
      });
      
      // Update the email in the list
      setEmails(emails.map(e => e.id === selectedEmail.id ? { ...e, replied: true } : e));
      
      // Reset form
      setShowReplyForm(false);
      setReplyContent('');
      setSelectedEmail({ ...selectedEmail, replied: true });
      
      // Show success message
      alert('Reply sent successfully!');
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error sending reply');
      setLoading(false);
    }
  };

  const handleDeleteEmail = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/email/inbox/${id}`);
      
      // Remove from list
      setEmails(emails.filter(e => e.id !== id));
      
      // Clear selection if needed
      if (selectedEmail && selectedEmail.id === id) {
        setSelectedEmail(null);
        setShowReplyForm(false);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting email');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMeta title="Email Inbox" />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Email Inbox</h1>
        <p className="text-gray-600 mb-4">
          View and manage incoming emails in the RideShare system.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold mb-3">Filters</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain Type</label>
              <Select 
                value={domainType} 
                onChange={(e) => setDomainType(e.target.value)}
                className="w-full"
              >
                <option value="all">All Domains</option>
                <option value="system">System (@rideshare.com)</option>
                <option value="driver">Driver (@driver.rideshare.com)</option>
                <option value="enterprise">Enterprise (@*.rideshare.com)</option>
              </Select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <Input 
                type="email" 
                value={emailAddress} 
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="Filter by email address"
                className="w-full"
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={unreadOnly} 
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Unread Only</span>
              </label>
            </div>
            
            <Button 
              onClick={fetchEmails} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Email List</h2>
            
            {emails.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No emails found</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {emails.map((email) => (
                  <div 
                    key={email.id} 
                    className={`py-3 px-2 cursor-pointer hover:bg-gray-50 ${
                      selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                    } ${!email.read ? 'font-semibold' : ''}`}
                    onClick={() => handleViewEmail(email)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="truncate">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {email.from_email}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {email.subject}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(email.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Email Content */}
        <div className="lg:col-span-2">
          {selectedEmail ? (
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{selectedEmail.subject}</h2>
                <Button 
                  onClick={() => handleDeleteEmail(selectedEmail.id)} 
                  variant="outline" 
                  className="text-red-500"
                >
                  Delete
                </Button>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">From:</span> {selectedEmail.from_email}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">To:</span> {selectedEmail.to_email}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Date:</span> {formatDate(selectedEmail.created_at)}
                </div>
                {selectedEmail.cc && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">CC:</span> {selectedEmail.cc}
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div 
                  className="prose max-w-none" 
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }}
                />
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  onClick={handleReply} 
                  disabled={loading || showReplyForm}
                >
                  Reply
                </Button>
                
                <Button 
                  onClick={() => setSelectedEmail(null)} 
                  variant="outline"
                >
                  Close
                </Button>
              </div>
              
              {showReplyForm && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium mb-3">Reply</h3>
                  
                  <div className="mb-4">
                    <textarea 
                      value={replyContent} 
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Type your reply here..."
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button 
                      onClick={handleSendReply} 
                      disabled={loading || !replyContent.trim()}
                    >
                      Send Reply
                    </Button>
                    
                    <Button 
                      onClick={() => setShowReplyForm(false)} 
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center h-64">
              <p className="text-gray-500 mb-4">Select an email to view its contents</p>
              <Button 
                onClick={() => navigate('/admin/email-domains')} 
                variant="outline"
              >
                Go to Email Domain Testing
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailInboxPage;
