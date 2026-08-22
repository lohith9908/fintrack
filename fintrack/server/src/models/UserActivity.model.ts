import mongoose, { Schema } from "mongoose";
import { IUserActivity } from "../types/database.types";

const userActivitySchema = new Schema<IUserActivity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Activity must belong to a user"],
      index: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
    },
    entityType: {
      type: String,
      required: [true, "Entity type is required"],
      trim: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
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

userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ user: 1, entityType: 1, createdAt: -1 });

export const UserActivity = mongoose.model<IUserActivity>("UserActivity", userActivitySchema);
