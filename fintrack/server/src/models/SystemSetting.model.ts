import mongoose, { Schema } from "mongoose";
import { ISystemSetting } from "../types/database.types";

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: [true, "Setting key is required"],
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, "Setting value is required"],
    },
    description: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

export const SystemSetting = mongoose.model<ISystemSetting>(
  "SystemSetting",
  systemSettingSchema
);
