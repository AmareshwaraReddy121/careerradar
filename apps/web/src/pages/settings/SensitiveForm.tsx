import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import type { SensitiveProfileDTO } from '@careerradar/shared';
import { api, errorMessage } from '@/lib/api';
import type { Taxonomies } from '@/features/taxonomies';
import { Alert, Button, Card, CardHeader, Field, Select, Spinner } from '@/components/ui';

interface Values {
  category: string;
  pwbd: string;
  exServiceman: string;
  gender: string;
  nationality: string;
  domicileState: string;
  consent: boolean;
}

const tri = (v: boolean | null | undefined) => (v == null ? '' : v ? 'yes' : 'no');
const fromTri = (v: string) => (v === '' ? null : v === 'yes');
const orNull = (v: string) => (v ? v : null);

export function SensitiveForm({ tax }: { tax: Taxonomies }) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['profile-sensitive'],
    queryFn: () => api<{ sensitive: SensitiveProfileDTO }>('/profile/sensitive'),
  });
  const { register, handleSubmit, reset, watch } = useForm<Values>();

  useEffect(() => {
    if (!data) return;
    const s = data.sensitive;
    reset({
      category: s.category ?? '',
      pwbd: tri(s.pwbd),
      exServiceman: tri(s.exServiceman),
      gender: s.gender ?? '',
      nationality: s.nationality ?? '',
      domicileState: s.domicileState ?? '',
      consent: !!s.consentGivenAt,
    });
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (v: Values) =>
      api<{ sensitive: SensitiveProfileDTO }>('/profile/sensitive', {
        method: 'PUT',
        body: {
          category: orNull(v.category),
          pwbd: fromTri(v.pwbd),
          exServiceman: fromTri(v.exServiceman),
          gender: orNull(v.gender),
          nationality: orNull(v.nationality),
          domicileState: orNull(v.domicileState),
          consent: v.consent,
        },
      }),
    onSuccess: (res) => {
      qc.setQueryData(['profile-sensitive'], res);
      setMsg({ tone: 'success', text: 'Saved securely.' });
    },
    onError: (e) => setMsg({ tone: 'error', text: errorMessage(e) }),
  });

  const withdraw = useMutation({
    mutationFn: () => api('/profile/sensitive', { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-sensitive'] });
      setMsg({ tone: 'success', text: 'Consent withdrawn and details erased.' });
    },
  });

  if (isLoading) return <Spinner className="mx-auto" />;

  return (
    <Card>
      <CardHeader
        title="Eligibility details (optional)"
        description="Used only to apply age relaxations and reservation rules in eligibility checks."
        action={<ShieldCheck className="size-5 text-emerald-600" />}
      />
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4 p-5" noValidate>
        <Alert>
          These details are optional, encrypted at rest, never shown publicly, and you can erase
          them at any time.
        </Alert>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Reservation category" htmlFor="cat">
            <Select id="cat" {...register('category')}>
              <option value="">Prefer not to say</option>
              {tax.reservationCategories.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', '-')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Person with benchmark disability (PwBD)" htmlFor="pwbd">
            <Select id="pwbd" {...register('pwbd')}>
              <option value="">Prefer not to say</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="Ex-serviceman" htmlFor="exs">
            <Select id="exs" {...register('exServiceman')}>
              <option value="">Prefer not to say</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>
          <Field label="Gender" htmlFor="gender">
            <Select id="gender" {...register('gender')}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Nationality" htmlFor="nat">
            <Select id="nat" {...register('nationality')}>
              <option value="">Prefer not to say</option>
              <option value="Indian">Indian</option>
              <option value="Other">Other</option>
            </Select>
          </Field>
          <Field label="Domicile state" htmlFor="dom">
            <Select id="dom" {...register('domicileState')}>
              <option value="">Prefer not to say</option>
              {tax.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-brand-600"
            {...register('consent')}
          />
          I consent to CareerRadar storing these details to evaluate my eligibility for jobs.
        </label>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <div className="flex flex-wrap justify-end gap-2">
          {data?.sensitive.consentGivenAt && (
            <Button
              type="button"
              variant="secondary"
              loading={withdraw.isPending}
              onClick={() => withdraw.mutate()}
            >
              Withdraw consent & erase
            </Button>
          )}
          <Button type="submit" disabled={!watch('consent')} loading={save.isPending}>
            Save details
          </Button>
        </div>
      </form>
    </Card>
  );
}
