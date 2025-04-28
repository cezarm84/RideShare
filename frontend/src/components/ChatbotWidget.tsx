import React from 'react';
import Chatbot from './chat/Chatbot';

/**
 * ChatbotWidget - A component that renders the chatbot widget on all pages
 * 
 * This component is meant to be included in the main App component or layout
 * to make the chatbot accessible from anywhere in the application.
 */
const ChatbotWidget: React.FC = () => {
  return <Chatbot initialOpen={false} />;
};

export default ChatbotWidget;
