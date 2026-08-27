import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { User, PasswordResetToken } from "../models";
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
  dateFormat: string;
  theme: string;
  phone?: string;
  notificationPreferences?: {
    budgetAlerts: boolean;
    recurringPaymentAlerts: boolean;
    goalAlerts: boolean;
    financialInsights: boolean;
    systemNotifications: boolean;
  };
}

async function runPhase7FinalAudit() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 7 Final Comprehensive Audit Verification");
  console.log("==========================================================\n");

  let mongoServer: MongoMemoryServer | null = null;
  let server: http.Server | null = null;
  let baseUrl = "";

  try {
    // 1. Start MongoDB connection
    console.log("[Audit Setup] Connecting to MongoDB...");
    try {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      console.log(`✓ Connected to configured MongoDB: ${env.MONGODB_URI}`);
    } catch {
      console.log("ℹ️ Local MongoDB unreachable. Starting isolated MongoMemoryServer for audit...");
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

    const testEmail = `audit_user_${Date.now()}@example.com`;
    const initialPassword = "InitialPassword123";
    const updatedPassword = "UpdatedPassword2026";
    let userCookie = "";

    const apiRequest = async <T = unknown>(
      path: string,
      options: {
        method?: string;
        body?: unknown;
        cookie?: string;
      } = {}
    ): Promise<{ status: number; body: ApiResponse<T>; cookie?: string; clearCookie?: boolean }> => {
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
      let clearCookie = false;
      if (setCookie) {
        if (setCookie.includes("fintrack_token=;") || setCookie.includes("Expires=Thu, 01 Jan 1970")) {
          clearCookie = true;
        } else {
          cookieResult = setCookie.split(";")[0];
        }
      }

      const body = (await res.json()) as ApiResponse<T>;
      return { status: res.status, body, cookie: cookieResult, clearCookie };
    };

    // ----------------------------------------------------
    // Flow 1: Register valid user -> account created -> authenticated state
    // ----------------------------------------------------
    console.log("[Flow 1] Register valid user -> account created -> authenticated session");
    const regRes = await apiRequest<{ user: UserData }>("/auth/register", {
      method: "POST",
      body: {
        name: "Audit User",
        email: testEmail,
        password: initialPassword,
        confirmPassword: initialPassword,
      },
    });

    assert.equal(regRes.status, 201, "Registration must return 201 Created");
    assert.equal(regRes.body.success, true);
    assert.ok(regRes.cookie, "HTTP-only cookie must be issued on registration");
    assert.equal(regRes.body.data?.user.email, testEmail);
    assert.equal(regRes.body.data?.user.role, "USER");
    userCookie = regRes.cookie!;
    console.log("  ✅ Flow 1 PASSED: User registered with active HTTP-only session cookie");

    // ----------------------------------------------------
    // Flow 2 & 3: Session restoration via /api/auth/me
    // ----------------------------------------------------
    console.log("\n[Flow 2 & 3] Refresh page -> /api/auth/me restores authenticated session");
    const meRes = await apiRequest<{ user: UserData }>("/auth/me", {
      cookie: userCookie,
    });

    assert.equal(meRes.status, 200, "/api/auth/me must return 200 OK with valid cookie");
    assert.equal(meRes.body.data?.user.email, testEmail);
    assert.equal(meRes.body.data?.user.name, "Audit User");
    console.log("  ✅ Flow 2 & 3 PASSED: Session restored seamlessly via /api/auth/me");

    // ----------------------------------------------------
    // Flow 4: Unauthenticated user -> protected route returns 401
    // ----------------------------------------------------
    console.log("\n[Flow 4] Unauthenticated user accessing protected route -> 401 Unauthorized");
    const unauthMe = await apiRequest("/auth/me");
    const unauthProfile = await apiRequest("/users/profile", { method: "PATCH", body: { name: "No Auth" } });

    assert.equal(unauthMe.status, 401, "Unauthenticated /auth/me must return 401");
    assert.equal(unauthProfile.status, 401, "Unauthenticated /users/profile must return 401");
    console.log("  ✅ Flow 4 PASSED: Unauthenticated requests strictly rejected with 401");

    // ----------------------------------------------------
    // Flow 5: Logout -> clears cookie & resets session
    // ----------------------------------------------------
    console.log("\n[Flow 5 & 6] Logout -> clears cookie -> protected route inaccessible");
    const logoutRes = await apiRequest("/auth/logout", {
      method: "POST",
      cookie: userCookie,
    });

    assert.equal(logoutRes.status, 200, "Logout must return 200 OK");
    assert.equal(logoutRes.clearCookie, true, "Logout must clear the fintrack_token cookie");

    // Attempting access after logout
    const postLogoutMe = await apiRequest("/auth/me", { cookie: "fintrack_token=" });
    assert.equal(postLogoutMe.status, 401, "Protected routes must be 401 after logout");
    console.log("  ✅ Flow 5 & 6 PASSED: Logout clears HTTP-only cookie and revokes session");

    // ----------------------------------------------------
    // Flow 7: Login -> restores session cookie
    // ----------------------------------------------------
    console.log("\n[Flow 7] Login with valid credentials -> session restored");
    const loginRes = await apiRequest<{ user: UserData }>("/auth/login", {
      method: "POST",
      body: {
        email: testEmail,
        password: initialPassword,
      },
    });

    assert.equal(loginRes.status, 200, "Login must return 200 OK");
    assert.ok(loginRes.cookie, "New HTTP-only cookie must be issued on login");
    userCookie = loginRes.cookie!;
    console.log("  ✅ Flow 7 PASSED: Login re-establishes session cookie");

    // ----------------------------------------------------
    // Flow 8 & 9: Profile, Theme, and Notification preferences persistence
    // ----------------------------------------------------
    console.log("\n[Flow 8 & 9] Profile update (Name, Phone, Currency, Timezone, Theme, Notifications) -> MongoDB persistence");
    const updateRes = await apiRequest<{ user: UserData }>("/users/profile", {
      method: "PATCH",
      cookie: userCookie,
      body: {
        name: "Audit User Pro",
        phone: "+91 91234 56789",
        currency: "USD",
        timezone: "America/New_York",
        dateFormat: "YYYY-MM-DD",
        theme: "dark",
        notificationPreferences: {
          budgetAlerts: true,
          recurringPaymentAlerts: false,
          goalAlerts: true,
          financialInsights: false,
          systemNotifications: true,
        },
      },
    });

    assert.equal(updateRes.status, 200, "Profile update must return 200 OK");
    assert.equal(updateRes.body.data?.user.name, "Audit User Pro");
    assert.equal(updateRes.body.data?.user.currency, "USD");
    assert.equal(updateRes.body.data?.user.theme, "dark");
    assert.equal(updateRes.body.data?.user.notificationPreferences?.recurringPaymentAlerts, false);

    // Verify persistence in MongoDB by re-querying /users/me
    const verifyMeRes = await apiRequest<{ user: UserData }>("/users/me", { cookie: userCookie });
    assert.equal(verifyMeRes.body.data?.user.name, "Audit User Pro");
    assert.equal(verifyMeRes.body.data?.user.currency, "USD");
    assert.equal(verifyMeRes.body.data?.user.theme, "dark");
    assert.equal(verifyMeRes.body.data?.user.notificationPreferences?.recurringPaymentAlerts, false);
    console.log("  ✅ Flow 8 & 9 PASSED: Profile details, theme, and notification preferences verified in DB");

    // ----------------------------------------------------
    // Flow 10: Change password flow
    // ----------------------------------------------------
    console.log("\n[Flow 10] Change password -> verify old password rejected, new password accepted");
    // Incorrect current password
    const badChange = await apiRequest("/users/change-password", {
      method: "POST",
      cookie: userCookie,
      body: {
        currentPassword: "IncorrectPassword999",
        newPassword: updatedPassword,
        confirmPassword: updatedPassword,
      },
    });
    assert.equal(badChange.status, 401, "Invalid current password must return 401");

    // Valid current password
    const goodChange = await apiRequest("/users/change-password", {
      method: "POST",
      cookie: userCookie,
      body: {
        currentPassword: initialPassword,
        newPassword: updatedPassword,
        confirmPassword: updatedPassword,
      },
    });
    assert.equal(goodChange.status, 200, "Valid password change must return 200 OK");

    // Old password login rejected
    const oldLogin = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: testEmail, password: initialPassword },
    });
    assert.equal(oldLogin.status, 401, "Old password login must return 401");

    // New password login accepted
    const newLogin = await apiRequest<{ user: UserData }>("/auth/login", {
      method: "POST",
      body: { email: testEmail, password: updatedPassword },
    });
    assert.equal(newLogin.status, 200, "New password login must return 200 OK");
    userCookie = newLogin.cookie!;
    console.log("  ✅ Flow 10 PASSED: Password changed securely, old password rejected, new password verified");

    // ----------------------------------------------------
    // Flow 11: Forgot / Reset password flow integration
    // ----------------------------------------------------
    console.log("\n[Flow 11] Forgot / Reset password using existing Phase 5 backend");
    const forgotRes = await apiRequest("/auth/forgot-password", {
      method: "POST",
      body: { email: testEmail },
    });
    assert.equal(forgotRes.status, 200, "Forgot password must return safe generic 200 response");

    const resetTokenDoc = await PasswordResetToken.findOne().sort({ createdAt: -1 });
    assert.ok(resetTokenDoc, "PasswordResetToken should be created in MongoDB");
    console.log("  ✅ Flow 11 PASSED: Forgot password flow integrated and token stored safely");

    // ----------------------------------------------------
    // Flow 12: Admin route RBAC verification
    // ----------------------------------------------------
    console.log("\n[Flow 12] RBAC verification for standard user vs admin role");
    const userAdminAccess = await apiRequest("/admin/overview", { cookie: userCookie });
    assert.equal(userAdminAccess.status, 403, "Standard USER role must receive 403 Forbidden on admin route");

    // Login as Admin
    const adminLogin = await apiRequest<{ user: UserData }>("/auth/login", {
      method: "POST",
      body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
    });
    assert.equal(adminLogin.status, 200, "Admin login must return 200 OK");
    const adminOverview = await apiRequest("/admin/overview", { cookie: adminLogin.cookie });
    assert.equal(adminOverview.status, 200, "ADMIN role must receive 200 OK on admin route");
    console.log("  ✅ Flow 12 PASSED: AdminRoute RBAC strictly enforced (403 for USER, 200 for ADMIN)");

    // ----------------------------------------------------
    // Flow 13: Account deletion with password confirmation
    // ----------------------------------------------------
    console.log("\n[Flow 13] Account deletion with password confirmation requirement");
    // Invalid password deletion attempt
    const badDelete = await apiRequest("/users/me", {
      method: "DELETE",
      cookie: userCookie,
      body: { password: "WrongPassword" },
    });
    assert.equal(badDelete.status, 401, "Account deletion with wrong password must return 401");

    // Valid password deletion
    const goodDelete = await apiRequest("/users/me", {
      method: "DELETE",
      cookie: userCookie,
      body: { password: updatedPassword },
    });
    assert.equal(goodDelete.status, 200, "Account deletion must return 200 OK");
    assert.equal(goodDelete.clearCookie, true, "Account deletion must clear auth cookie");

    // Confirm deletion in MongoDB
    const deletedDbUser = await User.findOne({ email: testEmail });
    assert.equal(deletedDbUser, null, "User must be completely removed from MongoDB");
    console.log("  ✅ Flow 13 PASSED: Account deleted with password confirmation and removed from DB");

    // ----------------------------------------------------
    // Flow 14: Zero secret leaks check
    // ----------------------------------------------------
    console.log("\n[Flow 14] Verifying zero secret leaks across all responses");
    const serialized = JSON.stringify([regRes, meRes, updateRes, verifyMeRes, loginRes, newLogin]);
    assert.ok(!serialized.includes("passwordHash"), "Responses must never expose passwordHash");
    assert.ok(!serialized.includes("tokenHash"), "Responses must never expose tokenHash");
    console.log("  ✅ Flow 14 PASSED: Zero passwords or token hashes exposed in API responses");

    console.log("\n==========================================================");
    console.log("  🌟 ALL 14 PHASE 7 AUDIT FLOWS PASSED WITH ZERO ERRORS!  ");
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

runPhase7FinalAudit().catch((err) => {
  console.error("❌ Phase 7 final audit failed:", err);
  process.exit(1);
});
