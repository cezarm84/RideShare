import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.service';
import { Button } from '../../components/ui/button';
import { formatDate } from '../../utils/dateUtils';

const CommunityForums: React.FC = () => {
  const navigate = useNavigate();
  const [forums, setForums] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chat/channels?channel_type=community');
      setForums(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error fetching forums');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Community Forums</h1>
        <p className="text-gray-600 mb-4">
          Join discussions with other RideShare users.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Available Forums</h2>
          <Button 
            onClick={fetchForums} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        {forums.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No forums available at the moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {forums.map((forum) => (
              <div key={forum.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">
                      <button
                        onClick={() => navigate(`/community/forums/${forum.id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {forum.name}
                      </button>
                    </h3>
                    <p className="text-gray-600 mt-1">{forum.description}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <span>{forum.member_count} members</span>
                      <span className="mx-2">•</span>
                      <span>{forum.unread_count > 0 ? `${forum.unread_count} unread messages` : 'No unread messages'}</span>
                    </div>
                  </div>
                  
                  {forum.last_message && (
                    <div className="text-sm text-gray-500">
                      <div>Last activity: {formatDate(forum.updated_at)}</div>
                      <div className="mt-1 text-xs">
                        {forum.last_message.sender_name}: {forum.last_message.content.substring(0, 30)}
                        {forum.last_message.content.length > 30 ? '...' : ''}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Button
                    onClick={() => navigate(`/community/forums/${forum.id}`)}
                    size="sm"
                  >
                    Join Discussion
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityForums;
