import { Schema, Types, model } from 'mongoose';

export const ACTION_TOKEN_TYPES = ['verify_email', 'reset_password'] as const;
export type ActionTokenType = (typeof ACTION_TOKEN_TYPES)[number];

/** Single-use tokens for email verification and password reset. Only the hash is stored. */
const actionTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ACTION_TOKEN_TYPES, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

actionTokenSchema.index({ userId: 1, type: 1 });
actionTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ActionToken = model('ActionToken', actionTokenSchema, 'actionTokens');
