import mongoose, { Schema } from "mongoose";
import { IBudget } from "../types/database.types";

const alertThresholdsSchema = new Schema(
  {
    informational: { type: Number, default: 50 },
    warning: { type: Number, default: 75 },
    critical: { type: Number, default: 90 },
    exceeded: { type: Number, default: 100 },
  },
  { _id: false }
);

const budgetSchema = new Schema<IBudget>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Budget must belong to a user"],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Budget must be assigned to a category"],
      index: true,
    },
    month: {
      type: Number,
      required: [true, "Budget month is required"],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, "Budget year is required"],
    },
    limitAmount: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0.01, "Limit must be greater than zero"],
    },
    alertThresholds: {
      type: alertThresholdsSchema,
      default: () => ({
        informational: 50,
        warning: 75,
        critical: 90,
        exceeded: 100,
      }),
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

// Unique compound index preventing duplicate budgets for the same category in the same month/year
budgetSchema.index({ user: 1, category: 1, year: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>("Budget", budgetSchema);
