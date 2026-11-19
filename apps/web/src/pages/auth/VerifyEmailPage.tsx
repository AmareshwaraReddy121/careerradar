import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert, Spinner } from '@/components/ui';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { user, setUser } = useAuth();
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? '' : 'This verification link is missing its token.',
  );
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setState('ok'))
      .catch((err) => {
        setState('error');
        setMessage(errorMessage(err));
      });
  }, [token]);

  useEffect(() => {
    if (state === 'ok' && user && !user.emailVerified) setUser({ ...user, emailVerified: true });
  }, [state, user, setUser]);

  return (
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-semibold">Email verification</h1>
      {state === 'loading' && <Spinner className="mx-auto" />}
      {state === 'ok' && (
        <Alert tone="success">Your email is verified. You'll now receive job alerts.</Alert>
      )}
      {state === 'error' && <Alert tone="error">{message}</Alert>}
      <Link to="/" className="block text-sm font-medium text-brand-600 hover:underline">
        Go to dashboard
      </Link>
    </div>
  );
}
