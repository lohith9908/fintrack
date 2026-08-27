import mongoose, { Schema } from "mongoose";
import { IRecurringTransaction } from "../types/database.types";

const recurringTransactionSchema = new Schema<IRecurringTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recurring transaction must belong to a user"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
      required: [true, "Type is required"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Account is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "OTHER"],
      required: [true, "Payment method is required"],
    },
    frequency: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
      required: [true, "Frequency is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    nextOccurrence: {
      type: Date,
      required: [true, "Next occurrence date is required"],
      index: true,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastProcessedOccurrence: {
      type: Date,
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

recurringTransactionSchema.index({ user: 1, nextOccurrence: 1, isActive: 1 });
recurringTransactionSchema.index({ user: 1, isActive: 1 });

export const RecurringTransaction = mongoose.model<IRecurringTransaction>(
  "RecurringTransaction",
  recurringTransactionSchema
);
