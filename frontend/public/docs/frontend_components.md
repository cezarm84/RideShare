# Frontend Components

This document provides an overview of the key UI components used in the RideShare frontend application.

## Common Components

### ErrorBoundary

The `ErrorBoundary` component is a React class component that catches JavaScript errors anywhere in its child component tree and displays a fallback UI instead of crashing the entire application.

**Usage:**
```tsx
import ErrorBoundary from "./components/common/ErrorBoundary";

// Wrap your component or application
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches and logs errors in the component tree
- Displays a user-friendly error message
- Provides a "Refresh Page" button for recovery
- Can be customized with a fallback UI

### LoadingSpinner

The `LoadingSpinner` component provides a consistent loading indicator throughout the application.

**Usage:**
```tsx
import LoadingSpinner from "./components/common/LoadingSpinner";

// Basic usage
<LoadingSpinner />

// With size and message
<LoadingSpinner size="lg" message="Loading data..." />

// Full screen overlay
<LoadingSpinner fullScreen size="lg" message="Loading your profile..." />
```

**Props:**
- `size`: "sm" | "md" | "lg" (default: "md")
- `fullScreen`: boolean - whether to display as a full-screen overlay (default: false)
- `message`: string - optional message to display below the spinner

## Authentication Components

### ProtectedRoute

The `ProtectedRoute` component is used to protect routes that require authentication. It redirects unauthenticated users to the sign-in page and preserves the original destination for after login.

**Usage:**
```tsx
<Route 
  path="/profile" 
  element={
    <ProtectedRoute>
      <UserProfile />
    </ProtectedRoute>
  } 
/>
```

**Features:**
- Checks authentication status
- Redirects to sign-in page if not authenticated
- Preserves the original URL for redirect after login
- Shows loading indicator during authentication check

### SignInForm

The `SignInForm` component handles user authentication and redirects.

**Features:**
- Form validation
- Error display
- Loading state during authentication
- Redirect to original destination after successful login

## Service Worker

The application includes a service worker for better offline support and performance:

**Features:**
- Caches static assets for offline access
- Uses a "network-first" strategy for API requests
- Falls back to cached data when network is unavailable
- Improves loading performance for repeat visits

**Implementation:**
- Registered in index.html
- Configuration in public/service-worker.js
- Handles different caching strategies for different types of requests

## API Service

The enhanced API service provides robust error handling and retry logic:

**Features:**
- Automatic token inclusion in requests
- Retry logic for network failures
- Consistent error handling
- Type-safe request and response handling

**Usage:**
```tsx
import api from '../services/api.service';

// Example GET request
const getData = async () => {
  try {
    const response = await api.get<DataType>('/endpoint');
    return response.data;
  } catch (error) {
    return api.handleError(error);
  }
};
```
