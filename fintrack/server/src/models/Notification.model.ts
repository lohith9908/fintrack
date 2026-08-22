import mongoose, { Schema } from "mongoose";
import { INotification } from "../types/database.types";

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification must belong to a user"],
      index: true,
    },
    type: {
      type: String,
      enum: [
        "BUDGET_ALERT",
        "BUDGET_EXCEEDED",
        "RECURRING_PAYMENT",
        "GOAL_MILESTONE",
        "FINANCIAL_INSIGHT",
        "SYSTEM",
      ],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    severity: {
      type: String,
      enum: ["INFO", "SUCCESS", "WARNING", "CRITICAL"],
      default: "INFO",
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
