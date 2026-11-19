import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '@careerradar/shared';
import { api, errorMessage } from '@/lib/api';
import { Alert, Button, Field, Input } from '@/components/ui';

export function ForgotPasswordPage() {
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const res = await api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: values,
      });
      setDone(res.message);
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-500">We'll email you a link to set a new password.</p>
      </div>
      {done && <Alert tone="success">{done}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
      </Field>
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Send reset link
      </Button>
      <p className="text-center text-sm">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
