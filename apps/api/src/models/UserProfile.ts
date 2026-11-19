import { Schema, Types, model, type InferSchemaType } from 'mongoose';
import {
  BRANCH_CODES,
  DEGREE_CODES,
  JOB_CATEGORIES,
  QUALIFICATION_LEVELS,
  SCORE_TYPES,
  SECTOR_PREFERENCES,
  SKILL_LEVELS,
} from '@careerradar/shared';

const educationSchema = new Schema(
  {
    level: { type: String, enum: QUALIFICATION_LEVELS, required: true },
    degreeCode: { type: String, enum: DEGREE_CODES, required: true },
    branchCode: { type: String, enum: [...BRANCH_CODES, null], default: null },
    university: { type: String, default: null },
    graduationYear: { type: Number, default: null },
    scoreType: { type: String, enum: [...SCORE_TYPES, null], default: null },
    score: { type: Number, default: null },
    scale: { type: Number, default: null },
    isAppearing: { type: Boolean, default: false },
  },
  { _id: false },
);

const skillSchema = new Schema(
  {
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    level: { type: String, enum: SKILL_LEVELS, default: 'intermediate' },
  },
  { _id: false },
);

const experienceSchema = new Schema(
  {
    organization: { type: String, required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    domain: { type: String, default: null },
  },
  { _id: false },
);

const profileSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    highestQualification: { type: String, enum: [...QUALIFICATION_LEVELS, null], default: null },
    education: { type: [educationSchema], default: [] },
    skills: { type: [skillSchema], default: [] },
    technicalKnowledge: { type: String, default: null },
    experience: { type: [experienceSchema], default: [] },
    totalExperienceMonths: { type: Number, default: 0 },
    preferences: {
      categories: { type: [String], enum: JOB_CATEGORIES, default: [] },
      locations: { type: [String], default: [] },
      sector: { type: String, enum: SECTOR_PREFERENCES, default: 'both' },
      minSalaryLpa: { type: Number, default: null },
    },
    /** AES-256-GCM encrypted JSON of sensitive, consented fields (category, PwBD, ...). */
    sensitiveEncrypted: { type: String, default: null, select: false },
    sensitiveConsentAt: { type: Date, default: null },
    profileVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

profileSchema.index({ 'education.branchCode': 1 });
profileSchema.index({ 'preferences.categories': 1 });
profileSchema.index({ highestQualification: 1 });

export type ProfileAttrs = InferSchemaType<typeof profileSchema>;
export const UserProfile = model('UserProfile', profileSchema, 'userProfiles');
