import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  changePasswordSchema,
  NOTIFICATION_TOPICS,
  type AuthResponse,
  type NotificationPrefs,
  type UserDTO,
} from '@careerradar/shared';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Alert, Button, Card, CardHeader, Field, Input, Select, Toggle } from '@/components/ui';

const TOPIC_LABELS: Record<(typeof NOTIFICATION_TOPICS)[number], string> = {
  new_match: 'New matching jobs',
  deadline: 'Approaching deadlines',
  revision: 'Notification revisions / corrigenda',
  admit_card: 'Admit card releases',
  exam_date: 'Exam date announcements',
  tech_update: 'Technology updates',
  hiring_news: 'Company hiring news',
};

function NotificationPrefsCard({ user }: { user: UserDTO }) {
  const { setUser } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(user.notificationPrefs);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <Card>
      <CardHeader
        title="Notification preferences"
        description="Delivery starts when alerts ship in Phase 6; your choices are saved now."
      />
      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {(['inApp', 'email', 'push'] as const).map((c) => (
            <label
              key={c}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
            >
              {c === 'inApp' ? 'In-app' : c === 'email' ? 'Email' : 'Browser push'}
              <Toggle
                label={c}
                checked={prefs.channels[c]}
                onChange={(v) => setPrefs({ ...prefs, channels: { ...prefs.channels, [c]: v } })}
              />
            </label>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {NOTIFICATION_TOPICS.map((t) => (
            <label
              key={t}
              className="flex items-center justify-between rounded-lg px-1 py-1.5 text-sm"
            >
              {TOPIC_LABELS[t]}
              <Toggle
                label={TOPIC_LABELS[t]}
                checked={prefs.topics[t] ?? true}
                onChange={(v) => setPrefs({ ...prefs, topics: { ...prefs.topics, [t]: v } })}
              />
            </label>
          ))}
        </div>
        <Field label="Delivery" htmlFor="digest" className="max-w-xs">
          <Select
            id="digest"
            value={prefs.digest}
            onChange={(e) =>
              setPrefs({ ...prefs, digest: e.target.value as NotificationPrefs['digest'] })
            }
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </Select>
        </Field>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <div className="flex justify-end">
          <Button
            loading={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const res = await api<{ user: UserDTO }>('/me/notification-preferences', {
                  method: 'PUT',
                  body: prefs,
                });
                setUser(res.user);
                setMsg({ tone: 'success', text: 'Preferences saved.' });
              } catch (e) {
                setMsg({ tone: 'error', text: errorMessage(e) });
              } finally {
                setSaving(false);
              }
            }}
          >
            Save preferences
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ChangePasswordCard() {
  const { setSession } = useAuth();
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<{
    currentPassword: string;
    newPassword: string;
  }>({ resolver: zodResolver(changePasswordSchema) });
  return (
    <Card>
      <CardHeader title="Change password" description="Other devices will be signed out." />
      <form
        className="grid gap-4 p-5 sm:grid-cols-2"
        noValidate
        onSubmit={handleSubmit(async (v) => {
          try {
            setSession(await api<AuthResponse>('/me/password', { method: 'POST', body: v }));
            reset();
            setMsg({ tone: 'success', text: 'Password changed.' });
          } catch (e) {
            setMsg({ tone: 'error', text: errorMessage(e) });
          }
        })}
      >
        <Field
          label="Current password"
          htmlFor="cur"
          error={formState.errors.currentPassword?.message}
        >
          <Input
            id="cur"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
          />
        </Field>
        <Field label="New password" htmlFor="new" error={formState.errors.newPassword?.message}>
          <Input
            id="new"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
          />
        </Field>
        {msg && (
          <div className="sm:col-span-2">
            <Alert tone={msg.tone}>{msg.text}</Alert>
          </div>
        )}
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" loading={formState.isSubmitting}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DataCard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader
        title="Your data"
        description="Download or permanently delete everything CareerRadar stores about you."
      />
      <div className="space-y-4 p-5">
        <Button
          variant="secondary"
          onClick={async () => {
            const data = await api<unknown>('/me/export');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'careerradar-export.json';
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          Download my data
        </Button>
        <div className="space-y-2 rounded-lg border border-red-200 p-4 dark:border-red-900">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete account</p>
          <p className="text-sm text-slate-500">
            This permanently deletes your account and profile. Type DELETE to confirm.
          </p>
          <div className="flex flex-wrap gap-2">
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="max-w-40"
              aria-label="Type DELETE to confirm"
            />
            <Button
              variant="danger"
              disabled={confirm !== 'DELETE'}
              onClick={async () => {
                try {
                  await api('/me', { method: 'DELETE' });
                  await logout();
                  navigate('/');
                } catch (e) {
                  setError(errorMessage(e));
                }
              }}
            >
              Delete permanently
            </Button>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </div>
    </Card>
  );
}

export function AccountSettings() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="space-y-6">
      <NotificationPrefsCard user={user} />
      <ChangePasswordCard />
      <DataCard />
    </div>
  );
}
