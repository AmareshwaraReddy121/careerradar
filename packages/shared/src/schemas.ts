import { z } from 'zod';
import {
  DIGEST_MODES,
  GENDERS,
  NOTIFICATION_TOPICS,
  QUALIFICATION_LEVELS,
  RESERVATION_CATEGORIES,
  SCORE_TYPES,
  SECTOR_PREFERENCES,
  SKILL_LEVELS,
  JOB_CATEGORIES,
} from './enums';
import { BRANCH_CODES, DEGREE_CODES } from './taxonomies';

const trimmed = (max: number) => z.string().trim().max(max);

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  fullName: trimmed(100).min(2, 'Enter your full name'),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and privacy policy' }),
  }),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const tokenSchema = z.object({ token: z.string().min(16).max(256) });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(16).max(256),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

const currentYear = new Date().getFullYear();

export const educationSchema = z
  .object({
    level: z.enum(QUALIFICATION_LEVELS),
    degreeCode: z.enum(DEGREE_CODES as [string, ...string[]]),
    branchCode: z.enum(BRANCH_CODES as [string, ...string[]]).nullish(),
    university: trimmed(150).nullish(),
    graduationYear: z
      .number()
      .int()
      .min(1960)
      .max(currentYear + 6)
      .nullish(),
    scoreType: z.enum(SCORE_TYPES).nullish(),
    score: z.number().min(0).max(100).nullish(),
    scale: z.number().min(1).max(100).nullish(),
    isAppearing: z.boolean().default(false),
  })
  .superRefine((e, ctx) => {
    if (e.score != null && !e.scoreType) {
      ctx.addIssue({ code: 'custom', path: ['scoreType'], message: 'Select percentage or CGPA' });
    }
    if (e.scoreType === 'cgpa' && e.score != null) {
      const scale = e.scale ?? 10;
      if (e.score > scale) {
        ctx.addIssue({ code: 'custom', path: ['score'], message: `CGPA cannot exceed ${scale}` });
      }
    }
  });
export type EducationInput = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  name: trimmed(60).min(1),
  level: z.enum(SKILL_LEVELS).default('intermediate'),
});

export const experienceSchema = z
  .object({
    organization: trimmed(120).min(1),
    title: trimmed(120).min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullish(),
    domain: trimmed(80).nullish(),
  })
  .refine((e) => !e.endDate || e.endDate >= e.startDate, {
    path: ['endDate'],
    message: 'End date must be after start date',
  });

export const preferencesSchema = z.object({
  categories: z.array(z.enum(JOB_CATEGORIES)).max(20).default([]),
  locations: z.array(trimmed(80)).max(20).default([]),
  sector: z.enum(SECTOR_PREFERENCES).default('both'),
  minSalaryLpa: z.number().min(0).max(500).nullish(),
});

export const profileSchema = z.object({
  fullName: trimmed(100).min(2),
  dateOfBirth: z.coerce
    .date()
    .refine((d) => d < new Date(), 'Date of birth must be in the past')
    .nullish(),
  highestQualification: z.enum(QUALIFICATION_LEVELS).nullish(),
  education: z.array(educationSchema).max(10).default([]),
  skills: z.array(skillSchema).max(100).default([]),
  technicalKnowledge: trimmed(2000).nullish(),
  experience: z.array(experienceSchema).max(30).default([]),
  preferences: preferencesSchema.default({}),
});
export type ProfileInput = z.input<typeof profileSchema>;

export const sensitiveProfileSchema = z.object({
  category: z.enum(RESERVATION_CATEGORIES).nullish(),
  pwbd: z.boolean().nullish(),
  exServiceman: z.boolean().nullish(),
  gender: z.enum(GENDERS).nullish(),
  nationality: trimmed(60).nullish(),
  domicileState: trimmed(60).nullish(),
});
export type SensitiveProfileInput = z.infer<typeof sensitiveProfileSchema>;

export const sensitiveConsentSchema = sensitiveProfileSchema.extend({
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required to store these details' }),
  }),
});

export const notificationPrefsSchema = z.object({
  channels: z.object({ inApp: z.boolean(), email: z.boolean(), push: z.boolean() }),
  topics: z.record(z.enum(NOTIFICATION_TOPICS), z.boolean()),
  digest: z.enum(DIGEST_MODES),
});
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;
