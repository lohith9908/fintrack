import mongoose, { Schema } from "mongoose";
import { IPasswordResetToken } from "../types/database.types";

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Token must belong to a user"],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, "Token hash is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
    usedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
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

// TTL Index for automatic MongoDB purge of expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetTokenSchema.index({ user: 1, tokenHash: 1 });

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  "PasswordResetToken",
  passwordResetTokenSchema
);
