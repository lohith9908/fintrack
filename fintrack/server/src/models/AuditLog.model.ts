import mongoose, { Schema } from "mongoose";
import { IAuditLog } from "../types/database.types";

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actor is required"],
      index: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    targetType: {
      type: String,
      required: [true, "Target type is required"],
      trim: true,
    },
    targetId: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
