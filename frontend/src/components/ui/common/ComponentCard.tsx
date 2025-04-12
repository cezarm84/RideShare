import React from 'react';

interface ComponentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const ComponentCard: React.FC<ComponentCardProps> = ({ 
  title, 
  children,
  className = ''
}) => {
  return (
    <div className={`mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 ${className}`}>
      {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
      <div>{children}</div>
    </div>
  );
};

export default ComponentCard;
