import mongoose, { Schema } from "mongoose";
import { IAccount } from "../types/database.types";

const accountSchema = new Schema<IAccount>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Account must belong to a user"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["CASH", "BANK_ACCOUNT", "CREDIT_CARD", "UPI", "OTHER"],
      required: [true, "Account type is required"],
    },
    openingBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
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

accountSchema.index({ user: 1, status: 1 });
accountSchema.index({ user: 1, name: 1 });

export const Account = mongoose.model<IAccount>("Account", accountSchema);
