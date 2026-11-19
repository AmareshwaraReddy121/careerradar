import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { DIGEST_MODES, NOTIFICATION_TOPICS, ROLES, USER_STATUSES } from '@careerradar/shared';

const consentSchema = new Schema(
  {
    type: { type: String, required: true },
    version: { type: String, required: true },
    grantedAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { _id: false },
);

const defaultTopics = Object.fromEntries(NOTIFICATION_TOPICS.map((t) => [t, true]));

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user', required: true },
    status: { type: String, enum: USER_STATUSES, default: 'active', required: true },
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    consents: { type: [consentSchema], default: [] },
    notificationPrefs: {
      channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
      },
      topics: { type: Schema.Types.Mixed, default: () => ({ ...defaultTopics }) },
      digest: { type: String, enum: DIGEST_MODES, default: 'instant' },
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, status: 1 });

export type UserAttrs = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserAttrs>;
export const User = model('User', userSchema, 'users');
