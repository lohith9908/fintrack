import mongoose, { Schema } from "mongoose";
import { ITransaction } from "../types/database.types";

const receiptMetadataSchema = new Schema(
  {
    fileId: { type: String },
    storageKey: { type: String },
    url: { type: String },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const transactionSchema = new Schema<ITransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transaction must belong to a user"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
      required: [true, "Transaction type is required"],
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Transaction must have a category"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Transaction description is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Transaction date is required"],
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "OTHER"],
      required: [true, "Payment method is required"],
      index: true,
    },
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Transaction must be associated with an account"],
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    receipt: {
      type: receiptMetadataSchema,
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

// Query optimization compound indexes matching DATABASESCHEMA.md
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });
transactionSchema.index({ user: 1, account: 1, date: -1 });
transactionSchema.index({ user: 1, paymentMethod: 1, date: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);
