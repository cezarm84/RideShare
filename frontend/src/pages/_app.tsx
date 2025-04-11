import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Pages that don't require authentication
const publicPages = ['/login'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the page requires authentication
    const isPublicPage = publicPages.includes(router.pathname);
    let token = null;

    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }

    if (!isPublicPage && !token) {
      // Redirect to login if not authenticated and not on a public page
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
