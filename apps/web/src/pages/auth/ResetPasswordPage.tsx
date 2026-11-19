import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { passwordSchema } from '@careerradar/shared';
import { api, errorMessage } from '@/lib/api';
import { Alert, Button, Field, Input } from '@/components/ui';

const schema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  });

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  if (!token)
    return <Alert tone="error">This reset link is missing its token. Request a new one.</Alert>;

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    try {
      await api('/auth/reset-password', { method: 'POST', body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  if (done) {
    return (
      <div className="space-y-4">
        <Alert tone="success">
          Your password has been reset. All other sessions were signed out.
        </Alert>
        <Link
          to="/login"
          className="block text-center text-sm font-medium text-brand-600 hover:underline"
        >
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      {error && <Alert tone="error">{error}</Alert>}
      <Field label="New password" htmlFor="password" error={formState.errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={formState.errors.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" {...register('confirm')} />
      </Field>
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Reset password
      </Button>
    </form>
  );
}
