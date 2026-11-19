import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginInput } from '@careerradar/shared';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/api';
import { Alert, Button, Field, Input } from '@/components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to see jobs that match your profile.</p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!formState.errors.email}
          {...register('email')}
        />
      </Field>
      <Field label="Password" htmlFor="password" error={formState.errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!formState.errors.password}
          {...register('password')}
        />
      </Field>
      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Sign in
      </Button>
      <p className="text-center text-sm text-slate-500">
        New to CareerRadar?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
