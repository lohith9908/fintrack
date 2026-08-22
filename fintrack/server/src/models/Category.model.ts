import mongoose, { Schema } from "mongoose";
import { ICategory } from "../types/database.types";

const categorySchema = new Schema<ICategory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
      required: [true, "Category type is required"],
      index: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Compound index for user custom categories
categorySchema.index({ user: 1, type: 1, name: 1 });
// Compound index for system categories
categorySchema.index({ isSystem: 1, type: 1 });

export const Category = mongoose.model<ICategory>("Category", categorySchema);
