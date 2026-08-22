import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/database.types";

const profilePictureSchema = new Schema(
  {
    url: { type: String },
    storageKey: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const notificationPreferencesSchema = new Schema(
  {
    budgetAlerts: { type: Boolean, default: true },
    recurringPaymentAlerts: { type: Boolean, default: true },
    goalAlerts: { type: Boolean, default: true },
    financialInsights: { type: Boolean, default: true },
    systemNotifications: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // Never return in normal queries by default
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: profilePictureSchema,
      default: undefined,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    timezone: {
      type: String,
      required: true,
      default: "Asia/Kolkata",
    },
    dateFormat: {
      type: String,
      required: true,
      default: "DD/MM/YYYY",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({
        budgetAlerts: true,
        recurringPaymentAlerts: true,
        goalAlerts: true,
        financialInsights: true,
        systemNotifications: true,
      }),
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE",
      index: true,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>("User", userSchema);
