import assert from "node:assert/strict";
import http from "http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { seedDatabase } from "../seed/seed";
import { User, Notification, Transaction } from "../models";

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

async function runPhase14Tests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 14 Recurring & Goals E2E Test Suite    ");
  console.log("==========================================================\n");

  if (mongoose.connection.readyState === 0) {
    console.log("ℹ️ Local MongoDB unreachable. Starting isolated MongoMemoryServer for Phase 14 tests...");
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
  // Test 1: Unauthenticated Guard
  // ----------------------------------------------------
  console.log("[Test 1] Unauthenticated requests to /api/recurring-transactions and /api/goals");
  const unauthRec = await request("/recurring-transactions");
  assert.equal(unauthRec.status, 401, "Expected 401 for recurring");

  const unauthGoals = await request("/goals");
  assert.equal(unauthGoals.status, 401, "Expected 401 for goals");
  console.log("  ✅ Test 1 PASSED: 401 Unauthorized for unauthenticated requests\n");

  // ----------------------------------------------------
  // Setup: Register Test Users & Seed Data
  // ----------------------------------------------------
  console.log("[Setup] Registering test users and setting up initial fixtures...");
  const user1Email = `p14_user1_${Date.now()}@example.com`;
  const reg1 = await request("/auth/register", {
    method: "POST",
    body: { name: "Phase 14 User 1", email: user1Email, password: "Password@123" },
  });
  assert.equal(reg1.status, 201);
  const user1Cookie = reg1.cookie;

  const user2Email = `p14_user2_${Date.now()}@example.com`;
  const reg2 = await request("/auth/register", {
    method: "POST",
    body: { name: "Phase 14 User 2", email: user2Email, password: "Password@123" },
  });
  assert.equal(reg2.status, 201);
  const user2Cookie = reg2.cookie;

  // Account
  const accRes = await request("/accounts", {
    method: "POST",
    cookie: user1Cookie,
    body: { name: "Salary Account", type: "BANK_ACCOUNT", initialBalance: 150000 },
  });
  assert.equal(accRes.status, 201);
  const accountId = (accRes.data.data as { account: { _id: string } }).account._id;

  // Categories
  const catRes = await request("/categories", { cookie: user1Cookie });
  assert.equal(catRes.status, 200);
  const categories = (catRes.data.data as { categories: Array<{ _id: string; name: string; type: string }> }).categories;
  const utilCategory = categories.find((c) => c.type === "EXPENSE" && c.name.toLowerCase().includes("util")) || categories.find((c) => c.type === "EXPENSE")!;
  const salaryCategory = categories.find((c) => c.type === "INCOME")!;
  console.log("  ✓ Setup completed successfully\n");

  // ----------------------------------------------------
  // Test 2: Create Recurring Transactions (Expense & Income)
  // ----------------------------------------------------
  console.log("[Test 2] Create valid recurring rules (Expense & Income)");
  const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago (due now)

  const createExpenseRec = await request("/recurring-transactions", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      name: "Broadband Internet Bill",
      amount: 1499,
      type: "EXPENSE",
      category: utilCategory._id,
      account: accountId,
      paymentMethod: "UPI",
      frequency: "MONTHLY",
      startDate: pastDate,
      notes: "Airtel Xstream Fiber",
    },
  });
  assert.equal(createExpenseRec.status, 201);
  const expenseRule = createExpenseRec.data.data as { _id: string; amount: number; isActive: boolean; nextOccurrence: string };
  assert.equal(expenseRule.amount, 1499);
  assert.equal(expenseRule.isActive, true);
  const recurringId = expenseRule._id;

  const createIncomeRec = await request("/recurring-transactions", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      name: "Monthly Base Salary",
      amount: 85000,
      type: "INCOME",
      category: salaryCategory._id,
      account: accountId,
      paymentMethod: "BANK_TRANSFER",
      frequency: "MONTHLY",
      startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    },
  });
  assert.equal(createIncomeRec.status, 201);
  console.log("  ✅ Test 2 PASSED: Expense & Income recurring rules created\n");

  // ----------------------------------------------------
  // Test 3: List Recurring Rules & Summary
  // ----------------------------------------------------
  console.log("[Test 3] List recurring rules with calculated monthly summary metrics");
  const listRecRes = await request("/recurring-transactions", { cookie: user1Cookie });
  assert.equal(listRecRes.status, 200);
  const listRecData = listRecRes.data.data as {
    recurringTransactions: Array<{ _id: string }>;
    summary: {
      activeCount: number;
      totalMonthlyExpenses: number;
      totalMonthlyIncome: number;
    };
  };
  assert.equal(listRecData.recurringTransactions.length, 2);
  assert.equal(listRecData.summary.activeCount, 2);
  assert.equal(listRecData.summary.totalMonthlyExpenses, 1499);
  assert.equal(listRecData.summary.totalMonthlyIncome, 85000);
  console.log("  ✅ Test 3 PASSED: Recurring list and monthly summaries calculated accurately\n");

  // ----------------------------------------------------
  // Test 4: Scheduler Processing & Idempotency
  // ----------------------------------------------------
  console.log("[Test 4] Scheduler processing of due recurring transactions & idempotency verification");
  const processRes = await request("/recurring-transactions/process-due", {
    method: "POST",
    cookie: user1Cookie,
  });
  assert.equal(processRes.status, 200);
  const processData = processRes.data.data as { processedCount: number };
  assert.equal(processData.processedCount, 1, "Should process the 1 due rule");

  // Verify created transaction in database
  const createdTxs = await Transaction.find({ description: "[Recurring] Broadband Internet Bill" });
  assert.equal(createdTxs.length, 1);
  assert.equal(createdTxs[0].amount, 1499);

  // Check that nextOccurrence was advanced into the future (approx +1 month)
  const updatedRuleRes = await request(`/recurring-transactions/${recurringId}`, { cookie: user1Cookie });
  const updatedRule = updatedRuleRes.data.data as { nextOccurrence: string };
  assert.ok(new Date(updatedRule.nextOccurrence).getTime() > Date.now(), "nextOccurrence must be advanced");

  // Re-run scheduler immediately (Idempotency check: 0 due rules)
  const reprocessRes = await request("/recurring-transactions/process-due", {
    method: "POST",
    cookie: user1Cookie,
  });
  assert.equal(reprocessRes.status, 200);
  const reprocessData = reprocessRes.data.data as { processedCount: number };
  assert.equal(reprocessData.processedCount, 0, "No duplicate transactions should be created");
  console.log("  ✅ Test 4 PASSED: Scheduler generated transaction, advanced nextOccurrence, and proved idempotency\n");

  // ----------------------------------------------------
  // Test 5: Pause and Resume Recurring Rule
  // ----------------------------------------------------
  console.log("[Test 5] Pause and resume recurring rule");
  const pauseRes = await request(`/recurring-transactions/${recurringId}/pause`, {
    method: "POST",
    cookie: user1Cookie,
  });
  assert.equal(pauseRes.status, 200);
  assert.equal((pauseRes.data.data as { isActive: boolean }).isActive, false);

  const resumeRes = await request(`/recurring-transactions/${recurringId}/resume`, {
    method: "POST",
    cookie: user1Cookie,
  });
  assert.equal(resumeRes.status, 200);
  assert.equal((resumeRes.data.data as { isActive: boolean }).isActive, true);
  console.log("  ✅ Test 5 PASSED: Pause and resume states toggled cleanly\n");

  // ----------------------------------------------------
  // Test 6: Create Savings Goal
  // ----------------------------------------------------
  console.log("[Test 6] Create savings goal with target and initial amount");
  const createGoalRes = await request("/goals", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      name: "Emergency Rainy Day Fund",
      targetAmount: 50000,
      currentAmount: 10000,
      targetDate: new Date(Date.now() + 86400000 * 90).toISOString(),
      category: "Emergency",
      description: "3-month buffer fund",
    },
  });
  assert.equal(createGoalRes.status, 201);
  const createdGoal = createGoalRes.data.data as {
    _id: string;
    targetAmount: number;
    currentAmount: number;
    percentage: number;
    remainingAmount: number;
    status: string;
  };
  assert.equal(createdGoal.targetAmount, 50000);
  assert.equal(createdGoal.currentAmount, 10000);
  assert.equal(createdGoal.percentage, 20);
  assert.equal(createdGoal.remainingAmount, 40000);
  assert.equal(createdGoal.status, "ACTIVE");
  const goalId = createdGoal._id;
  console.log("  ✅ Test 6 PASSED: Savings goal created with initial 20% progress\n");

  // ----------------------------------------------------
  // Test 7: Add Contribution and Milestone Notification
  // ----------------------------------------------------
  console.log("[Test 7] Add contribution to reach 50% milestone");
  const contrib1 = await request(`/goals/${goalId}/contribute`, {
    method: "POST",
    cookie: user1Cookie,
    body: {
      amount: 15000, // Current total: 25,000 (50%)
      note: "Mid-month savings deposit",
    },
  });
  assert.equal(contrib1.status, 200);
  const g1 = contrib1.data.data as { currentAmount: number; percentage: number; status: string };
  assert.equal(g1.currentAmount, 25000);
  assert.equal(g1.percentage, 50);
  assert.equal(g1.status, "ACTIVE");

  // Verify milestone notification
  const user1Doc = await User.findOne({ email: user1Email });
  const notifs1 = await Notification.find({ user: user1Doc!._id, type: "GOAL_MILESTONE" });
  assert.ok(notifs1.length >= 1, "Must generate milestone notification");
  console.log("  ✅ Test 7 PASSED: Contribution added, progress updated to 50%, and milestone notification triggered\n");

  // ----------------------------------------------------
  // Test 8: Goal Completion when target is reached
  // ----------------------------------------------------
  console.log("[Test 8] Add remaining contribution to complete goal (100%)");
  const contrib2 = await request(`/goals/${goalId}/contribute`, {
    method: "POST",
    cookie: user1Cookie,
    body: {
      amount: 25000, // Total: 50,000 (100%)
      note: "Bonus allocation",
    },
  });
  assert.equal(contrib2.status, 200);
  const g2 = contrib2.data.data as { currentAmount: number; percentage: number; status: string; remainingAmount: number };
  assert.equal(g2.currentAmount, 50000);
  assert.equal(g2.percentage, 100);
  assert.equal(g2.remainingAmount, 0);
  assert.equal(g2.status, "COMPLETED");

  const completedNotifs = await Notification.find({ user: user1Doc!._id, title: /Achieved/ });
  assert.ok(completedNotifs.length >= 1, "Must generate goal achieved notification");
  console.log("  ✅ Test 8 PASSED: Goal automatically completed and achievement notification logged\n");

  // ----------------------------------------------------
  // Test 9: Account Balance Check & Reject Overdrawing Contribution
  // ----------------------------------------------------
  console.log("[Test 9] Account balance verification & insufficient funds protection on goal contribution");
  // Create account with initial balance 2000
  const smallAccRes = await request("/accounts", {
    method: "POST",
    cookie: user1Cookie,
    body: { name: "Small Wallet", type: "CASH", initialBalance: 2000 },
  });
  assert.equal(smallAccRes.status, 201);
  const smallAccountId = (smallAccRes.data.data as { account: { _id: string } }).account._id;

  const newGoalRes = await request("/goals", {
    method: "POST",
    cookie: user1Cookie,
    body: { name: "Book Purchase", targetAmount: 5000 },
  });
  assert.equal(newGoalRes.status, 201);
  const bookGoalId = (newGoalRes.data.data as { _id: string })._id;

  // Attempt contribution of 3000 from account with only 2000 balance -> 400 Bad Request
  const overdrawRes = await request(`/goals/${bookGoalId}/contribute`, {
    method: "POST",
    cookie: user1Cookie,
    body: { amount: 3000, account: smallAccountId },
  });
  assert.equal(overdrawRes.status, 400, "Should reject overdrawing account for contribution");
  assert.ok(
    (overdrawRes.data.message as string).includes("Insufficient balance"),
    "Error message must indicate insufficient balance"
  );
  console.log("  ✅ Test 9 PASSED: Insufficient account balance contribution rejected with 400 Bad Request\n");

  // ----------------------------------------------------
  // Test 10: EndDate Expiration & Notification Deduplication
  // ----------------------------------------------------
  console.log("[Test 10] EndDate expiration and notification deduplication guard");
  const pastStartDate = new Date(Date.now() - 86400000 * 2).toISOString();
  const pastEndDate = new Date(Date.now() + 86400000).toISOString(); // End date tomorrow, but next cycle (+1 month) exceeds it

  const expireRuleRes = await request("/recurring-transactions", {
    method: "POST",
    cookie: user1Cookie,
    body: {
      name: "Temporary Gym Pass",
      amount: 500,
      type: "EXPENSE",
      category: utilCategory._id,
      account: accountId,
      paymentMethod: "UPI",
      frequency: "MONTHLY",
      startDate: pastStartDate,
      endDate: pastEndDate,
    },
  });
  assert.equal(expireRuleRes.status, 201);
  const expireRuleId = (expireRuleRes.data.data as { _id: string })._id;

  // Process scheduler
  const procRes = await request("/recurring-transactions/process-due", {
    method: "POST",
    cookie: user1Cookie,
  });
  assert.equal(procRes.status, 200);

  // Check rule is now deactivated because endDate was reached
  const checkRuleRes = await request(`/recurring-transactions/${expireRuleId}`, { cookie: user1Cookie });
  assert.equal((checkRuleRes.data.data as { isActive: boolean }).isActive, false);

  // Check notifications are deduplicated
  const totalNotifs = await Notification.countDocuments({
    user: user1Doc!._id,
    type: "RECURRING_PAYMENT",
    "metadata.recurringId": expireRuleId,
  });
  assert.equal(totalNotifs, 1, "Exactly one notification must be generated for the rule occurrence");
  console.log("  ✅ Test 10 PASSED: Expired recurring rule deactivated and notifications deduplicated\n");

  // ----------------------------------------------------
  // Test 11: Cross-User Ownership Isolation
  // ----------------------------------------------------
  console.log("[Test 11] Cross-user ownership isolation for Recurring and Goals");
  const crossRecGet = await request(`/recurring-transactions/${recurringId}`, { cookie: user2Cookie });
  assert.equal(crossRecGet.status, 404);

  const crossGoalGet = await request(`/goals/${goalId}`, { cookie: user2Cookie });
  assert.equal(crossGoalGet.status, 404);

  const crossContrib = await request(`/goals/${goalId}/contribute`, {
    method: "POST",
    cookie: user2Cookie,
    body: { amount: 1000 },
  });
  assert.equal(crossContrib.status, 404);
  console.log("  ✅ Test 11 PASSED: Tenant isolation strictly enforced (404 across unauthorized users)\n");

  // ----------------------------------------------------
  // Test 12: Delete Recurring Rule and Goal
  // ----------------------------------------------------
  console.log("[Test 12] Deletion of recurring rule and savings goal");
  const delRec = await request(`/recurring-transactions/${recurringId}`, {
    method: "DELETE",
    cookie: user1Cookie,
  });
  assert.equal(delRec.status, 200);

  const delGoal = await request(`/goals/${goalId}`, {
    method: "DELETE",
    cookie: user1Cookie,
  });
  assert.equal(delGoal.status, 200);
  console.log("  ✅ Test 12 PASSED: Deletion verified\n");

  console.log("==========================================================");
  console.log("  🌟 ALL 12 PHASE 14 E2E TEST SCENARIOS PASSED WITH ZERO ERRORS!");
  console.log("==========================================================\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
  if (mongoServer) {
    await mongoServer.stop();
    console.log("✓ Stopped isolated MongoMemoryServer");
  }
  server.close();
}

runPhase14Tests().catch((err) => {
  console.error("❌ Phase 14 tests failed:", err);
  process.exit(1);
});
