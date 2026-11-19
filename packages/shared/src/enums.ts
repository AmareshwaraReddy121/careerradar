export const ROLES = ['user', 'moderator', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_RANK: Record<Role, number> = { user: 0, moderator: 1, admin: 2 };

export const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const QUALIFICATION_LEVELS = [
  'class_10',
  'class_12',
  'diploma',
  'graduate',
  'post_graduate',
  'doctorate',
] as const;
export type QualificationLevel = (typeof QUALIFICATION_LEVELS)[number];

export const QUALIFICATION_LABELS: Record<QualificationLevel, string> = {
  class_10: 'Class 10 (SSC)',
  class_12: 'Class 12 (HSC / Intermediate)',
  diploma: 'Diploma',
  graduate: "Bachelor's degree",
  post_graduate: "Master's degree",
  doctorate: 'Doctorate (PhD)',
};

export const RESERVATION_CATEGORIES = ['GEN', 'EWS', 'OBC_NCL', 'SC', 'ST'] as const;
export type ReservationCategory = (typeof RESERVATION_CATEGORIES)[number];

export const GENDERS = ['female', 'male', 'other', 'prefer_not_to_say'] as const;

export const SECTOR_PREFERENCES = ['government', 'private', 'both'] as const;
export type SectorPreference = (typeof SECTOR_PREFERENCES)[number];

export const JOB_CATEGORIES = [
  'banking',
  'government',
  'psu',
  'railways',
  'defence',
  'state_psc',
  'it',
  'finance',
  'manufacturing',
  'healthcare',
  'electronics',
  'telecom',
  'automobile',
  'consulting',
  'research',
  'startup',
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  banking: 'Banking',
  government: 'Government',
  psu: 'PSU',
  railways: 'Railways',
  defence: 'Defence & Research Orgs',
  state_psc: 'State PSC',
  it: 'IT & Software',
  finance: 'Finance',
  manufacturing: 'Manufacturing',
  healthcare: 'Healthcare',
  electronics: 'Electronics',
  telecom: 'Telecommunications',
  automobile: 'Automobile',
  consulting: 'Consulting',
  research: 'Research',
  startup: 'Startups',
};

export const SCORE_TYPES = ['percentage', 'cgpa'] as const;
export type ScoreType = (typeof SCORE_TYPES)[number];

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export const DIGEST_MODES = ['instant', 'daily', 'weekly'] as const;

export const NOTIFICATION_TOPICS = [
  'new_match',
  'deadline',
  'revision',
  'admit_card',
  'exam_date',
  'tech_update',
  'hiring_news',
] as const;
export type NotificationTopic = (typeof NOTIFICATION_TOPICS)[number];
