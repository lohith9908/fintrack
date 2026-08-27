import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { isDatabaseConnected, disconnectDatabase } from "../config/db";

export const testDbLifecycleWithMemoryServer = async (): Promise<boolean> => {
  console.log("=== Testing Database Lifecycle Using Isolated Test Memory Server ===");

  // 1. Initial State
  console.log("1. Initial state:", isDatabaseConnected() ? "connected" : "disconnected");
  if (isDatabaseConnected()) {
    throw new Error("Expected initial state to be disconnected");
  }

  // 2. Start isolated test MongoDB instance
  console.log("2. Starting isolated test MongoMemoryServer...");
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: "fintrack_test",
    },
  });
  const testUri = mongoServer.getUri();
  console.log(`✓ Test MongoDB instance started at: ${testUri}`);

  // 3. Connect Mongoose to isolated test database
  console.log("3. Connecting Mongoose to test instance...");
  await mongoose.connect(testUri);
  if (!isDatabaseConnected()) {
    throw new Error("Mongoose failed to connect to test database");
  }
  console.log("✓ Mongoose connected to test database! Status:", isDatabaseConnected() ? "connected" : "disconnected");

  // 4. Disconnect Mongoose cleanly
  console.log("4. Disconnecting Mongoose...");
  await disconnectDatabase();
  if (isDatabaseConnected()) {
    throw new Error("Mongoose did not disconnect cleanly");
  }
  console.log("✓ Mongoose disconnected cleanly! Status:", isDatabaseConnected() ? "connected" : "disconnected");

  // 5. Stop test instance
  await mongoServer.stop();
  console.log("✓ Test MongoMemoryServer stopped successfully");

  console.log("\n✅ Isolated Database Lifecycle Test Passed!");
  return true;
};

if (require.main === module) {
  testDbLifecycleWithMemoryServer()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Test failed:", err);
      process.exit(1);
    });
}
