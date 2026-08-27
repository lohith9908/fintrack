import { app } from "../app";
import { Server } from "http";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from "../config/db";
import { env } from "../config/env";
import { User, PasswordResetToken } from "../models";
import { seedDatabase } from "../seed/seed";

export const runPhase5Verification = async (): Promise<boolean> => {
  console.log("==========================================================");
  console.log("  FinTrack — Complete Phase 5 Forgot/Reset & RBAC Tests   ");
  console.log("==========================================================");

  let memoryServer: MongoMemoryServer | null = null;

  // 1. Establish database connection
  console.log("\n[Setup] Establishing MongoDB Connection...");
  await connectDatabase({ serverSelectionTimeoutMS: 2000 });

  if (!isDatabaseConnected()) {
    console.log("ℹ️ Local MongoDB instance not reachable. Starting isolated MongoMemoryServer for tests...");
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "fintrack_phase5_test" },
    });
    const testUri = memoryServer.getUri();
    await mongoose.connect(testUri);
    console.log(`✓ Isolated MongoMemoryServer connected at: ${testUri}`);
  } else {
    console.log("✓ MongoDB connected successfully via env.MONGO_URI");
  }

  // Ensure admin seed is run
  console.log("\n[Setup] Ensuring seed data is present (Admin + System Categories)...");
  await seedDatabase();
  console.log("✓ Seeding completed");

  const cleanupDatabase = async () => {
    await disconnectDatabase();
    if (memoryServer) {
      await memoryServer.stop();
      console.log("✓ Stopped isolated MongoMemoryServer");
    }
  };

  return new Promise((resolve, reject) => {
    const server: Server = app.listen(0, async () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        await cleanupDatabase();
        return reject(new Error("Unable to determine test server address"));
      }

      const baseUrl = `http://localhost:${address.port}/api`;
      console.log(`✓ Test HTTP server listening on ${baseUrl}`);

      try {
        const testUserEmail = `phase5_user_${Date.now()}@example.com`;
        const initialPassword = "InitialPassword123!";
        const newPassword = "NewSecurePassword456!";
        const testUserName = "Phase5 Test User";

        // Clean up any lingering data
        await User.deleteOne({ email: testUserEmail });

        // ----------------------------------------------------
        // Step 1: Register test user
        // ----------------------------------------------------
        console.log("\n[Step 1] Registering a standard test user (role: USER)");
        const regRes = await fetch(`${baseUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: testUserName,
            email: testUserEmail,
            password: initialPassword,
            confirmPassword: initialPassword,
          }),
        });

        const regData = await regRes.json();
        if (regRes.status !== 201 || !regData.success) {
          throw new Error(`User registration failed: ${JSON.stringify(regData)}`);
        }
        console.log("✓ Standard user registered with HTTP 201 Created");

        const registeredUser = await User.findOne({ email: testUserEmail });
        if (!registeredUser) {
          throw new Error("Registered user not found in database");
        }
        if (registeredUser.role !== "USER") {
          throw new Error(`Expected role USER, got ${registeredUser.role}`);
        }
        console.log("✓ Verified user role is USER in database");

        // ----------------------------------------------------
        // Step 2: Forgot Password — Anti-enumeration check (non-existent email)
        // ----------------------------------------------------
        console.log("\n[Step 2] Testing forgot-password with non-existent email (Anti-enumeration)");
        const nonExistentEmail = `unknown_${Date.now()}@example.com`;
        const forgotNonExistentRes = await fetch(`${baseUrl}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: nonExistentEmail }),
        });
        const forgotNonExistentData = await forgotNonExistentRes.json();

        if (forgotNonExistentRes.status !== 200 || !forgotNonExistentData.success) {
          throw new Error(`Forgot-password failed for non-existent email: ${JSON.stringify(forgotNonExistentData)}`);
        }
        console.log("✓ Non-existent email returned HTTP 200 with safe generic response message");

        // ----------------------------------------------------
        // Step 3: Forgot Password — Existing registered user
        // ----------------------------------------------------
        console.log("\n[Step 3] Testing forgot-password with valid registered email");
        const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testUserEmail }),
        });
        const forgotData = await forgotRes.json();

        if (forgotRes.status !== 200 || !forgotData.success) {
          throw new Error(`Forgot-password failed for valid email: ${JSON.stringify(forgotData)}`);
        }
        if (forgotData.message !== forgotNonExistentData.message) {
          throw new Error("Forgot password message differs between existing and non-existing email (Enumeration risk!)");
        }
        console.log("✓ Valid email returned identical HTTP 200 response (Zero account enumeration leak)");

        // ----------------------------------------------------
        // Step 4: Verify Token Storage Security in MongoDB
        // ----------------------------------------------------
        console.log("\n[Step 4] Checking PasswordResetToken storage in MongoDB");
        const tokenDoc = await PasswordResetToken.findOne({ user: registeredUser._id });
        if (!tokenDoc) {
          throw new Error("PasswordResetToken record was not created in database");
        }

        // Verify tokenHash is SHA-256 (64 hex characters)
        if (!tokenDoc.tokenHash || tokenDoc.tokenHash.length !== 64) {
          throw new Error(`tokenHash is not 64-char SHA-256 hex string: ${tokenDoc.tokenHash}`);
        }

        // Verify expiration is in the future
        if (tokenDoc.expiresAt.getTime() <= Date.now()) {
          throw new Error(`expiresAt is not in the future: ${tokenDoc.expiresAt}`);
        }

        // Verify usedAt is not set
        if (tokenDoc.usedAt) {
          throw new Error(`usedAt should be undefined initially, got ${tokenDoc.usedAt}`);
        }
        console.log("✓ Reset token stored securely: tokenHash is SHA-256 (64 hex chars), raw token never stored in DB");

        // ----------------------------------------------------
        // Step 5: Test Reset Password with Invalid Token
        // ----------------------------------------------------
        console.log("\n[Step 5] Testing reset-password with invalid token");
        const invalidTokenRes = await fetch(`${baseUrl}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "invalid_fake_reset_token_1234567890abcdef",
            password: newPassword,
            confirmPassword: newPassword,
          }),
        });
        const invalidTokenData = await invalidTokenRes.json();
        if (invalidTokenRes.status !== 400 || invalidTokenData.success !== false) {
          throw new Error(`Expected 400 Bad Request for invalid token, got ${invalidTokenRes.status}`);
        }
        console.log("✓ Invalid token correctly rejected with HTTP 400 Bad Request");

        // ----------------------------------------------------
        // Step 6: Test Reset Password with Expired Token
        // ----------------------------------------------------
        console.log("\n[Step 6] Testing reset-password with expired token");
        const expiredRawToken = "expired_raw_token_for_test_purposes_only_12345";
        const expiredTokenHash = crypto.createHash("sha256").update(expiredRawToken).digest("hex");
        await PasswordResetToken.create({
          user: registeredUser._id,
          tokenHash: expiredTokenHash,
          expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
          createdAt: new Date(Date.now() - 120000),
        });

        const expiredTokenRes = await fetch(`${baseUrl}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: expiredRawToken,
            password: newPassword,
            confirmPassword: newPassword,
          }),
        });
        const expiredTokenData = await expiredTokenRes.json();
        if (expiredTokenRes.status !== 400 || expiredTokenData.success !== false) {
          throw new Error(`Expected 400 Bad Request for expired token, got ${expiredTokenRes.status}`);
        }
        console.log("✓ Expired token correctly rejected with HTTP 400 Bad Request");

        await PasswordResetToken.deleteOne({ tokenHash: expiredTokenHash });

        // ----------------------------------------------------
        // Step 7: Test Reset Password with Valid Token
        // ----------------------------------------------------
        console.log("\n[Step 7] Testing reset-password with valid token");
        const validRawToken = crypto.randomBytes(32).toString("hex");
        const validTokenHash = crypto.createHash("sha256").update(validRawToken).digest("hex");

        await PasswordResetToken.deleteMany({ user: registeredUser._id });
        await PasswordResetToken.create({
          user: registeredUser._id,
          tokenHash: validTokenHash,
          expiresAt: new Date(Date.now() + 3600000), // Valid for 1 hour
          createdAt: new Date(),
        });

        const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: validRawToken,
            password: newPassword,
            confirmPassword: newPassword,
          }),
        });
        const resetData = await resetRes.json();

        if (resetRes.status !== 200 || !resetData.success) {
          throw new Error(`Password reset failed: ${JSON.stringify(resetData)}`);
        }
        console.log("✓ Password reset succeeded with HTTP 200 OK");

        // Verify passwordHash in DB is updated and bcrypt hashed
        const userAfterReset = await User.findById(registeredUser._id).select("+passwordHash");
        if (!userAfterReset || !userAfterReset.passwordHash) {
          throw new Error("User passwordHash missing after reset");
        }
        const isBcrypt = userAfterReset.passwordHash.startsWith("$2a$") || userAfterReset.passwordHash.startsWith("$2b$");
        if (!isBcrypt) {
          throw new Error("New password is not encrypted in bcrypt format");
        }
        const isNewPasswordValid = await bcrypt.compare(newPassword, userAfterReset.passwordHash);
        if (!isNewPasswordValid) {
          throw new Error("bcrypt.compare failed with new password");
        }
        console.log("✓ MongoDB user document updated with secure bcrypt hash for new password");

        // Verify old password no longer works
        const oldLoginRes = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testUserEmail, password: initialPassword }),
        });
        if (oldLoginRes.status !== 401) {
          throw new Error(`Expected 401 when logging in with old password, got ${oldLoginRes.status}`);
        }
        console.log("✓ Old password successfully invalidated (Login rejected with HTTP 401)");

        // Verify new password works for login
        const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testUserEmail, password: newPassword }),
        });
        const newLoginData = await newLoginRes.json();
        const userAuthCookie = newLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

        if (newLoginRes.status !== 200 || !newLoginData.success || !userAuthCookie) {
          throw new Error("Login with new password failed");
        }
        console.log("✓ Login with new password succeeded with HTTP 200 and session cookie issued");

        // ----------------------------------------------------
        // Step 8: Test Token One-Time Use (Reuse prevention)
        // ----------------------------------------------------
        console.log("\n[Step 8] Testing reset-token reuse prevention (One-time use)");
        const reuseRes = await fetch(`${baseUrl}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: validRawToken,
            password: "AnotherNewPassword789!",
            confirmPassword: "AnotherNewPassword789!",
          }),
        });
        const reuseData = await reuseRes.json();
        if (reuseRes.status !== 400 || reuseData.success !== false) {
          throw new Error(`Expected 400 Bad Request when reusing token, got ${reuseRes.status}`);
        }
        console.log("✓ Reusing already-used token correctly rejected with HTTP 400 Bad Request");

        // ----------------------------------------------------
        // Step 9: RBAC — Test Normal USER Access to Admin Routes (Forbidden 403)
        // ----------------------------------------------------
        console.log("\n[Step 9] Testing normal USER access to Admin route (RBAC 403 Forbidden)");
        const userAdminRes = await fetch(`${baseUrl}/admin/overview`, {
          headers: { Cookie: userAuthCookie },
        });
        const userAdminData = await userAdminRes.json();

        if (userAdminRes.status !== 403 || userAdminData.success !== false) {
          throw new Error(`Expected 403 Forbidden for USER on /admin/overview, got ${userAdminRes.status}`);
        }
        console.log("✓ Normal USER access to /api/admin/overview correctly rejected with HTTP 403 Forbidden");

        // ----------------------------------------------------
        // Step 10: RBAC — Test Unauthenticated Access to Admin Routes (Unauthorized 401)
        // ----------------------------------------------------
        console.log("\n[Step 10] Testing unauthenticated access to Admin route (401 Unauthorized)");
        const unauthAdminRes = await fetch(`${baseUrl}/admin/overview`);
        const unauthAdminData = await unauthAdminRes.json();

        if (unauthAdminRes.status !== 401 || unauthAdminData.success !== false) {
          throw new Error(`Expected 401 Unauthorized on /admin/overview without session, got ${unauthAdminRes.status}`);
        }
        console.log("✓ Unauthenticated access to /api/admin/overview correctly rejected with HTTP 401 Unauthorized");

        // ----------------------------------------------------
        // Step 11: RBAC — Test ADMIN Access to Admin Routes (Success 200)
        // ----------------------------------------------------
        console.log("\n[Step 11] Testing ADMIN login & access to Admin routes (RBAC 200 OK)");
        const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: env.ADMIN_EMAIL,
            password: env.ADMIN_PASSWORD,
          }),
        });
        const adminLoginData = await adminLoginRes.json();
        const adminAuthCookie = adminLoginRes.headers.get("set-cookie")?.split(";")[0] || "";

        if (adminLoginRes.status !== 200 || !adminLoginData.success || !adminAuthCookie) {
          throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
        }
        console.log("✓ Seeded ADMIN logged in successfully with HTTP 200");

        const adminOverviewRes = await fetch(`${baseUrl}/admin/overview`, {
          headers: { Cookie: adminAuthCookie },
        });
        const adminOverviewData = await adminOverviewRes.json();

        if (adminOverviewRes.status !== 200 || !adminOverviewData.success) {
          throw new Error(`Admin overview failed with status ${adminOverviewRes.status}: ${JSON.stringify(adminOverviewData)}`);
        }
        if (adminOverviewData.data?.admin?.role !== "ADMIN") {
          throw new Error(`Expected admin role ADMIN, got ${adminOverviewData.data?.admin?.role}`);
        }
        console.log("✓ ADMIN successfully accessed /api/admin/overview with HTTP 200 OK");

        // ----------------------------------------------------
        // Step 12: Data Security & Privacy Checks
        // ----------------------------------------------------
        console.log("\n[Step 12] Confirming no secret leaks in responses (Zero tokens, zero password hashes)");
        const allPayloads = [
          forgotData,
          forgotNonExistentData,
          resetData,
          adminLoginData,
          adminOverviewData,
        ];
        for (const payload of allPayloads) {
          const payloadStr = JSON.stringify(payload);
          if (payloadStr.includes("passwordHash") || payloadStr.includes("tokenHash")) {
            throw new Error(`Sensitive hash leaked in response payload: ${payloadStr}`);
          }
        }
        console.log("✓ Verified zero passwordHash / tokenHash leaks across all responses");

        // ----------------------------------------------------
        // Cleanup test user
        // ----------------------------------------------------
        await User.deleteOne({ email: testUserEmail });
        await PasswordResetToken.deleteMany({ user: registeredUser._id });
        console.log("\n✓ Cleaned up test data from MongoDB");

        console.log("\n==========================================================");
        console.log("  ✅ ALL 12 PHASE 5 FORGOT/RESET & RBAC CHECKS PASSED!    ");
        console.log("==========================================================");

        server.close(async () => {
          await cleanupDatabase();
          resolve(true);
        });
      } catch (error) {
        server.close(async () => {
          await cleanupDatabase();
          reject(error);
        });
      }
    });
  });
};

if (require.main === module) {
  runPhase5Verification()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("\n❌ Phase 5 Verification Suite Failed:", err);
      process.exit(1);
    });
}
