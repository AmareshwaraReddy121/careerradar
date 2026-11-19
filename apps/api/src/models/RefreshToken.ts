import { Schema, Types, model } from 'mongoose';

const refreshTokenSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    credentialVersion: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model('RefreshToken', refreshTokenSchema, 'refreshTokens');
