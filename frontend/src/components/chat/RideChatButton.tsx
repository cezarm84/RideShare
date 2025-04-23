import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ChatIcon } from '../../icons';
import ChatService from '../../services/chat.service';

interface RideChatButtonProps {
  rideId: number;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

const RideChatButton: React.FC<RideChatButtonProps> = ({ 
  rideId, 
  variant = 'default',
  size = 'default'
}) => {
  const navigate = useNavigate();
  const [channelId, setChannelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rideId) {
      fetchRideChannel();
    }
  }, [rideId]);

  const fetchRideChannel = async () => {
    try {
      setLoading(true);
      const channel = await ChatService.getRideChannel(rideId);
      if (channel) {
        setChannelId(channel.id);
      }
      setLoading(false);
    } catch (err) {
      setError('Could not fetch chat channel');
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (channelId) {
      navigate(`/passenger/messages?channel=${channelId}`);
    } else {
      setError('Chat channel not available');
    }
  };

  if (!channelId) {
    return null;
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <ChatIcon className="w-5 h-5" />
      <span>Chat</span>
    </Button>
  );
};

export default RideChatButton;
