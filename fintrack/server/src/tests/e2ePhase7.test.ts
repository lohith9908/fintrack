import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { User } from "../models";
import { env } from "../config/env";
import { seedDatabase } from "../seed/seed";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  currency: string;
  timezone: string;
  phone?: string;
  notificationPreferences?: {
    budgetAlerts: boolean;
    recurringPaymentAlerts: boolean;
    goalAlerts: boolean;
    financialInsights: boolean;
    systemNotifications: boolean;
  };
}

async function runPhase7Tests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Complete Phase 7 User Profile & Settings Tests");
  console.log("==========================================================\n");

  let mongoServer: MongoMemoryServer | null = null;
  let server: http.Server | null = null;
  let baseUrl = "";

  try {
    // 1. Start MongoDB connection
    console.log("[Setup] Connecting to MongoDB...");
    try {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      console.log(`✓ Connected to configured MongoDB: ${env.MONGODB_URI}`);
    } catch {
      console.log("ℹ️ Local MongoDB unreachable. Starting isolated MongoMemoryServer...");
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✓ Isolated MongoMemoryServer connected at: ${memoryUri}`);
    }

    // 2. Ensure Seed Database
    await seedDatabase();

    // 3. Start Test HTTP Server
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server!.address();
        const port = typeof addr === "object" && addr ? addr.port : 5000;
        baseUrl = `http://localhost:${port}/api`;
        console.log(`✓ Test HTTP server listening on ${baseUrl}\n`);
        resolve();
      });
    });

    const testEmail = `phase7_user_${Date.now()}@example.com`;
    const initialPassword = "Password123";
    let authCookie = "";

    // Helper for requests
    const apiRequest = async <T = unknown>(
      path: string,
      options: {
        method?: string;
        body?: unknown;
        cookie?: string;
      } = {}
    ): Promise<{ status: number; body: ApiResponse<T>; cookie?: string }> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (options.cookie) {
        headers["Cookie"] = options.cookie;
      }

      const res = await fetch(`${baseUrl}${path}`, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const setCookie = res.headers.get("set-cookie");
      let cookieResult: string | undefined;
      if (setCookie) {
        cookieResult = setCookie.split(";")[0];
      }

      const body = (await res.json()) as ApiResponse<T>;
      return { status: res.status, body, cookie: cookieResult };
    }

    // Step 1: Register User
    console.log("[Step 1] Registering standard user for Phase 7 tests");
    const regRes = await apiRequest<{ user: UserData }>("/auth/register", {
      method: "POST",
      body: {
        name: "Phase 7 Tester",
        email: testEmail,
        password: initialPassword,
        confirmPassword: initialPassword,
      },
    });

    assert.equal(regRes.status, 201, "Registration should return HTTP 201");
    assert.ok(regRes.cookie, "Registration should return HTTP-only auth cookie");
    authCookie = regRes.cookie!;
    console.log("✓ Registered user successfully with HTTP 201 and auth cookie");

    // Step 2: Get Profile via GET /api/users/me
    console.log("\n[Step 2] Testing GET /api/users/me");
    const meRes = await apiRequest<{ user: UserData }>("/users/me", {
      cookie: authCookie,
    });

    assert.equal(meRes.status, 200, "GET /users/me should return HTTP 200");
    assert.equal(meRes.body.data?.user.email, testEmail);
    assert.equal(meRes.body.data?.user.name, "Phase 7 Tester");
    assert.equal((meRes.body.data?.user as unknown as { passwordHash?: string }).passwordHash, undefined);
    console.log("✓ Profile retrieved successfully without passwordHash");

    // Step 3: Update Profile via PATCH /api/users/profile
    console.log("\n[Step 3] Testing PATCH /api/users/profile (Name, Currency, Timezone, Notifications)");
    const updateRes = await apiRequest<{ user: UserData }>("/users/profile", {
      method: "PATCH",
      cookie: authCookie,
      body: {
        name: "Alex Phase 7 Updated",
        phone: "+91 99999 88888",
        currency: "USD",
        timezone: "America/New_York",
        dateFormat: "YYYY-MM-DD",
        theme: "dark",
        notificationPreferences: {
          budgetAlerts: true,
          recurringPaymentAlerts: false,
          goalAlerts: true,
          financialInsights: true,
          systemNotifications: false,
        },
      },
    });

    assert.equal(updateRes.status, 200, "PATCH /users/profile should return HTTP 200");
    assert.equal(updateRes.body.data?.user.name, "Alex Phase 7 Updated");
    assert.equal(updateRes.body.data?.user.currency, "USD");
    assert.equal(updateRes.body.data?.user.timezone, "America/New_York");
    assert.equal(updateRes.body.data?.user.notificationPreferences?.recurringPaymentAlerts, false);
    assert.equal(updateRes.body.data?.user.notificationPreferences?.budgetAlerts, true);
    console.log("✓ Profile and notification preferences updated in MongoDB successfully");

    // Step 4: Change Password - Invalid Current Password
    console.log("\n[Step 4] Testing POST /api/users/change-password with invalid current password");
    const badPwRes = await apiRequest("/users/change-password", {
      method: "POST",
      cookie: authCookie,
      body: {
        currentPassword: "WrongPassword999",
        newPassword: "NewSecretPassword2026",
        confirmPassword: "NewSecretPassword2026",
      },
    });

    assert.equal(badPwRes.status, 401, "Invalid current password should return HTTP 401");
    console.log("✓ Incorrect current password correctly rejected with HTTP 401 Unauthorized");

    // Step 5: Change Password - Valid
    console.log("\n[Step 5] Testing POST /api/users/change-password with valid credentials");
    const changePwRes = await apiRequest("/users/change-password", {
      method: "POST",
      cookie: authCookie,
      body: {
        currentPassword: initialPassword,
        newPassword: "NewSecretPassword2026",
        confirmPassword: "NewSecretPassword2026",
      },
    });

    assert.equal(changePwRes.status, 200, "Valid password change should return HTTP 200");
    console.log("✓ Password changed successfully with HTTP 200");

    // Step 6: Verify Old Password Invalidation
    console.log("\n[Step 6] Verifying old password cannot be used for login");
    const oldLoginRes = await apiRequest("/auth/login", {
      method: "POST",
      body: {
        email: testEmail,
        password: initialPassword,
      },
    });

    assert.equal(oldLoginRes.status, 401, "Old password login should be rejected with HTTP 401");
    console.log("✓ Old password login correctly rejected with HTTP 401");

    // Step 7: Verify Login with New Password
    console.log("\n[Step 7] Testing login with new password");
    const newLoginRes = await apiRequest<{ user: UserData }>("/auth/login", {
      method: "POST",
      body: {
        email: testEmail,
        password: "NewSecretPassword2026",
      },
    });

    assert.equal(newLoginRes.status, 200, "New password login should return HTTP 200");
    assert.ok(newLoginRes.cookie, "New session cookie issued");
    authCookie = newLoginRes.cookie!;
    console.log("✓ New password login succeeded with HTTP 200 and refreshed session cookie");

    // Step 8: Unauthenticated Access Guard
    console.log("\n[Step 8] Testing unauthenticated access to /api/users/profile");
    const unauthRes = await apiRequest("/users/profile", {
      method: "PATCH",
      body: { name: "Hacker Attempt" },
    });

    assert.equal(unauthRes.status, 401, "Unauthenticated access should return HTTP 401");
    console.log("✓ Unauthenticated request correctly blocked with HTTP 401 Unauthorized");

    // Step 9: Delete Account - Wrong Password
    console.log("\n[Step 9] Testing DELETE /api/users/me with wrong password");
    const badDeleteRes = await apiRequest("/users/me", {
      method: "DELETE",
      cookie: authCookie,
      body: { password: "WrongPassword" },
    });

    assert.equal(badDeleteRes.status, 401, "Wrong password deletion should return HTTP 401");
    console.log("✓ Account deletion with wrong password rejected with HTTP 401");

    // Step 10: Delete Account - Valid Password
    console.log("\n[Step 10] Testing DELETE /api/users/me with valid password");
    const deleteRes = await apiRequest("/users/me", {
      method: "DELETE",
      cookie: authCookie,
      body: { password: "NewSecretPassword2026" },
    });

    assert.equal(deleteRes.status, 200, "Account deletion should return HTTP 200");
    console.log("✓ Account deleted successfully with HTTP 200");

    // Step 11: Verify user deleted from database
    console.log("\n[Step 11] Verifying user document removed from MongoDB");
    const dbUser = await User.findOne({ email: testEmail });
    assert.equal(dbUser, null, "User must no longer exist in MongoDB");
    console.log("✓ User successfully purged from MongoDB");

    console.log("\n==========================================================");
    console.log("  ✅ ALL 11 PHASE 7 PROFILE & SETTINGS CHECKS PASSED!     ");
    console.log("==========================================================\n");
  } finally {
    if (server) {
      await new Promise<void>((resolve) => (server as http.Server).close(() => resolve()));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB gracefully");
    }
    if (mongoServer) {
      await mongoServer.stop();
      console.log("✓ Stopped isolated MongoMemoryServer");
    }
  }
}

runPhase7Tests().catch((err) => {
  console.error("❌ Phase 7 test suite failed:", err);
  process.exit(1);
});
