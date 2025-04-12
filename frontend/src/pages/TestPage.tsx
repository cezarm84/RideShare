import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cypress Test Page</h1>
      <p className="mb-4">This page is used for Cypress testing.</p>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Login Form</h2>
        <form className="space-y-4" data-testid="login-form">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter your username"
              data-testid="username-input"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full p-2 border rounded"
              placeholder="Enter your password"
              data-testid="password-input"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            data-testid="submit-button"
          >
            Sign In
          </button>
        </form>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">User Profile</h2>
        <div className="p-4 border rounded" data-testid="user-profile">
          <div className="font-medium">Test User</div>
          <div className="text-gray-600">test@example.com</div>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Navigation</h2>
        <nav className="space-y-2" data-testid="navigation">
          <a href="#" className="block text-blue-600 hover:underline">Dashboard</a>
          <a href="#" className="block text-blue-600 hover:underline">Rides</a>
          <a href="#" className="block text-blue-600 hover:underline">Drivers</a>
          <a href="#" className="block text-blue-600 hover:underline">Settings</a>
        </nav>
      </div>
    </div>
  );
};

export default TestPage;
