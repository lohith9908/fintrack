import assert from "node:assert/strict";
import http from "http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { seedDatabase } from "../seed/seed";
import { User, Notification } from "../models";

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
    // Non-JSON response
  }

  return { status: res.status, data, cookie, res };
}

async function runPhase13Tests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 13 Monthly Budgets & Alerts Test Suite ");
  console.log("==========================================================\n");

  if (mongoose.connection.readyState === 0) {
    console.log("ℹ️ Local MongoDB unreachable. Starting isolated MongoMemoryServer for Phase 13 tests...");
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`✓ Isolated MongoMemoryServer connected at: ${uri}`);
    await seedDatabase();
  }

  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        baseUrl = `http://localhost:${addr.port}/api`;
        console.log(`✓ Test HTTP server listening on ${baseUrl}\n`);
      }
      resolve();
    });
  });

  // ----------------------------------------------------
  // Test 1: Unauthenticated request to /api/budgets
  // ----------------------------------------------------
  console.log("[Test 1] Unauthenticated request to /api/budgets");
  const unauthRes = await request("/budgets");
  assert.equal(unauthRes.status, 401, "Expected 401 Unauthorized");
  console.log("  ✅ Test 1 PASSED: 401 Unauthorized for unauthenticated requests\n");

  // ----------------------------------------------------
  // Setup: Register Test Users & Seed Category/Account
  // ----------------------------------------------------
  console.log("[Setup] Registering test users and populating initial fixtures...");
  const user1Email = `budget_user1_${Date.now()}@example.com`;
  const reg1 = await request("/auth/register", {
    method: "POST",
    body: { name: "Budget User One", email: user1Email, password: "Password@123" },
  });
  assert.equal(reg1.status, 201);
  const user1Cookie = reg1.cookie;

  const user2Email = `budget_user2_${Date.now()}@example.com`;
  const reg2 = await request("/auth/register", {
    method: "POST",
    body: { name: "Budget User Two", email: user2Email, password: "Password@123" },
  });
  assert.equal(reg2.status, 201);
  const user2Cookie = reg2.cookie;

  // Create User 1 Account
  const accRes = await request("/accounts", {
    method: "POST",
    cookie: user1Cookie,
    body: { name: "HDFC Primary", type: "BANK_ACCOUNT", initialBalance: 100000 },
  });
  assert.equal(accRes.status, 201);
  const accountId = (accRes.data.data as { account: { _id: string } }).account._id;

  // Get Expense & Income Categories
  const catRes = await request("/categories", { cookie: user1Cookie });
  assert.equal(catRes.status, 200);
  const categories = (catRes.data.data as { categories: Array<{ _id: string; name: string; type: string }> }).categories;
  const foodCategory = categories.find((c) => c.type === "EXPENSE" && c.name.toLowerCase().includes("food")) || categories.find((c) => c.type === "EXPENSE")!;
  const salaryCategory = categories.find((c) => c.type === "INCOME")!;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  console.log(`  ✓ Setup completed (Target Month: ${currentMonth}/${currentYear})\n`);

  // ----------------------------------------------------
  // Test 2: Reject budget creation for Income category
  // ----------------------------------------------------
  console.log("[Test 2] Reject budget creation for Income category");
  const incomeBudgetRes = await request("/budgets", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      category: salaryCategory._id,
      month: currentMonth,
      year: currentYear,
      limitAmount: 50000,
    },
  });
  assert.equal(incomeBudgetRes.status, 400, "Should reject income category for budget");
  console.log("  ✅ Test 2 PASSED: 400 Bad Request when attempting to budget an Income category\n");

  // ----------------------------------------------------
  // Test 3: Create valid Expense Budget
  // ----------------------------------------------------
  console.log("[Test 3] Create valid Expense category budget");
  const createBudgetRes = await request("/budgets", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      category: foodCategory._id,
      month: currentMonth,
      year: currentYear,
      limitAmount: 10000,
      alertThresholds: {
        informational: 50,
        warning: 75,
        critical: 90,
        exceeded: 100,
      },
      notes: "Monthly dining and groceries allowance",
    },
  });
  assert.equal(createBudgetRes.status, 201, "Expected 201 Created");
  const createdBudget = createBudgetRes.data.data as {
    _id: string;
    limitAmount: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: string;
  };
  assert.equal(createdBudget.limitAmount, 10000);
  assert.equal(createdBudget.spent, 0);
  assert.equal(createdBudget.remaining, 10000);
  assert.equal(createdBudget.status, "HEALTHY");
  const budgetId = createdBudget._id;
  console.log("  ✅ Test 3 PASSED: Expense budget created with initial HEALTHY status\n");

  // ----------------------------------------------------
  // Test 4: Prevent duplicate category/month budget collision
  // ----------------------------------------------------
  console.log("[Test 4] Prevent duplicate category/month budget collision (409 Conflict)");
  const duplicateRes = await request("/budgets", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      category: foodCategory._id,
      month: currentMonth,
      year: currentYear,
      limitAmount: 12000,
    },
  });
  assert.equal(duplicateRes.status, 409, "Expected 409 Conflict for duplicate budget");
  console.log("  ✅ Test 4 PASSED: Duplicate budget for same category/month rejected with 409 Conflict\n");

  // ----------------------------------------------------
  // Test 5: Real-time spend aggregation and status progression
  // ----------------------------------------------------
  console.log("[Test 5] Dynamic spend calculations and threshold status progression");

  // Add 1st expense: ₹5,000 (50% -> HEALTHY)
  await request("/transactions", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      amount: 5000,
      type: "EXPENSE",
      category: foodCategory._id,
      account: accountId,
      description: "Supermarket Groceries",
      paymentMethod: "DEBIT_CARD",
      date: new Date().toISOString(),
    },
  });

  const check1 = await request(`/budgets/${budgetId}`, { cookie: user1Cookie });
  const b1 = check1.data.data as { spent: number; remaining: number; percentage: number; status: string };
  assert.equal(b1.spent, 5000);
  assert.equal(b1.remaining, 5000);
  assert.equal(b1.percentage, 50);
  assert.equal(b1.status, "HEALTHY");

  // Add 2nd expense: ₹3,000 (Total ₹8,000 -> 80% -> WARNING)
  await request("/transactions", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      amount: 3000,
      type: "EXPENSE",
      category: foodCategory._id,
      account: accountId,
      description: "Weekend Restaurant Dinner",
      paymentMethod: "UPI",
      date: new Date().toISOString(),
    },
  });

  const check2 = await request(`/budgets/${budgetId}`, { cookie: user1Cookie });
  const b2 = check2.data.data as { spent: number; remaining: number; percentage: number; status: string };
  assert.equal(b2.spent, 8000);
  assert.equal(b2.remaining, 2000);
  assert.equal(b2.percentage, 80);
  assert.equal(b2.status, "WARNING");

  // Add 3rd expense: ₹1,500 (Total ₹9,500 -> 95% -> CRITICAL)
  await request("/transactions", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      amount: 1500,
      type: "EXPENSE",
      category: foodCategory._id,
      account: accountId,
      description: "Coffee & Snacks",
      paymentMethod: "CASH",
      date: new Date().toISOString(),
    },
  });

  const check3 = await request(`/budgets/${budgetId}`, { cookie: user1Cookie });
  const b3 = check3.data.data as { spent: number; remaining: number; percentage: number; status: string };
  assert.equal(b3.spent, 9500);
  assert.equal(b3.remaining, 500);
  assert.equal(b3.percentage, 95);
  assert.equal(b3.status, "CRITICAL");

  // Add 4th expense: ₹1,000 (Total ₹10,500 -> 105% -> EXCEEDED)
  await request("/transactions", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      amount: 1000,
      type: "EXPENSE",
      category: foodCategory._id,
      account: accountId,
      description: "Food Delivery",
      paymentMethod: "UPI",
      date: new Date().toISOString(),
    },
  });

  const check4 = await request(`/budgets/${budgetId}`, { cookie: user1Cookie });
  const b4 = check4.data.data as { spent: number; remaining: number; percentage: number; status: string };
  assert.equal(b4.spent, 10500);
  assert.equal(b4.remaining, 0);
  assert.equal(b4.percentage, 105);
  assert.equal(b4.status, "EXCEEDED");
  console.log("  ✅ Test 5 PASSED: Status correctly transitioned HEALTHY -> WARNING -> CRITICAL -> EXCEEDED\n");

  // ----------------------------------------------------
  // Test 6: List budgets with summary aggregation
  // ----------------------------------------------------
  console.log("[Test 6] List budgets with summary statistics aggregation");
  const listRes = await request(`/budgets?month=${currentMonth}&year=${currentYear}`, {
    cookie: user1Cookie,
  });
  assert.equal(listRes.status, 200);
  const listData = listRes.data.data as {
    budgets: Array<{ _id: string }>;
    summary: {
      totalBudgeted: number;
      totalSpent: number;
      totalRemaining: number;
      overallPercentage: number;
      budgetCount: number;
      exceededCount: number;
    };
  };
  assert.equal(listData.budgets.length, 1);
  assert.equal(listData.summary.totalBudgeted, 10000);
  assert.equal(listData.summary.totalSpent, 10500);
  assert.equal(listData.summary.exceededCount, 1);
  console.log("  ✅ Test 6 PASSED: Summary statistics aggregated accurately\n");

  // ----------------------------------------------------
  // Test 7: Automated Notification Triggers Verification
  // ----------------------------------------------------
  console.log("[Test 7] Verify automated notification alerts in MongoDB");
  const user1Doc = await User.findOne({ email: user1Email });
  assert.ok(user1Doc);
  const notifs = await Notification.find({ user: user1Doc._id });
  assert.ok(notifs.length >= 1, "Expected budget notifications to be created");
  const exceededNotif = notifs.find((n) => n.type === "BUDGET_EXCEEDED");
  assert.ok(exceededNotif, "Must have created BUDGET_EXCEEDED notification");
  assert.equal(exceededNotif?.severity, "CRITICAL");
  console.log(`  ✅ Test 7 PASSED: Automated notifications triggered (${notifs.length} alert records logged)\n`);

  // ----------------------------------------------------
  // Test 8: Single budget update
  // ----------------------------------------------------
  console.log("[Test 8] Single budget limit and notes update");
  const updateRes = await request(`/budgets/${budgetId}`, {
    method: "PATCH",
    cookie: user1Cookie,
    body: {
      limitAmount: 15000,
      notes: "Increased budget limit",
    },
  });
  assert.equal(updateRes.status, 200);
  const updatedB = updateRes.data.data as { limitAmount: number; remaining: number; percentage: number; status: string };
  assert.equal(updatedB.limitAmount, 15000);
  assert.equal(updatedB.remaining, 4500);
  assert.equal(updatedB.percentage, 70);
  assert.equal(updatedB.status, "HEALTHY");
  console.log("  ✅ Test 8 PASSED: Budget limit increased to ₹15,000, resetting status back to HEALTHY\n");

  // ----------------------------------------------------
  // Test 9: Cross-User Ownership Isolation
  // ----------------------------------------------------
  console.log("[Test 9] Cross-user ownership isolation on Budgets");
  const crossGet = await request(`/budgets/${budgetId}`, { cookie: user2Cookie });
  assert.equal(crossGet.status, 404, "User 2 cannot read User 1 budget");

  const crossPatch = await request(`/budgets/${budgetId}`, {
    method: "PATCH",
    cookie: user2Cookie,
    body: { limitAmount: 99999 },
  });
  assert.equal(crossPatch.status, 404, "User 2 cannot update User 1 budget");

  const crossDelete = await request(`/budgets/${budgetId}`, {
    method: "DELETE",
    cookie: user2Cookie,
  });
  assert.equal(crossDelete.status, 404, "User 2 cannot delete User 1 budget");
  console.log("  ✅ Test 9 PASSED: Tenant ownership strictly isolated (404 Not Found across users)\n");

  // ----------------------------------------------------
  // Test 10: Delete budget
  // ----------------------------------------------------
  console.log("[Test 10] Delete budget and verify removal");
  const deleteRes = await request(`/budgets/${budgetId}`, {
    method: "DELETE",
    cookie: user1Cookie,
  });
  assert.equal(deleteRes.status, 200);

  const getDeleted = await request(`/budgets/${budgetId}`, { cookie: user1Cookie });
  assert.equal(getDeleted.status, 404);
  console.log("  ✅ Test 10 PASSED: Budget deleted successfully and inaccessible\n");

  console.log("==========================================================");
  console.log("  🌟 ALL 10 PHASE 13 E2E TEST SCENARIOS PASSED WITH ZERO ERRORS!");
  console.log("==========================================================\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
  if (mongoServer) {
    await mongoServer.stop();
    console.log("✓ Stopped isolated MongoMemoryServer");
  }
  server.close();
}

runPhase13Tests().catch((err) => {
  console.error("❌ Phase 13 tests failed:", err);
  process.exit(1);
});
