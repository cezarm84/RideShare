import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import api from '@/services/api.service';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(email || '');

  useEffect(() => {
    // If token is present in URL, verify it automatically
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus('loading');
    try {
      const response = await api.post('/email/verify', { token: verificationToken });
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully. You can now log in.');
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.detail ||
        'Failed to verify email. The token may be invalid or expired.'
      );
    }
  };

  const requestVerificationEmail = async () => {
    if (!emailInput) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    setStatus('loading');
    try {
      const response = await api.post('/email/request-verification', { email: emailInput });
      setStatus('success');
      setMessage(response.data.message || 'Verification email sent. Please check your inbox.');
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.detail ||
        'Failed to send verification email. Please try again later.'
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {token
              ? 'Verifying your email address...'
              : 'Enter your email to request a verification link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">
                {token ? 'Verifying your email...' : 'Sending verification email...'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-400">Success</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <AlertTitle className="text-red-800 dark:text-red-400">Error</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {!token && status !== 'success' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {!token && status !== 'success' && (
            <Button
              className="w-full"
              onClick={requestVerificationEmail}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Email
                </>
              )}
            </Button>
          )}

          {(status === 'success' || status === 'error') && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/signin')}
            >
              Go to Sign In
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmailVerification;
