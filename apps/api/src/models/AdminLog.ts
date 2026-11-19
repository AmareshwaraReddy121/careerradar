import { Schema, Types, model } from 'mongoose';

const adminLogSchema = new Schema(
  {
    actorId: { type: Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entity: {
      kind: { type: String, required: true },
      id: { type: String, required: true },
    },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

adminLogSchema.index({ actorId: 1, createdAt: -1 });
adminLogSchema.index({ 'entity.kind': 1, 'entity.id': 1 });

export const AdminLog = model('AdminLog', adminLogSchema, 'adminLogs');
