import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    // Here you could log the error to a service like Sentry
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 max-w-md">
            <h2 className="mb-4 text-xl font-bold text-red-600 dark:text-red-400">
              Something went wrong
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            <pre className="p-3 mb-4 overflow-auto text-sm text-left bg-gray-100 rounded dark:bg-gray-900 max-h-40">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
