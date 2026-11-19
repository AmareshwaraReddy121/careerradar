import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api, errorMessage } from '@/lib/api';
import { Alert, Button } from './ui';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | string>('idle');
  if (!user || user.emailVerified) return null;
  return (
    <Alert>
      <span>Verify your email ({user.email}) to receive job alerts. </span>
      {status === 'sent' ? (
        <span className="font-medium">Verification email sent.</span>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto px-1 py-0 underline"
          loading={status === 'sending'}
          onClick={async () => {
            setStatus('sending');
            try {
              await api('/auth/resend-verification', { method: 'POST' });
              setStatus('sent');
            } catch (err) {
              setStatus(errorMessage(err));
            }
          }}
        >
          Resend email
        </Button>
      )}
      {status !== 'idle' && status !== 'sending' && status !== 'sent' && (
        <span className="ml-1">{status}</span>
      )}
    </Alert>
  );
}
