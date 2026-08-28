import assert from "node:assert/strict";
import http from "http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { env } from "../config/env";
import { seedDatabase } from "../seed/seed";
import { User, Transaction, Category, Account } from "../models";

let server: http.Server;
let mongoServer: MongoMemoryServer | null = null;
let baseUrl: string;

async function request(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    cookie?: string;
  } = {}
) {
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {};
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }
  if (options.cookie) {
    headers["Cookie"] = options.cookie;
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawCookie = res.headers.get("set-cookie");
  let cookie: string | undefined;
  if (rawCookie) {
    const match = rawCookie.match(/fintrack_token=([^;]+)/);
    if (match) {
      cookie = `fintrack_token=${match[1]}`;
    }
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON
  }

  return {
    status: res.status,
    data,
    cookie,
    headers: res.headers,
  };
}

async function runPhase17Tests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 17 Admin Platform E2E Suite            ");
  console.log("==========================================================\n");

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log("✓ Isolated MongoMemoryServer connected at:", uri);

  await seedDatabase();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 5000;
      baseUrl = `http://localhost:${port}/api`;
      console.log(`✓ Test HTTP server listening on ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // Test 1: Unauthenticated Guard
    // ----------------------------------------------------
    console.log("[Test 1] Guarding admin endpoints against unauthenticated access");
    const unauthOverview = await request("/admin/overview");
    assert.strictEqual(unauthOverview.status, 401, "Admin overview must require auth");

    const unauthUsers = await request("/admin/users");
    assert.strictEqual(unauthUsers.status, 401, "Admin users must require auth");

    const unauthCategories = await request("/admin/categories");
    assert.strictEqual(unauthCategories.status, 401, "Admin categories must require auth");

    const unauthAudit = await request("/admin/audit-logs");
    assert.strictEqual(unauthAudit.status, 401, "Admin audit logs must require auth");

    const unauthSettings = await request("/admin/settings");
    assert.strictEqual(unauthSettings.status, 401, "Admin settings must require auth");
    console.log("  ✅ Passed: All admin endpoints return 401 for unauthenticated requests");

    // ----------------------------------------------------
    // Setup: Login as Default Admin & Register a Regular User
    // ----------------------------------------------------
    console.log("\n[Setup] Authenticating Administrator and registering regular user...");
    const adminLoginRes = await request("/auth/login", {
      method: "POST",
      body: {
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      },
    });
    assert.strictEqual(adminLoginRes.status, 200, "Admin login must succeed");
    const adminCookie = adminLoginRes.cookie;
    assert.ok(adminCookie, "Admin must receive session cookie");

    const userRegRes = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Standard User Bob",
        email: "bob.user@example.com",
        password: "UserPassword123!",
        confirmPassword: "UserPassword123!",
      },
    });
    assert.strictEqual(userRegRes.status, 201, "User registration must succeed");
    const userCookie = userRegRes.cookie;
    assert.ok(userCookie, "User must receive session cookie");

    const bobUserDoc = await User.findOne({ email: "bob.user@example.com" });
    assert.ok(bobUserDoc, "Bob user doc must exist");
    const bobUserId = bobUserDoc._id.toString();

    // ----------------------------------------------------
    // Test 2: Non-Admin Forbidden Guard (403)
    // ----------------------------------------------------
    console.log("\n[Test 2] Testing non-admin access denial (403 Forbidden)");
    const forbiddenOverview = await request("/admin/overview", { cookie: userCookie });
    assert.strictEqual(forbiddenOverview.status, 403, "Non-admin must receive 403 for overview");

    const forbiddenUsers = await request("/admin/users", { cookie: userCookie });
    assert.strictEqual(forbiddenUsers.status, 403, "Non-admin must receive 403 for users");

    const forbiddenCategories = await request("/admin/categories", { cookie: userCookie });
    assert.strictEqual(forbiddenCategories.status, 403, "Non-admin must receive 403 for categories");

    const forbiddenAudit = await request("/admin/audit-logs", { cookie: userCookie });
    assert.strictEqual(forbiddenAudit.status, 403, "Non-admin must receive 403 for audit logs");

    const forbiddenSettings = await request("/admin/settings", { cookie: userCookie });
    assert.strictEqual(forbiddenSettings.status, 403, "Non-admin must receive 403 for settings");
    console.log("  ✅ Passed: Regular users are strictly denied with 403 Forbidden");

    // ----------------------------------------------------
    // Test 3: Admin Platform Overview
    // ----------------------------------------------------
    console.log("\n[Test 3] Testing GET /api/admin/overview platform telemetry & metrics");
    const overviewRes = await request("/admin/overview", { cookie: adminCookie });
    assert.strictEqual(overviewRes.status, 200, "Admin overview must return 200");

    const overviewData = overviewRes.data.data as {
      metrics: {
        totalUsers: number;
        activeUsers: number;
        adminUsers: number;
        totalCategories: number;
      };
      systemHealth: {
        status: string;
        database: string;
      };
    };

    assert.ok(overviewData.metrics.totalUsers >= 2, "Must count at least 2 users (Admin + Bob)");
    assert.strictEqual(overviewData.metrics.adminUsers, 1, "Must count 1 admin user");
    assert.ok(overviewData.metrics.totalCategories >= 13, "Must count seeded system categories");
    assert.strictEqual(overviewData.systemHealth.status, "OPERATIONAL");
    assert.strictEqual(overviewData.systemHealth.database, "CONNECTED");
    console.log("  ✅ Passed: Platform overview accurately aggregated telemetry and system metrics");

    // ----------------------------------------------------
    // Test 4: User Management (Search, Detail, Status, Role)
    // ----------------------------------------------------
    console.log("\n[Test 4] Testing User Management endpoints and safety guards");
    // 4.1 Search users
    const userSearchRes = await request("/admin/users?search=Bob", { cookie: adminCookie });
    assert.strictEqual(userSearchRes.status, 200);
    const searchData = userSearchRes.data.data as { users: Array<{ id: string; name: string; email: string; passwordHash?: string }> };
    assert.ok(searchData.users.length >= 1, "Search for Bob must find Bob");
    assert.strictEqual(searchData.users[0].email, "bob.user@example.com");

    // CRITICAL SECURITY ASSERTION: Password hash must never be returned
    assert.strictEqual(searchData.users[0].passwordHash, undefined, "User passwordHash must never be exposed");

    // 4.2 Get single user details
    const userDetailRes = await request(`/admin/users/${bobUserId}`, { cookie: adminCookie });
    assert.strictEqual(userDetailRes.status, 200);
    const detailData = userDetailRes.data.data as { user: { id: string; name: string }; entitySummary: { accountsCount: number } };
    assert.strictEqual(detailData.user.name, "Standard User Bob");

    // 4.3 Update user status (Deactivate / Suspend / Reactivate)
    const suspendRes = await request(`/admin/users/${bobUserId}/status`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "SUSPENDED", reason: "Policy audit test suspension" },
    });
    assert.strictEqual(suspendRes.status, 200);
    const updatedBob = await User.findById(bobUserId);
    assert.strictEqual(updatedBob?.status, "SUSPENDED");

    // Reactivate Bob
    const reactivateRes = await request(`/admin/users/${bobUserId}/status`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "ACTIVE", reason: "Reactivation after audit" },
    });
    assert.strictEqual(reactivateRes.status, 200);
    const activeBob = await User.findById(bobUserId);
    assert.strictEqual(activeBob?.status, "ACTIVE");

    // 4.4 Self-deactivation protection guard
    const adminDoc = await User.findOne({ email: "admin@fintrack.local" });
    const adminId = adminDoc!._id.toString();

    const selfDeactivateRes = await request(`/admin/users/${adminId}/status`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "INACTIVE", reason: "Self deactivation attempt" },
    });
    assert.strictEqual(selfDeactivateRes.status, 403, "Admin self-deactivation must be rejected with 403");

    // 4.5 Role Change (Promote to Admin and verify sole-admin guard)
    const promoteRes = await request(`/admin/users/${bobUserId}/role`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { role: "ADMIN", reason: "Promoting Bob to co-administrator" },
    });
    assert.strictEqual(promoteRes.status, 200);
    const adminBob = await User.findById(bobUserId);
    assert.strictEqual(adminBob?.role, "ADMIN");

    // Demote Bob back to USER
    const demoteBobRes = await request(`/admin/users/${bobUserId}/role`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { role: "USER", reason: "Returning Bob to user" },
    });
    assert.strictEqual(demoteBobRes.status, 200);

    // Sole Admin Demotion Guard: Attempting to demote the only remaining admin should fail with 403
    const demoteSoleAdminRes = await request(`/admin/users/${adminId}/role`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { role: "USER", reason: "Demoting sole admin" },
    });
    assert.strictEqual(demoteSoleAdminRes.status, 403, "Demoting sole admin must return 403");
    console.log("  ✅ Passed: User management, search, safe serialization, and safety guards verified");

    // ----------------------------------------------------
    // Test 5: System Category Management & Integrity Protection
    // ----------------------------------------------------
    console.log("\n[Test 5] Testing System Category Management & Historical Record Integrity");
    // 5.1 Create new system category
    const createCatRes = await request("/admin/categories", {
      method: "POST",
      cookie: adminCookie,
      body: {
        name: "Dividends & Capital Gains",
        type: "INCOME",
        icon: "trending-up",
        color: "#10B981",
      },
    });
    assert.strictEqual(createCatRes.status, 201, "Category creation must return 201");
    const newCatData = createCatRes.data.data as { category: { id: string; name: string } };
    const newCatId = newCatData.category.id;

    // 5.2 Update system category
    const updateCatRes = await request(`/admin/categories/${newCatId}`, {
      method: "PATCH",
      cookie: adminCookie,
      body: {
        name: "Dividends & Royalties",
        color: "#059669",
      },
    });
    assert.strictEqual(updateCatRes.status, 200);
    const updatedCat = await Category.findById(newCatId);
    assert.strictEqual(updatedCat?.name, "Dividends & Royalties");

    // 5.3 Safe Hard-Delete of unreferenced category
    const deleteUnusedCatRes = await request(`/admin/categories/${newCatId}`, {
      method: "DELETE",
      cookie: adminCookie,
    });
    assert.strictEqual(deleteUnusedCatRes.status, 200);
    const deleteResult = deleteUnusedCatRes.data.data as { action: string };
    assert.strictEqual(deleteResult.action, "DELETED");
    const deletedCatCheck = await Category.findById(newCatId);
    assert.strictEqual(deletedCatCheck, null, "Unreferenced category should be deleted");

    // 5.4 Soft-Disable on category with transaction dependencies
    // Seed account & transaction using a system category
    const categories = await Category.find({ isSystem: true });
    const salaryCat = categories.find((c) => c.type === "INCOME") || categories[0];

    const testAcc = await Account.create({
      user: bobUserId,
      name: "Bob Checking",
      type: "BANK_ACCOUNT",
      currency: "INR",
      openingBalance: 10000,
      status: "ACTIVE",
    });

    await Transaction.create({
      user: bobUserId,
      account: testAcc._id,
      category: salaryCat._id,
      type: "INCOME",
      amount: 50000,
      date: new Date(),
      description: "Monthly Salary Deposit",
      paymentMethod: "BANK_TRANSFER",
    });

    // Attempt to delete the salary category
    const deleteUsedCatRes = await request(`/admin/categories/${salaryCat._id.toString()}`, {
      method: "DELETE",
      cookie: adminCookie,
    });
    assert.strictEqual(deleteUsedCatRes.status, 200);
    const disableResult = deleteUsedCatRes.data.data as { action: string };
    assert.strictEqual(disableResult.action, "DISABLED", "Referenced category must be soft-disabled");

    const preservedSalaryCat = await Category.findById(salaryCat._id);
    assert.ok(preservedSalaryCat, "Category document must be preserved in database");
    assert.strictEqual(preservedSalaryCat?.isActive, false, "Category must be marked isActive: false");
    console.log("  ✅ Passed: Category management and historical data integrity soft-disable verified");

    // ----------------------------------------------------
    // Test 6: System Settings Management
    // ----------------------------------------------------
    console.log("\n[Test 6] Testing System Settings Management");
    // 6.1 Get Settings
    const getSettingsRes = await request("/admin/settings", { cookie: adminCookie });
    assert.strictEqual(getSettingsRes.status, 200);
    const settingsData = getSettingsRes.data.data as { settings: Record<string, unknown> };
    assert.strictEqual(settingsData.settings.defaultCurrency, "INR");
    assert.strictEqual(settingsData.settings.allowUserRegistration, true);

    // 6.2 Update single setting
    const updateSingleRes = await request("/admin/settings/allowUserRegistration", {
      method: "PATCH",
      cookie: adminCookie,
      body: { value: false, description: "Temporarily freeze registrations" },
    });
    assert.strictEqual(updateSingleRes.status, 200);

    // 6.3 Batch update settings
    const batchUpdateRes = await request("/admin/settings", {
      method: "PUT",
      cookie: adminCookie,
      body: {
        settings: {
          maxAccountsPerUser: 15,
          maintenanceMode: true,
        },
      },
    });
    assert.strictEqual(batchUpdateRes.status, 200);

    // 6.4 Reset settings
    const resetRes = await request("/admin/settings/reset", {
      method: "POST",
      cookie: adminCookie,
    });
    assert.strictEqual(resetRes.status, 200);
    const resetData = resetRes.data.data as { settings: Record<string, unknown> };
    assert.strictEqual(resetData.settings.allowUserRegistration, true);
    assert.strictEqual(resetData.settings.maintenanceMode, false);
    console.log("  ✅ Passed: System settings retrieve, single/batch update, and reset verified");

    // ----------------------------------------------------
    // Test 7: Audit Logs & Credential Protection
    // ----------------------------------------------------
    console.log("\n[Test 7] Testing Audit Logs trail and security credential omission");
    const auditRes = await request("/admin/audit-logs", { cookie: adminCookie });
    assert.strictEqual(auditRes.status, 200);
    const auditData = auditRes.data.data as {
      logs: Array<{ id: string; action: string; targetType: string; actor: { email: string }; metadata?: Record<string, unknown> }>;
      pagination: { total: number };
    };

    assert.ok(auditData.logs.length >= 5, "Must contain recorded audit actions from earlier tests");

    // Verify presence of specific logged actions
    const statusUpdateLog = auditData.logs.find((l) => l.action === "USER_STATUS_UPDATE");
    assert.ok(statusUpdateLog, "Must have recorded USER_STATUS_UPDATE audit log");

    const roleUpdateLog = auditData.logs.find((l) => l.action === "USER_ROLE_UPDATE");
    assert.ok(roleUpdateLog, "Must have recorded USER_ROLE_UPDATE audit log");

    const catCreateLog = auditData.logs.find((l) => l.action === "CATEGORY_CREATE");
    assert.ok(catCreateLog, "Must have recorded CATEGORY_CREATE audit log");

    const catSoftDisableLog = auditData.logs.find((l) => l.action === "CATEGORY_SOFT_DISABLE");
    assert.ok(catSoftDisableLog, "Must have recorded CATEGORY_SOFT_DISABLE audit log");

    // CRITICAL SECURITY ASSERTION: No password, JWT, or token in audit log metadata
    for (const log of auditData.logs) {
      if (log.metadata) {
        const metadataStr = JSON.stringify(log.metadata).toLowerCase();
        assert.ok(!metadataStr.includes("passwordhash"), "Audit metadata must not contain passwordHash");
        assert.ok(!metadataStr.includes("resettoken"), "Audit metadata must not contain resetToken");
      }
    }

    // 7.2 Audit filter options
    const filtersRes = await request("/admin/audit-logs/filters", { cookie: adminCookie });
    assert.strictEqual(filtersRes.status, 200);
    const filterOptions = filtersRes.data.data as { actions: string[]; targetTypes: string[] };
    assert.ok(filterOptions.actions.includes("USER_STATUS_UPDATE"));
    assert.ok(filterOptions.targetTypes.includes("USER"));
    console.log("  ✅ Passed: Audit trail recorded all administrative actions with complete security sanitization");

    console.log("\n==========================================================");
    console.log("  🎉 FinTrack Phase 17 All 7 Backend E2E Tests PASSED!     ");
    console.log("==========================================================\n");
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPhase17Tests().catch((err) => {
  console.error("❌ Phase 17 E2E Test Suite Failed:", err);
  process.exit(1);
});
