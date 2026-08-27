import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { env } from "../config/env";
import { seedDatabase } from "../seed/seed";
import { Budget, SavingsGoal } from "../models";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

interface DashboardOverview {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    remainingBalance: number;
    savingsRate: number;
    totalNetWorth: number;
    activeAccountsCount: number;
    totalTransactionsCount: number;
  };
  categoryBreakdown: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    label: string;
    income: number;
    expense: number;
    savings: number;
    savingsRate: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  accounts: Array<{
    name: string;
    currentBalance: number;
    periodExpense: number;
  }>;
  recentTransactions: Array<{
    _id: string;
    amount: number;
    description: string;
  }>;
  budgetStatus: Array<{
    categoryName: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
  }>;
  goalsProgress: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    percentage: number;
  }>;
  insights: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
  }>;
}

async function runPhase11E2ETests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 11 Dashboard & Calculations Test Suite ");
  console.log("==========================================================\n");

  let mongoServer: MongoMemoryServer | null = null;
  let server: http.Server | null = null;
  let baseUrl = "";

  try {
    // 1. Connect MongoDB
    try {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      console.log(`✓ Connected to configured MongoDB: ${env.MONGODB_URI}`);
    } catch {
      console.log("ℹ️ Local MongoDB unreachable. Starting isolated MongoMemoryServer for Phase 11 tests...");
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✓ Isolated MongoMemoryServer connected at: ${memoryUri}`);
    }

    // 2. Seed System Categories
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
      const cookieResult = setCookie ? setCookie.split(";")[0] : undefined;
      let body: ApiResponse<T>;
      try {
        body = (await res.json()) as ApiResponse<T>;
      } catch {
        body = { success: false, message: "" };
      }
      return { status: res.status, body, cookie: cookieResult };
    };

    // ----------------------------------------------------
    // Test 1: Unauthenticated Guard
    // ----------------------------------------------------
    console.log("[Test 1] Unauthenticated request to /api/dashboard/overview");
    const unauthRes = await apiRequest("/dashboard/overview");
    assert.equal(unauthRes.status, 401, "Unauthenticated dashboard request must return 401");
    console.log("  ✅ Test 1 PASSED: 401 Unauthorized for unauthenticated requests\n");

    // ----------------------------------------------------
    // Setup: Create Users, Accounts, Budgets, Goals, Transactions
    // ----------------------------------------------------
    console.log("[Setup] Registering test users and populating financial fixtures...");
    const u1Reg = await apiRequest<{ user: { _id: string } }>("/auth/register", {
      method: "POST",
      body: { name: "Dashboard User 1", email: `dash_user1_${Date.now()}@example.com`, password: "Password123!", confirmPassword: "Password123!" },
    });
    assert.ok(u1Reg.cookie);
    const user1Cookie = u1Reg.cookie;
    const user1Id = u1Reg.body.data?.user._id;

    const u2Reg = await apiRequest<{ user: { _id: string } }>("/auth/register", {
      method: "POST",
      body: { name: "Dashboard User 2", email: `dash_user2_${Date.now()}@example.com`, password: "Password123!", confirmPassword: "Password123!" },
    });
    assert.ok(u2Reg.cookie);
    const user2Cookie = u2Reg.cookie;

    // Create User 1 Accounts: Bank (50,000), Cash (10,000)
    const bankRes = await apiRequest<{ account: { _id: string } }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: { name: "HDFC Primary", type: "BANK_ACCOUNT", openingBalance: 50000 },
    });
    assert.ok(bankRes.body.data?.account);
    const bankId = bankRes.body.data.account._id;

    const cashRes = await apiRequest<{ account: { _id: string } }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: { name: "Pocket Cash", type: "CASH", openingBalance: 10000 },
    });
    assert.ok(cashRes.body.data?.account);
    const cashId = cashRes.body.data.account._id;

    // Fetch Categories
    const catList = await apiRequest<{ categories: Array<{ _id: string; name: string }> }>("/categories", { cookie: user1Cookie });
    assert.ok(catList.body.data?.categories);
    const salaryCat = catList.body.data.categories.find((c) => c.name === "Salary")!;
    const foodCat = catList.body.data.categories.find((c) => c.name === "Food")!;
    const shoppingCat = catList.body.data.categories.find((c) => c.name === "Shopping")!;

    // Create Transactions for User 1:
    // Income: 80,000
    // Expenses: Food (12,000), Shopping (18,000) -> Total Expenses = 30,000
    await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: { amount: 80000, type: "INCOME", category: salaryCat._id, description: "Monthly Salary", date: new Date().toISOString(), paymentMethod: "BANK_TRANSFER", account: bankId },
    });

    await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: { amount: 12000, type: "EXPENSE", category: foodCat._id, description: "Groceries & Dining", date: new Date().toISOString(), paymentMethod: "UPI", account: bankId },
    });

    await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: { amount: 18000, type: "EXPENSE", category: shoppingCat._id, description: "Electronics Purchase", date: new Date().toISOString(), paymentMethod: "CASH", account: cashId },
    });

    // Create a Budget for current month: Food Category 15,000 (spent 12,000 -> 80% utilization)
    const now = new Date();
    await Budget.create({
      user: user1Id,
      category: foodCat._id,
      limitAmount: 15000,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });

    // Create a Savings Goal: "Emergency Fund" Target 100,000, Current 40,000 (40%)
    await SavingsGoal.create({
      user: user1Id,
      name: "Emergency Fund",
      targetAmount: 100000,
      currentAmount: 40000,
      status: "ACTIVE",
    });
    console.log("  ✓ Test data, budget, goal, and transactions created.\n");

    // ----------------------------------------------------
    // Test 2: Core Financial Metrics & Savings Rate
    // ----------------------------------------------------
    console.log("[Test 2] Consolidated Dashboard Overview & Metrics Calculation");
    const overviewRes = await apiRequest<DashboardOverview>("/dashboard/overview", {
      cookie: user1Cookie,
    });
    assert.equal(overviewRes.status, 200);
    assert.ok(overviewRes.body.data?.summary);

    const summary = overviewRes.body.data.summary;
    // Total Income: 80,000
    // Total Expenses: 12,000 + 18,000 = 30,000
    // Remaining Balance: 80,000 - 30,000 = 50,000
    // Savings Rate: (50,000 / 80,000) * 100 = 62.5%
    // Net Worth: Bank (50k + 80k - 12k = 118k) + Cash (10k - 18k = -8k) = 110k
    assert.equal(summary.totalIncome, 80000, "Income must be 80,000");
    assert.equal(summary.totalExpenses, 30000, "Expenses must be 30,000");
    assert.equal(summary.remainingBalance, 50000, "Remaining balance must be 50,000");
    assert.equal(summary.savingsRate, 62.5, "Savings rate must be 62.5%");
    assert.equal(summary.totalNetWorth, 110000, "Net worth must equal 110,000");
    assert.equal(summary.activeAccountsCount, 2);
    assert.equal(summary.totalTransactionsCount, 3);
    console.log("  ✅ Test 2 PASSED: Financial summary and savings rate calculated accurately\n");

    // ----------------------------------------------------
    // Test 3: Category Breakdown & Proportions
    // ----------------------------------------------------
    console.log("[Test 3] Category Breakdown & Percentage Calculations");
    const categoryBreakdown = overviewRes.body.data.categoryBreakdown;
    assert.ok(categoryBreakdown);
    assert.equal(categoryBreakdown.length, 2, "Should have 2 expense categories");

    const shoppingBreakdown = categoryBreakdown.find((c) => c.name === "Shopping");
    const foodBreakdown = categoryBreakdown.find((c) => c.name === "Food");

    assert.ok(shoppingBreakdown && foodBreakdown);
    // Shopping: 18,000 / 30,000 = 60%
    // Food: 12,000 / 30,000 = 40%
    assert.equal(shoppingBreakdown.amount, 18000);
    assert.equal(shoppingBreakdown.percentage, 60);
    assert.equal(foodBreakdown.amount, 12000);
    assert.equal(foodBreakdown.percentage, 40);
    console.log("  ✅ Test 3 PASSED: Category expense breakdown and percentage proportions verified\n");

    // ----------------------------------------------------
    // Test 4: Monthly Historical Trends
    // ----------------------------------------------------
    console.log("[Test 4] Monthly Historical Trends Aggregation (6 Continuous Months)");
    const monthlyTrends = overviewRes.body.data.monthlyTrends;
    assert.ok(monthlyTrends);
    assert.equal(monthlyTrends.length, 6, "Must contain exactly 6 continuous historical months");

    const currentMonthTrend = monthlyTrends[monthlyTrends.length - 1];
    assert.equal(currentMonthTrend.income, 80000);
    assert.equal(currentMonthTrend.expense, 30000);
    assert.equal(currentMonthTrend.savings, 50000);
    assert.equal(currentMonthTrend.savingsRate, 62.5);
    console.log("  ✅ Test 4 PASSED: Monthly trends and continuous series verified\n");

    // ----------------------------------------------------
    // Test 5: Payment Methods Aggregation
    // ----------------------------------------------------
    console.log("[Test 5] Payment Methods Distribution Aggregation");
    const paymentMethods = overviewRes.body.data.paymentMethods;
    assert.ok(paymentMethods);
    assert.ok(paymentMethods.length >= 2);
    const bankTransferPM = paymentMethods.find((p) => p.method === "BANK_TRANSFER");
    const cashPM = paymentMethods.find((p) => p.method === "CASH");
    const upiPM = paymentMethods.find((p) => p.method === "UPI");
    assert.ok(bankTransferPM && cashPM && upiPM);
    console.log("  ✅ Test 5 PASSED: Payment methods aggregation verified\n");

    // ----------------------------------------------------
    // Test 6: Budgets Status & Goal Progress
    // ----------------------------------------------------
    console.log("[Test 6] Budget Status and Goals Progress Integration");
    const budgetStatus = overviewRes.body.data.budgetStatus;
    assert.ok(budgetStatus);
    assert.equal(budgetStatus.length, 1);
    assert.equal(budgetStatus[0].categoryName, "Food");
    assert.equal(budgetStatus[0].amount, 15000);
    assert.equal(budgetStatus[0].spent, 12000);
    assert.equal(budgetStatus[0].remaining, 3000);
    assert.equal(budgetStatus[0].percentage, 80);

    const goalsProgress = overviewRes.body.data.goalsProgress;
    assert.ok(goalsProgress);
    assert.equal(goalsProgress.length, 1);
    assert.equal(goalsProgress[0].name, "Emergency Fund");
    assert.equal(goalsProgress[0].targetAmount, 100000);
    assert.equal(goalsProgress[0].currentAmount, 40000);
    assert.equal(goalsProgress[0].percentage, 40);
    console.log("  ✅ Test 6 PASSED: Budget status and goal progress integrations verified\n");

    // ----------------------------------------------------
    // Test 7: Deterministic Rule-Based Financial Insights
    // ----------------------------------------------------
    console.log("[Test 7] Deterministic Rule-Based Financial Insights (Zero AI API)");
    const insights = overviewRes.body.data.insights;
    assert.ok(insights);
    assert.ok(insights.length >= 1, "Should generate deterministic insights");

    // Verified insights include high savings rate and top category concentration
    const healthySavingsInsight = insights.find((i) => i.id === "insight-healthy-savings");
    const topCatInsight = insights.find((i) => i.id === "insight-top-category");
    assert.ok(healthySavingsInsight, "Should detect healthy savings rate (62.5%)");
    assert.ok(topCatInsight, "Should detect high concentration in Shopping (60%)");
    console.log("  ✅ Test 7 PASSED: In-built deterministic insights generated successfully\n");

    // ----------------------------------------------------
    // Test 8: Cross-User / Tenant Isolation
    // ----------------------------------------------------
    console.log("[Test 8] Cross-User Ownership Isolation on Dashboard");
    const u2Overview = await apiRequest<DashboardOverview>("/dashboard/overview", {
      cookie: user2Cookie,
    });
    assert.equal(u2Overview.status, 200);
    assert.ok(u2Overview.body.data?.summary);
    // User 2 has 0 transactions
    assert.equal(u2Overview.body.data.summary.totalIncome, 0);
    assert.equal(u2Overview.body.data.summary.totalExpenses, 0);
    assert.equal(u2Overview.body.data.summary.remainingBalance, 0);
    assert.equal(u2Overview.body.data.summary.savingsRate, 0);
    assert.equal(u2Overview.body.data.categoryBreakdown.length, 0);
    assert.equal(u2Overview.body.data.recentTransactions.length, 0);
    console.log("  ✅ Test 8 PASSED: Complete data isolation between tenants on Dashboard\n");

    console.log("==========================================================");
    console.log("  🌟 ALL 8 PHASE 11 E2E TEST SCENARIOS PASSED WITH ZERO ERRORS!");
    console.log("==========================================================\n");
  } finally {
    if (server) {
      await new Promise<void>((resolve) => (server as http.Server).close(() => resolve()));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB");
    }
    if (mongoServer) {
      await mongoServer.stop();
      console.log("✓ Stopped isolated MongoMemoryServer");
    }
  }
}

runPhase11E2ETests().catch((err) => {
  console.error("❌ Phase 11 E2E test suite failed:", err);
  process.exit(1);
});
