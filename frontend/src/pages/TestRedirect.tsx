import React from 'react';

const TestRedirect: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Redirect Page</h1>
      <p className="mb-4">If you can see this page, there's no automatic redirection happening at the component level.</p>
      <p>Current URL: {window.location.href}</p>
    </div>
  );
};

export default TestRedirect;
