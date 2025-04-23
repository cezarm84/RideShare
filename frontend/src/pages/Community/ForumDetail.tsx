import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api.service';
import { Button } from '../../components/ui/button';
import ChatInterface from '../../components/chat/ChatInterface';

const ForumDetail: React.FC = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const navigate = useNavigate();
  const [forum, setForum] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (forumId) {
      fetchForumDetails();
    }
  }, [forumId]);

  const fetchForumDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/chat/channels/${forumId}`);
      setForum(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error fetching forum details');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading forum details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <Button onClick={() => navigate('/community/forums')}>
            Back to Forums
          </Button>
        </div>
      </div>
    );
  }

  if (!forum) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Forum not found</div>
        <div className="mt-4 text-center">
          <Button onClick={() => navigate('/community/forums')}>
            Back to Forums
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{forum.name}</h1>
          <Button
            onClick={() => navigate('/community/forums')}
            variant="outline"
          >
            Back to Forums
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{forum.description}</p>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {forum.member_count} members • Created {new Date(forum.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="h-[calc(100vh-200px)] overflow-hidden">
        <ChatInterface channelId={parseInt(forumId as string)} showHeader={false} />
      </div>
    </div>
  );
};

export default ForumDetail;
