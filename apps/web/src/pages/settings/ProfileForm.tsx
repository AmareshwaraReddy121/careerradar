import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { JOB_CATEGORY_LABELS, type ProfileDTO } from '@careerradar/shared';
import { api, errorMessage } from '@/lib/api';
import { applyServerErrors } from '@/lib/formErrors';
import { cn, toDateInput } from '@/lib/utils';
import type { Taxonomies } from '@/features/taxonomies';
import { ChipInput } from '@/components/ChipInput';
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea } from '@/components/ui';

interface FormValues {
  fullName: string;
  dateOfBirth: string;
  highestQualification: string;
  education: {
    level: string;
    degreeCode: string;
    branchCode: string;
    university: string;
    graduationYear: string;
    scoreType: string;
    score: string;
    scale: string;
    isAppearing: boolean;
  }[];
  skills: string[];
  technicalKnowledge: string;
  experience: {
    organization: string;
    title: string;
    startDate: string;
    endDate: string;
    domain: string;
  }[];
  preferences: { categories: string[]; locations: string[]; sector: string; minSalaryLpa: string };
}

const num = (v: string) => (v === '' || v == null ? null : Number(v));
const str = (v: string) => (v?.trim() ? v.trim() : null);

function toForm(p: ProfileDTO): FormValues {
  return {
    fullName: p.fullName,
    dateOfBirth: toDateInput(p.dateOfBirth),
    highestQualification: p.highestQualification ?? '',
    education: p.education.map((e) => ({
      level: e.level,
      degreeCode: e.degreeCode,
      branchCode: e.branchCode ?? '',
      university: e.university ?? '',
      graduationYear: e.graduationYear?.toString() ?? '',
      scoreType: e.scoreType ?? '',
      score: e.score?.toString() ?? '',
      scale: e.scale?.toString() ?? '',
      isAppearing: e.isAppearing,
    })),
    skills: p.skills.map((s) => s.name),
    technicalKnowledge: p.technicalKnowledge ?? '',
    experience: p.experience.map((x) => ({
      organization: x.organization,
      title: x.title,
      startDate: toDateInput(x.startDate),
      endDate: toDateInput(x.endDate),
      domain: x.domain ?? '',
    })),
    preferences: {
      categories: p.preferences.categories,
      locations: p.preferences.locations,
      sector: p.preferences.sector,
      minSalaryLpa: p.preferences.minSalaryLpa?.toString() ?? '',
    },
  };
}

function toPayload(v: FormValues, profile: ProfileDTO) {
  const levels = new Map(profile.skills.map((s) => [s.name.toLowerCase(), s.level]));
  return {
    fullName: v.fullName,
    dateOfBirth: str(v.dateOfBirth),
    highestQualification: str(v.highestQualification),
    education: v.education.map((e) => ({
      level: e.level,
      degreeCode: e.degreeCode,
      branchCode: str(e.branchCode),
      university: str(e.university),
      graduationYear: num(e.graduationYear),
      scoreType: str(e.scoreType),
      score: num(e.score),
      scale: e.scoreType === 'cgpa' ? (num(e.scale) ?? 10) : null,
      isAppearing: e.isAppearing,
    })),
    skills: v.skills.map((name) => ({
      name,
      level: levels.get(name.toLowerCase()) ?? 'intermediate',
    })),
    technicalKnowledge: str(v.technicalKnowledge),
    experience: v.experience.map((x) => ({
      organization: x.organization,
      title: x.title,
      startDate: x.startDate,
      endDate: str(x.endDate),
      domain: str(x.domain),
    })),
    preferences: { ...v.preferences, minSalaryLpa: num(v.preferences.minSalaryLpa) },
  };
}

export function ProfileForm({ profile, tax }: { profile: ProfileDTO; tax: Taxonomies }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const form = useForm<FormValues>({ defaultValues: toForm(profile) });
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState,
    reset,
    getValues,
    setValue,
  } = form;
  const edu = useFieldArray({ control, name: 'education' });
  const exp = useFieldArray({ control, name: 'experience' });
  const err = formState.errors;

  useEffect(() => reset(toForm(profile)), [profile, reset]);

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      api<{ profile: ProfileDTO }>('/profile', { method: 'PUT', body: toPayload(v, profile) }),
    onSuccess: (res) => {
      qc.setQueryData(['profile'], res);
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setStatus({
        tone: 'success',
        text: `Profile saved. Completeness: ${res.profile.completeness}%.`,
      });
    },
    onError: (e) => {
      applyServerErrors(e, setError);
      setStatus({ tone: 'error', text: errorMessage(e) });
    },
  });

  const degreesFor = (level: string) => tax.degrees.filter((d) => !level || d.level === level);

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-6" noValidate>
      <Card>
        <CardHeader title="Personal details" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" error={err.fullName?.message}>
            <Input id="fullName" {...register('fullName', { required: 'Full name is required' })} />
          </Field>
          <Field
            label="Date of birth"
            htmlFor="dob"
            error={err.dateOfBirth?.message}
            hint="Used for age-limit checks."
          >
            <Input id="dob" type="date" {...register('dateOfBirth')} />
          </Field>
          <Field
            label="Highest qualification"
            htmlFor="hq"
            error={err.highestQualification?.message}
          >
            <Select id="hq" {...register('highestQualification')}>
              <option value="">Select…</option>
              {tax.qualificationLevels.map((q) => (
                <option key={q.code} value={q.code}>
                  {q.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Education"
          description="Add each degree. Branch and score are used for eligibility checks."
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                edu.append({
                  level: 'graduate',
                  degreeCode: 'BTECH',
                  branchCode: '',
                  university: '',
                  graduationYear: '',
                  scoreType: '',
                  score: '',
                  scale: '',
                  isAppearing: false,
                })
              }
            >
              <Plus className="size-4" /> Add
            </Button>
          }
        />
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {edu.fields.length === 0 && (
            <p className="p-5 text-sm text-slate-500">No education added yet.</p>
          )}
          {edu.fields.map((f, i) => {
            const level = watch(`education.${i}.level`);
            const degree = tax.degrees.find((d) => d.code === watch(`education.${i}.degreeCode`));
            const scoreType = watch(`education.${i}.scoreType`);
            const e = err.education?.[i];
            return (
              <div key={f.id} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Level" htmlFor={`edu-${i}-level`}>
                  <Select
                    id={`edu-${i}-level`}
                    {...register(`education.${i}.level`, {
                      onChange: (ev) => {
                        const allowed = degreesFor(ev.target.value);
                        const current = getValues(`education.${i}.degreeCode`);
                        if (!allowed.some((d) => d.code === current)) {
                          setValue(`education.${i}.degreeCode`, allowed[0]?.code ?? '');
                        }
                      },
                    })}
                  >
                    {tax.qualificationLevels.map((q) => (
                      <option key={q.code} value={q.code}>
                        {q.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Degree" htmlFor={`edu-${i}-degree`} error={e?.degreeCode?.message}>
                  <Select id={`edu-${i}-degree`} {...register(`education.${i}.degreeCode`)}>
                    {degreesFor(level).map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Branch / specialisation"
                  htmlFor={`edu-${i}-branch`}
                  error={e?.branchCode?.message}
                >
                  <Select
                    id={`edu-${i}-branch`}
                    disabled={!degree?.hasBranch}
                    {...register(`education.${i}.branchCode`)}
                  >
                    <option value="">{degree?.hasBranch ? 'Select…' : 'Not applicable'}</option>
                    {tax.branches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="University / board"
                  htmlFor={`edu-${i}-uni`}
                  error={e?.university?.message}
                >
                  <Input id={`edu-${i}-uni`} {...register(`education.${i}.university`)} />
                </Field>
                <Field
                  label="Passing year"
                  htmlFor={`edu-${i}-year`}
                  error={e?.graduationYear?.message}
                >
                  <Input
                    id={`edu-${i}-year`}
                    type="number"
                    inputMode="numeric"
                    {...register(`education.${i}.graduationYear`)}
                  />
                </Field>
                <Field label="Score type" htmlFor={`edu-${i}-st`} error={e?.scoreType?.message}>
                  <Select id={`edu-${i}-st`} {...register(`education.${i}.scoreType`)}>
                    <option value="">Select…</option>
                    <option value="percentage">Percentage</option>
                    <option value="cgpa">CGPA</option>
                  </Select>
                </Field>
                <Field
                  label={scoreType === 'cgpa' ? 'CGPA' : 'Percentage'}
                  htmlFor={`edu-${i}-score`}
                  error={e?.score?.message}
                >
                  <Input
                    id={`edu-${i}-score`}
                    type="number"
                    step="0.01"
                    {...register(`education.${i}.score`)}
                  />
                </Field>
                {scoreType === 'cgpa' ? (
                  <Field label="CGPA scale" htmlFor={`edu-${i}-scale`} error={e?.scale?.message}>
                    <Input
                      id={`edu-${i}-scale`}
                      type="number"
                      placeholder="10"
                      {...register(`education.${i}.scale`)}
                    />
                  </Field>
                ) : (
                  <div className="hidden lg:block" />
                )}
                <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand-600"
                    {...register(`education.${i}.isAppearing`)}
                  />
                  Currently studying / final year (appearing)
                </label>
                <div className="flex justify-end">
                  <Button type="button" size="sm" variant="ghost" onClick={() => edu.remove(i)}>
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Skills & knowledge" />
        <div className="space-y-4 p-5">
          <Field label="Skills" htmlFor="skills" hint="Type and press Enter, or pick a suggestion.">
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <ChipInput
                  id="skills"
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={tax.skills}
                  placeholder="e.g. Python, SQL, Banking Awareness"
                  max={100}
                />
              )}
            />
          </Field>
          <Field label="Technical knowledge (optional)" htmlFor="tk">
            <Textarea
              id="tk"
              placeholder="Projects, certifications, tools you know…"
              {...register('technicalKnowledge')}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Work experience"
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                exp.append({ organization: '', title: '', startDate: '', endDate: '', domain: '' })
              }
            >
              <Plus className="size-4" /> Add
            </Button>
          }
        />
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {exp.fields.length === 0 && (
            <p className="p-5 text-sm text-slate-500">
              No work experience added. That's fine for freshers.
            </p>
          )}
          {exp.fields.map((f, i) => {
            const e = err.experience?.[i];
            return (
              <div key={f.id} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
                <Field
                  label="Organization"
                  htmlFor={`exp-${i}-org`}
                  error={e?.organization?.message}
                >
                  <Input id={`exp-${i}-org`} {...register(`experience.${i}.organization`)} />
                </Field>
                <Field label="Job title" htmlFor={`exp-${i}-title`} error={e?.title?.message}>
                  <Input id={`exp-${i}-title`} {...register(`experience.${i}.title`)} />
                </Field>
                <Field label="Start date" htmlFor={`exp-${i}-start`} error={e?.startDate?.message}>
                  <Input
                    id={`exp-${i}-start`}
                    type="date"
                    {...register(`experience.${i}.startDate`)}
                  />
                </Field>
                <Field
                  label="End date"
                  htmlFor={`exp-${i}-end`}
                  error={e?.endDate?.message}
                  hint="Leave empty if current."
                >
                  <Input id={`exp-${i}-end`} type="date" {...register(`experience.${i}.endDate`)} />
                </Field>
                <div className="flex items-end justify-end">
                  <Button type="button" size="sm" variant="ghost" onClick={() => exp.remove(i)}>
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Job preferences" />
        <div className="space-y-4 p-5">
          <Field label="Preferred job categories" htmlFor="cats">
            <Controller
              control={control}
              name="preferences.categories"
              render={({ field }) => (
                <div id="cats" className="flex flex-wrap gap-2">
                  {tax.jobCategories.map((c) => {
                    const on = field.value.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          field.onChange(
                            on ? field.value.filter((x) => x !== c.code) : [...field.value, c.code],
                          )
                        }
                        className={cn(
                          'rounded-full border px-3 py-1 text-sm transition-colors',
                          on
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800',
                        )}
                      >
                        {JOB_CATEGORY_LABELS[c.code as keyof typeof JOB_CATEGORY_LABELS] ?? c.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Preferred locations" htmlFor="locs" className="sm:col-span-3">
              <Controller
                control={control}
                name="preferences.locations"
                render={({ field }) => (
                  <ChipInput
                    id="locs"
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={tax.states}
                    placeholder="e.g. Hyderabad, Karnataka, Remote"
                    max={20}
                  />
                )}
              />
            </Field>
            <Field label="Sector preference" htmlFor="sector">
              <Select id="sector" {...register('preferences.sector')}>
                <option value="both">Government & private</option>
                <option value="government">Government only</option>
                <option value="private">Private only</option>
              </Select>
            </Field>
            <Field
              label="Minimum salary (LPA)"
              htmlFor="sal"
              error={err.preferences?.minSalaryLpa?.message}
            >
              <Input
                id="sal"
                type="number"
                step="0.5"
                min="0"
                {...register('preferences.minSalaryLpa')}
              />
            </Field>
          </div>
        </div>
      </Card>

      {status && <Alert tone={status.tone}>{status.text}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" loading={save.isPending}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
