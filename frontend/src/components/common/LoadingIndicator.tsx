import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-2"></div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
