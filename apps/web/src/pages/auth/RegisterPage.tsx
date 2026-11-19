import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterInput } from '@careerradar/shared';
import { useAuth } from '@/lib/auth';
import { errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/formErrors';
import { Alert, Button, Field, Input } from '@/components/ui';

export function RegisterPage() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState,
    setError: setFieldError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await signUp(values);
      navigate('/settings/profile?welcome=1', { replace: true });
    } catch (err) {
      if (!applyServerErrors(err, setFieldError)) setError(errorMessage(err));
    }
  });

  const e = formState.errors;
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Get personalised job matches and deadline alerts.
        </p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <Field label="Full name" htmlFor="fullName" error={e.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={!!e.fullName}
          {...register('fullName')}
        />
      </Field>
      <Field label="Email" htmlFor="email" error={e.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!e.email}
          {...register('email')}
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={e.password?.message}
        hint="At least 8 characters with a letter and a number."
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!e.password}
          {...register('password')}
        />
      </Field>
      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-slate-300 accent-brand-600"
            {...register('acceptTerms')}
          />
          <span>
            I agree to the Terms of Service and Privacy Policy, and consent to CareerRadar
            processing my profile to recommend jobs.
          </span>
        </label>
        {e.acceptTerms && <p className="text-xs text-red-600">{e.acceptTerms.message}</p>}
      </div>
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Create account
      </Button>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
