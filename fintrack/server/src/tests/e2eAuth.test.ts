import { app } from "../app";
import { Server } from "http";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDatabase, disconnectDatabase, isDatabaseConnected } from "../config/db";
import { User } from "../models";
import { AUTH_COOKIE_NAME } from "../utils/cookies";

export const runCompleteAuthVerification = async (): Promise<boolean> => {
  console.log("==========================================================");
  console.log("  FinTrack — Complete Phase 4 Authentication E2E Suite    ");
  console.log("==========================================================");

  let memoryServer: MongoMemoryServer | null = null;

  // 1. Establish database connection
  console.log("\n[Setup] Establishing MongoDB Connection...");
  await connectDatabase({ serverSelectionTimeoutMS: 2000 });

  if (!isDatabaseConnected()) {
    console.log("ℹ️ Local MongoDB instance not reachable. Starting isolated MongoMemoryServer for tests...");
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: "fintrack_auth_test" },
    });
    const testUri = memoryServer.getUri();
    await mongoose.connect(testUri);
    console.log(`✓ Isolated MongoMemoryServer connected at: ${testUri}`);
  } else {
    console.log("✓ MongoDB connected successfully for E2E tests");
  }

  const cleanupDatabase = async () => {
    await disconnectDatabase();
    if (memoryServer) {
      await memoryServer.stop();
      console.log("✓ Stopped isolated MongoMemoryServer");
    }
  };

  return new Promise((resolve, reject) => {
    // Start ephemeral HTTP server on a random free port
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
        const testEmail = `auth_test_${Date.now()}@example.com`;
        const testPassword = "SuperSecurePassword123!";
        const testName = "Verified Test User";

        // Clean up any lingering record with this email
        await User.deleteOne({ email: testEmail });

        // ----------------------------------------------------
        // Step 1 & 2: Register a valid test user & confirm 201
        // ----------------------------------------------------
        console.log("\n[Step 1 & 2] Registering valid test user via POST /api/auth/register");
        const regRes = await fetch(`${baseUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: testName,
            email: testEmail,
            password: testPassword,
            confirmPassword: testPassword,
          }),
        });

        const regData = await regRes.json();
        const regSetCookie = regRes.headers.get("set-cookie") || "";

        if (regRes.status !== 201 || !regData.success) {
          throw new Error(`Registration failed with status ${regRes.status}: ${JSON.stringify(regData)}`);
        }
        console.log("✓ Registration succeeded with HTTP 201 Created");

        // ----------------------------------------------------
        // Step 3: Confirm password is bcrypt-hashed in database
        // ----------------------------------------------------
        console.log("\n[Step 3] Checking database to confirm password is encrypted with bcrypt");
        const dbUser = await User.findOne({ email: testEmail }).select("+passwordHash");
        if (!dbUser || !dbUser.passwordHash) {
          throw new Error("User was not found in database or missing passwordHash");
        }
        const isBcryptFormat = dbUser.passwordHash.startsWith("$2a$") || dbUser.passwordHash.startsWith("$2b$");
        if (!isBcryptFormat) {
          throw new Error(`passwordHash is not in standard bcrypt format: ${dbUser.passwordHash}`);
        }
        const isPasswordMatch = await bcrypt.compare(testPassword, dbUser.passwordHash);
        if (!isPasswordMatch) {
          throw new Error("bcrypt.compare failed against stored passwordHash");
        }
        console.log("✓ User stored in MongoDB with secure bcrypt hash (hash never matches plaintext)");

        // ----------------------------------------------------
        // Step 4: Confirm response contains no JWT/token and no passwordHash
        // ----------------------------------------------------
        console.log("\n[Step 4] Confirming response body privacy (no token, no passwordHash)");
        if ("token" in regData || (regData.data && "token" in regData.data)) {
          throw new Error("Registration response body exposed raw JWT/token string!");
        }
        if ("passwordHash" in regData || (regData.data?.user && "passwordHash" in regData.data.user)) {
          throw new Error("Registration response body exposed passwordHash!");
        }
        console.log("✓ Response body contains ONLY safe user profile (zero tokens, zero password hashes leaked)");

        // ----------------------------------------------------
        // Step 5: Confirm HTTP-only fintrack_token cookie is set
        // ----------------------------------------------------
        console.log("\n[Step 5] Checking HTTP-only cookie headers");
        if (!regSetCookie.includes(AUTH_COOKIE_NAME)) {
          throw new Error(`Set-Cookie header does not contain ${AUTH_COOKIE_NAME}: ${regSetCookie}`);
        }
        if (!regSetCookie.toLowerCase().includes("httponly")) {
          throw new Error(`Cookie missing HttpOnly flag: ${regSetCookie}`);
        }
        const authCookie = regSetCookie.split(";")[0];
        console.log("✓ HTTP-only cookie set correctly:", authCookie);

        // ----------------------------------------------------
        // Step 6 & 7: Use cookie to call GET /api/auth/me & verify 200 + safe user data
        // ----------------------------------------------------
        console.log("\n[Step 6 & 7] Calling GET /api/auth/me with registration cookie");
        const meRes = await fetch(`${baseUrl}/auth/me`, {
          headers: { Cookie: authCookie },
        });
        const meData = await meRes.json();

        if (meRes.status !== 200 || !meData.success) {
          throw new Error(`GET /api/auth/me failed with status ${meRes.status}: ${JSON.stringify(meData)}`);
        }
        if (meData.data?.user?.email !== testEmail || meData.data?.user?.name !== testName) {
          throw new Error(`GET /api/auth/me returned incorrect user data: ${JSON.stringify(meData)}`);
        }
        if ("passwordHash" in meData.data.user || "token" in meData.data) {
          throw new Error("GET /api/auth/me leaked passwordHash or token!");
        }
        console.log("✓ GET /api/auth/me returned HTTP 200 with verified user profile for:", meData.data.user.email);

        // ----------------------------------------------------
        // Step 8, 9 & 10: Login with valid credentials & verify cookie + /me
        // ----------------------------------------------------
        console.log("\n[Step 8, 9 & 10] Logging in via POST /api/auth/login with valid credentials");
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword,
          }),
        });
        const loginData = await loginRes.json();
        const loginSetCookie = loginRes.headers.get("set-cookie") || "";

        if (loginRes.status !== 200 || !loginData.success) {
          throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`);
        }
        if ("token" in loginData || (loginData.data && "token" in loginData.data)) {
          throw new Error("Login response body exposed raw JWT/token string!");
        }
        if (!loginSetCookie.includes(AUTH_COOKIE_NAME) || !loginSetCookie.toLowerCase().includes("httponly")) {
          throw new Error(`Login failed to set HTTP-only cookie: ${loginSetCookie}`);
        }
        console.log("✓ Login succeeded with HTTP 200 and HTTP-only cookie issued");

        const loginAuthCookie = loginSetCookie.split(";")[0];
        const meAfterLoginRes = await fetch(`${baseUrl}/auth/me`, {
          headers: { Cookie: loginAuthCookie },
        });
        const meAfterLoginData = await meAfterLoginRes.json();
        if (meAfterLoginRes.status !== 200 || meAfterLoginData.data?.user?.email !== testEmail) {
          throw new Error("Session restoration after login failed");
        }
        console.log("✓ GET /api/auth/me confirmed 200 using login session cookie");

        // ----------------------------------------------------
        // Step 11: Logout and confirm cookie is cleared/expired
        // ----------------------------------------------------
        console.log("\n[Step 11] Logging out via POST /api/auth/logout");
        const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
          method: "POST",
          headers: { Cookie: loginAuthCookie },
        });
        const logoutData = await logoutRes.json();
        const logoutSetCookie = logoutRes.headers.get("set-cookie") || "";

        if (logoutRes.status !== 200 || !logoutData.success) {
          throw new Error(`Logout failed with status ${logoutRes.status}`);
        }
        if (!logoutSetCookie.includes("Expires=Thu, 01 Jan 1970")) {
          throw new Error(`Logout Set-Cookie header did not expire cookie: ${logoutSetCookie}`);
        }
        console.log("✓ Logout succeeded and returned expired cookie header");

        // Verify /me fails after logout
        const meAfterLogoutRes = await fetch(`${baseUrl}/auth/me`, {
          headers: { Cookie: "fintrack_token=;" },
        });
        if (meAfterLogoutRes.status !== 401) {
          throw new Error(`Expected 401 after logout, got ${meAfterLogoutRes.status}`);
        }
        console.log("✓ GET /api/auth/me after logout correctly rejected with HTTP 401");

        // ----------------------------------------------------
        // Step 12: Confirm invalid credentials return safe generic error
        // ----------------------------------------------------
        console.log("\n[Step 12] Testing safe generic error messages for invalid credentials");
        // Wrong password
        const wrongPassRes = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testEmail, password: "WrongPassword999!" }),
        });
        const wrongPassData = await wrongPassRes.json();
        if (wrongPassRes.status !== 401 || wrongPassData.message !== "Invalid email or password.") {
          throw new Error(`Wrong password returned unexpected response: ${JSON.stringify(wrongPassData)}`);
        }

        // Non-existent email
        const nonExistentRes = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "doesnotexist_98765@example.com", password: "SomePassword123!" }),
        });
        const nonExistentData = await nonExistentRes.json();
        if (nonExistentRes.status !== 401 || nonExistentData.message !== "Invalid email or password.") {
          throw new Error(`Non-existent email returned unexpected response: ${JSON.stringify(nonExistentData)}`);
        }
        console.log("✓ Safe generic error 'Invalid email or password.' returned identically for wrong email and wrong password");

        // ----------------------------------------------------
        // Cleanup test user
        // ----------------------------------------------------
        await User.deleteOne({ email: testEmail });
        console.log("✓ Cleaned up test user from MongoDB");

        console.log("\n==========================================================");
        console.log("  ✅ ALL 14 PHASE 4 AUTHENTICATION CHECKS PASSED!        ");
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
  runCompleteAuthVerification()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("\n❌ Auth Verification Suite Failed:", err);
      process.exit(1);
    });
}
