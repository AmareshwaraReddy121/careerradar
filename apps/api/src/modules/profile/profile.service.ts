import type { ProfileDTO, SensitiveProfileDTO, SensitiveProfileInput } from '@careerradar/shared';
import { profileSchema } from '@careerradar/shared';
import type { z } from 'zod';
import { decryptJson, encryptJson } from '../../lib/crypto';
import { notFound } from '../../lib/errors';
import { UserProfile } from '../../models';

type ProfileData = z.output<typeof profileSchema>;

export function totalExperienceMonths(
  experience: ProfileData['experience'],
  now = new Date(),
): number {
  let months = 0;
  for (const e of experience) {
    const end = e.endDate ?? now;
    const diff =
      (end.getFullYear() - e.startDate.getFullYear()) * 12 +
      (end.getMonth() - e.startDate.getMonth());
    months += Math.max(0, diff);
  }
  return months;
}

/** Share of the eligibility-relevant fields that are filled in, 0–100. */
export function profileCompleteness(p: Partial<ProfileData>): number {
  const checks = [
    !!p.fullName,
    !!p.dateOfBirth,
    !!p.highestQualification,
    (p.education?.length ?? 0) > 0,
    !!p.education?.some((e) => e.score != null),
    !!p.education?.some((e) => e.graduationYear != null),
    (p.skills?.length ?? 0) > 0,
    (p.preferences?.categories?.length ?? 0) > 0,
    (p.preferences?.locations?.length ?? 0) > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

type ProfileDocLike = ProfileData & {
  _id: unknown;
  userId: unknown;
  totalExperienceMonths: number;
  profileVersion: number;
  updatedAt: Date;
};

export function toProfileDTO(doc: ProfileDocLike): ProfileDTO {
  const data: ProfileData = {
    fullName: doc.fullName,
    dateOfBirth: doc.dateOfBirth ?? null,
    highestQualification: doc.highestQualification ?? null,
    education: (doc.education ?? []).map((e) => ({
      level: e.level,
      degreeCode: e.degreeCode,
      branchCode: e.branchCode ?? null,
      university: e.university ?? null,
      graduationYear: e.graduationYear ?? null,
      scoreType: e.scoreType ?? null,
      score: e.score ?? null,
      scale: e.scale ?? null,
      isAppearing: !!e.isAppearing,
    })),
    skills: (doc.skills ?? []).map((s) => ({ name: s.name, level: s.level })),
    technicalKnowledge: doc.technicalKnowledge ?? null,
    experience: (doc.experience ?? []).map((x) => ({
      organization: x.organization,
      title: x.title,
      startDate: x.startDate,
      endDate: x.endDate ?? null,
      domain: x.domain ?? null,
    })),
    preferences: {
      categories: doc.preferences?.categories ?? [],
      locations: doc.preferences?.locations ?? [],
      sector: doc.preferences?.sector ?? 'both',
      minSalaryLpa: doc.preferences?.minSalaryLpa ?? null,
    },
  };
  return {
    ...data,
    id: String(doc._id),
    userId: String(doc.userId),
    totalExperienceMonths: doc.totalExperienceMonths ?? 0,
    profileVersion: doc.profileVersion ?? 1,
    completeness: profileCompleteness(data),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function getProfile(userId: string): Promise<ProfileDTO> {
  const doc = await UserProfile.findOne({ userId }).lean();
  if (!doc) throw notFound('Profile not found');
  return toProfileDTO(doc as unknown as ProfileDocLike);
}

export async function updateProfile(userId: string, data: ProfileData): Promise<ProfileDTO> {
  const dedupedSkills = new Map<string, ProfileData['skills'][number]>();
  for (const s of data.skills) dedupedSkills.set(s.name.toLowerCase(), s);

  const doc = await UserProfile.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...data,
        skills: [...dedupedSkills.values()].map((s) => ({
          ...s,
          normalizedName: s.name.toLowerCase(),
        })),
        totalExperienceMonths: totalExperienceMonths(data.experience),
      },
      $inc: { profileVersion: 1 },
    },
    { new: true, runValidators: true },
  ).lean();
  if (!doc) throw notFound('Profile not found');
  return toProfileDTO(doc as unknown as ProfileDocLike);
}

const EMPTY_SENSITIVE: SensitiveProfileInput = {
  category: null,
  pwbd: null,
  exServiceman: null,
  gender: null,
  nationality: null,
  domicileState: null,
};

export async function getSensitive(userId: string): Promise<SensitiveProfileDTO> {
  const doc = await UserProfile.findOne({ userId })
    .select('+sensitiveEncrypted sensitiveConsentAt')
    .lean();
  if (!doc) throw notFound('Profile not found');
  const data = doc.sensitiveEncrypted
    ? decryptJson<SensitiveProfileInput>(doc.sensitiveEncrypted)
    : EMPTY_SENSITIVE;
  return {
    ...EMPTY_SENSITIVE,
    ...data,
    consentGivenAt: doc.sensitiveConsentAt?.toISOString() ?? null,
  };
}

export async function updateSensitive(
  userId: string,
  data: SensitiveProfileInput,
): Promise<SensitiveProfileDTO> {
  const clean = { ...EMPTY_SENSITIVE, ...data };
  const doc = await UserProfile.findOneAndUpdate(
    { userId },
    {
      $set: { sensitiveEncrypted: encryptJson(clean), sensitiveConsentAt: new Date() },
      $inc: { profileVersion: 1 },
    },
    { new: true },
  ).lean();
  if (!doc) throw notFound('Profile not found');
  return { ...clean, consentGivenAt: doc.sensitiveConsentAt?.toISOString() ?? null };
}

export async function deleteSensitive(userId: string): Promise<void> {
  await UserProfile.updateOne(
    { userId },
    { $set: { sensitiveEncrypted: null, sensitiveConsentAt: null }, $inc: { profileVersion: 1 } },
  );
}
