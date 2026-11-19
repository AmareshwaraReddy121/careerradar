import { useQuery } from '@tanstack/react-query';
import { NavLink, Navigate, useParams, useSearchParams } from 'react-router-dom';
import type { ProfileDTO } from '@careerradar/shared';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useTaxonomies } from '@/features/taxonomies';
import { Alert, FullPageSpinner } from '@/components/ui';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { ProfileForm } from './ProfileForm';
import { SensitiveForm } from './SensitiveForm';
import { AccountSettings } from './AccountSettings';

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'eligibility', label: 'Eligibility details' },
  { key: 'account', label: 'Account & notifications' },
];

export function SettingsPage() {
  const { tab = 'profile' } = useParams();
  const [params] = useSearchParams();
  const tax = useTaxonomies();
  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: () => api<{ profile: ProfileDTO }>('/profile'),
  });

  if (!TABS.some((t) => t.key === tab)) return <Navigate to="/settings/profile" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile settings</h1>
        <p className="text-sm text-slate-500">
          {profile.data ? `Profile ${profile.data.profile.completeness}% complete.` : ' '} A
          complete profile gives more accurate job matches.
        </p>
      </div>
      {params.get('welcome') && (
        <Alert tone="success">
          Welcome to CareerRadar! Fill in your profile so we can match you with jobs you're eligible
          for.
        </Alert>
      )}
      <EmailVerificationBanner />
      <div
        className="flex gap-1 overflow-x-auto [scrollbar-width:none] border-b border-slate-200 dark:border-slate-800"
        role="tablist"
      >
        {TABS.map((t) => (
          <NavLink
            key={t.key}
            to={`/settings/${t.key}`}
            role="tab"
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium',
                isActive
                  ? 'border-brand-600 text-brand-700 dark:text-brand-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
      {tax.isLoading || profile.isLoading ? (
        <FullPageSpinner />
      ) : tax.isError || profile.isError || !tax.data || !profile.data ? (
        <Alert tone="error">Couldn't load your profile. Please refresh.</Alert>
      ) : tab === 'profile' ? (
        <ProfileForm profile={profile.data.profile} tax={tax.data} />
      ) : tab === 'eligibility' ? (
        <SensitiveForm tax={tax.data} />
      ) : (
        <AccountSettings />
      )}
    </div>
  );
}
