import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

interface DatabaseOptions {
  serverSelectionTimeoutMS?: number;
}

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const connectDatabase = async (options?: DatabaseOptions): Promise<typeof mongoose | null> => {
  const mongoUri = env.MONGO_URI;

  // Set Mongoose connection event listeners once
  mongoose.connection.on("connected", () => {
    logger.info("📦 Connected to MongoDB successfully");
  });

  mongoose.connection.on("error", (err) => {
    logger.error("❌ MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("⚠️ MongoDB disconnected");
  });

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: options?.serverSelectionTimeoutMS || 5000,
    });
    return conn;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Initial MongoDB connection attempt failed: ${errMessage}`);
    if (env.NODE_ENV === "production") {
      throw error;
    }
    // In development mode, log warning so dev server can still serve health check while DB starts
    logger.warn("⚠️ Server started without active MongoDB connection. Start MongoDB or inspect via MongoDB Compass.");
    return null;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      logger.info("🔌 Disconnected from MongoDB gracefully");
    } catch (err) {
      logger.error("Error while disconnecting from MongoDB:", err);
    }
  }
};
