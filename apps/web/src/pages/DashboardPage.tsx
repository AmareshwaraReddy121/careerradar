import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardList,
  Clock,
  Cpu,
  Landmark,
  Newspaper,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardSummary } from '@careerradar/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';
import { Alert, Badge, Button, Card, CardHeader, Spinner } from '@/components/ui';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';

function Stat({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-700/20 dark:text-brand-100">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

function EmptyFeed({ text, phase }: { text: string; phase: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <p className="text-sm text-slate-500">{text}</p>
      <Badge tone="brand">Arrives in Phase {phase}</Badge>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', user?.id ?? 'guest'],
    queryFn: () => api<DashboardSummary>('/dashboard/summary'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">Your career radar at a glance.</p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="size-3.5" aria-hidden /> Last updated:{' '}
          {data ? formatDateTime(data.lastUpdatedAt) : '…'}
        </p>
      </div>

      <EmailVerificationBanner />

      {isLoading && <Spinner className="mx-auto" />}
      {isError && <Alert tone="error">Couldn't load the dashboard. Is the API running?</Alert>}

      {data && (
        <>
          {user && data.profileCompleteness !== null && data.profileCompleteness < 100 && (
            <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-medium">Complete your profile ({data.profileCompleteness}%)</p>
                <p className="text-sm text-slate-500">
                  Eligibility checks and job matches use your education, date of birth and
                  preferences.
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all"
                    style={{ width: `${data.profileCompleteness}%` }}
                  />
                </div>
              </div>
              <Link to="/settings/profile">
                <Button variant="secondary">
                  Update profile <ArrowRight className="size-4" />
                </Button>
              </Link>
            </Card>
          )}

          {!user && (
            <Alert>
              <Link to="/register" className="font-medium underline">
                Create a free account
              </Link>{' '}
              to see jobs you're eligible for and track your applications.
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Active job notifications" value={data.jobs.active} icon={Briefcase} />
            <Stat label="New this week" value={data.jobs.newThisWeek} icon={Sparkles} />
            <Stat
              label="Matching your profile"
              value={data.jobs.matchingProfile ?? '—'}
              icon={Sparkles}
              hint={user ? undefined : 'Sign in to see matches'}
            />
            <Stat label="Closing in 7 days" value={data.jobs.closingSoon} icon={CalendarClock} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Government recruitment"
                description="UPSC, SSC, banking, PSUs, railways and state PSCs"
                action={<Landmark className="size-5 text-slate-400" />}
              />
              <EmptyFeed text="Official government notifications will appear here." phase={2} />
            </Card>
            <Card>
              <CardHeader
                title="Private-sector recruitment"
                description="IT services, product companies, startups and MNCs"
                action={<Building2 className="size-5 text-slate-400" />}
              />
              <EmptyFeed text="Private-sector openings will appear here." phase={2} />
            </Card>
            <Card>
              <CardHeader
                title="Latest technology releases"
                action={<Cpu className="size-5 text-slate-400" />}
              />
              <EmptyFeed
                text="AI, cloud, DevOps and other technology updates will appear here."
                phase={5}
              />
            </Card>
            <Card>
              <CardHeader
                title="Latest industry news"
                action={<Newspaper className="size-5 text-slate-400" />}
              />
              <EmptyFeed text="IT, banking and market news will appear here." phase={5} />
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Application tracking"
              description="Status of the jobs you've applied to"
              action={<ClipboardList className="size-5 text-slate-400" />}
            />
            {user ? (
              <EmptyFeed
                text={`You're tracking ${data.applications?.total ?? 0} applications.`}
                phase={6}
              />
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500">
                Sign in to track your applications.
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
