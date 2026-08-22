import mongoose, { Schema } from "mongoose";
import { ISavingsGoal } from "../types/database.types";

const savingsGoalSchema = new Schema<ISavingsGoal>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Savings goal must belong to a user"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [0.01, "Target amount must be positive"],
    },
    currentAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    targetDate: {
      type: Date,
      index: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"],
      default: "ACTIVE",
      index: true,
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

savingsGoalSchema.index({ user: 1, status: 1 });
savingsGoalSchema.index({ user: 1, targetDate: 1 });

export const SavingsGoal = mongoose.model<ISavingsGoal>("SavingsGoal", savingsGoalSchema);
