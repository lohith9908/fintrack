import assert from "node:assert/strict";
import http from "http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { seedDatabase } from "../seed/seed";
import { User, Notification, Transaction, Category } from "../models";
import { NotificationService } from "../services/notification.service";
import { InsightService } from "../services/insight.service";

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

async function runPhase15Tests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 15 Notifications & Analytics E2E Suite ");
  console.log("==========================================================\n");

  if (mongoose.connection.readyState === 0) {
    console.log("ℹ️ Starting isolated MongoMemoryServer for Phase 15 tests...");
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

  let totalTests = 0;
  const pass = (msg: string) => {
    totalTests++;
    console.log(`  ✅ Passed: ${msg}`);
  };

  try {
    // ----------------------------------------------------
    // Test 1: Unauthenticated Guard
    // ----------------------------------------------------
    console.log("[Test 1] Guarding notification and analytics endpoints against unauthenticated access");
    const unauthNotif = await request("/notifications");
    assert.equal(unauthNotif.status, 401, "Expected 401 for /api/notifications");

    const unauthAnalytics = await request("/analytics");
    assert.equal(unauthAnalytics.status, 401, "Expected 401 for /api/analytics");
    pass("401 Unauthorized for unauthenticated requests");

    // ----------------------------------------------------
    // Setup: Register Test Users & Seed Financial Fixtures
    // ----------------------------------------------------
    console.log("\n[Setup] Registering test users & setting up accounts/categories...");
    const user1Email = `p15_user1_${Date.now()}@example.com`;
    const reg1 = await request("/auth/register", {
      method: "POST",
      body: { name: "Phase 15 Alice", email: user1Email, password: "Password@123" },
    });
    assert.equal(reg1.status, 201);
    const user1Cookie = reg1.cookie;
    const user1Doc = await User.findOne({ email: user1Email });
    assert.ok(user1Doc, "User 1 doc must exist");
    const user1Id = user1Doc._id.toString();

    const user2Email = `p15_user2_${Date.now()}@example.com`;
    const reg2 = await request("/auth/register", {
      method: "POST",
      body: { name: "Phase 15 Bob", email: user2Email, password: "Password@123" },
    });
    assert.equal(reg2.status, 201);
    const user2Cookie = reg2.cookie;

    // Create Account & Categories for Alice
    const accRes = await request("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: { name: "Primary Checking", type: "BANK_ACCOUNT", initialBalance: 100000 },
    });
    assert.equal(accRes.status, 201);
    const accountId = (accRes.data.data as { account: { _id: string } }).account._id;

    const catFood = await Category.create({
      user: user1Doc._id,
      name: "Food & Dining",
      type: "EXPENSE",
      color: "#F59E0B",
      icon: "utensils",
      isSystem: false,
      isActive: true,
    });

    const catSalary = await Category.create({
      user: user1Doc._id,
      name: "Monthly Salary",
      type: "INCOME",
      color: "#10B981",
      icon: "briefcase",
      isSystem: false,
      isActive: true,
    });

    const catShopping = await Category.create({
      user: user1Doc._id,
      name: "Shopping & Gadgets",
      type: "EXPENSE",
      color: "#EC4899",
      icon: "shopping-bag",
      isSystem: false,
      isActive: true,
    });

    // ----------------------------------------------------
    // Test 2: Notification Preferences & Creation
    // ----------------------------------------------------
    console.log("\n[Test 2] Testing Notification Service with user notificationPreferences");
    
    // Create notifications for Alice
    const n1 = await NotificationService.createNotification(user1Id, {
      type: "BUDGET_ALERT",
      title: "Budget Threshold 85%",
      message: "You have utilized 85% of your food budget.",
      severity: "WARNING",
    });
    assert.ok(n1, "Notification 1 must be created");
    assert.equal(n1.read, false);

    const n2 = await NotificationService.createNotification(user1Id, {
      type: "RECURRING_PAYMENT",
      title: "Netflix Subscription Due",
      message: "Netflix ₹649 will be processed tomorrow.",
      severity: "INFO",
    });
    assert.ok(n2, "Notification 2 must be created");

    // Test Preference suppression: Disable goalAlerts for Alice
    user1Doc.notificationPreferences = {
      ...user1Doc.notificationPreferences,
      goalAlerts: false,
    };
    await user1Doc.save();

    const nGoalSuppressed = await NotificationService.createNotification(user1Id, {
      type: "GOAL_MILESTONE",
      title: "Goal Milestone Reached",
      message: "You reached 50% of your savings goal!",
      severity: "SUCCESS",
    });
    assert.equal(nGoalSuppressed, null, "Goal notification must be suppressed when goalAlerts is false");

    // Re-enable goalAlerts
    user1Doc.notificationPreferences.goalAlerts = true;
    await user1Doc.save();

    const nGoalAllowed = await NotificationService.createNotification(user1Id, {
      type: "GOAL_MILESTONE",
      title: "Goal Milestone Reached",
      message: "You reached 50% of your savings goal!",
      severity: "SUCCESS",
    });
    assert.ok(nGoalAllowed, "Goal notification must be created when preference is true");
    pass("Notification creation correctly respects user notificationPreferences");

    // ----------------------------------------------------
    // Test 3: Notification Listing & Unread Count API
    // ----------------------------------------------------
    console.log("\n[Test 3] Testing GET /api/notifications and GET /api/notifications/unread-count");
    const notifsRes = await request("/notifications", { cookie: user1Cookie });
    assert.equal(notifsRes.status, 200);
    const notifsPayload = notifsRes.data.data as {
      notifications: Array<{ _id: string; read: boolean; title: string }>;
      unreadCount: number;
      total: number;
    };
    assert.equal(notifsPayload.total, 3);
    assert.equal(notifsPayload.unreadCount, 3);

    const unreadCountRes = await request("/notifications/unread-count", { cookie: user1Cookie });
    assert.equal(unreadCountRes.status, 200);
    assert.equal((unreadCountRes.data.data as { unreadCount: number }).unreadCount, 3);
    pass("Notification listing and unread count return accurate counts");

    // ----------------------------------------------------
    // Test 4: Notification Read State Management
    // ----------------------------------------------------
    console.log("\n[Test 4] Testing Mark Single as Read and Mark All as Read");
    const notifIdToRead = n1._id.toString();

    // Mark single as read
    const markSingleRes = await request(`/notifications/${notifIdToRead}/read`, {
      method: "PATCH",
      cookie: user1Cookie,
    });
    assert.equal(markSingleRes.status, 200);
    assert.equal((markSingleRes.data.data as { read: boolean }).read, true);

    const countAfterOneRead = await NotificationService.getUnreadCount(user1Id);
    assert.equal(countAfterOneRead, 2);

    // Mark all as read
    const markAllRes = await request("/notifications/read-all", {
      method: "PATCH",
      cookie: user1Cookie,
    });
    assert.equal(markAllRes.status, 200);

    const countAfterAllRead = await NotificationService.getUnreadCount(user1Id);
    assert.equal(countAfterAllRead, 0);
    pass("Mark as read and Mark all as read successfully decrement unread counts");

    // ----------------------------------------------------
    // Test 5: Notification Deletion & Isolation
    // ----------------------------------------------------
    console.log("\n[Test 5] Testing Notification Deletion & Ownership Authorization");
    // User 2 tries to delete User 1's notification
    const crossDelete = await request(`/notifications/${notifIdToRead}`, {
      method: "DELETE",
      cookie: user2Cookie,
    });
    assert.equal(crossDelete.status, 404, "User 2 cannot delete User 1 notification");

    // User 1 deletes their own notification
    const ownDelete = await request(`/notifications/${notifIdToRead}`, {
      method: "DELETE",
      cookie: user1Cookie,
    });
    assert.equal(ownDelete.status, 200);

    // Clear read notifications
    const clearRes = await request("/notifications?readOnly=true", {
      method: "DELETE",
      cookie: user1Cookie,
    });
    assert.equal(clearRes.status, 200);

    const remainingCount = await Notification.countDocuments({ user: user1Doc._id });
    assert.equal(remainingCount, 0, "All read notifications cleared");
    pass("Notification deletion and ownership isolation verified");

    // ----------------------------------------------------
    // Test 6: Financial Data Setup for Analytics Aggregations
    // ----------------------------------------------------
    console.log("\n[Test 6] Seeding transactions to verify analytics calculations & trends");
    const now = new Date();
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 10);
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 10);

    // Current Month Transactions
    // 1. Income: ₹60,000
    await Transaction.create({
      user: user1Doc._id,
      account: accountId,
      category: catSalary._id,
      amount: 60000,
      type: "INCOME",
      paymentMethod: "BANK_TRANSFER",
      date: currentMonthDate,
      description: "August Salary",
    });

    // 2. Food Expense: ₹15,000 (UPI)
    await Transaction.create({
      user: user1Doc._id,
      account: accountId,
      category: catFood._id,
      amount: 15000,
      type: "EXPENSE",
      paymentMethod: "UPI",
      date: currentMonthDate,
      description: "Groceries & Dining",
    });

    // 3. Shopping Expense: ₹5,000 (Credit Card)
    await Transaction.create({
      user: user1Doc._id,
      account: accountId,
      category: catShopping._id,
      amount: 5000,
      type: "EXPENSE",
      paymentMethod: "CREDIT_CARD",
      date: new Date(now.getFullYear(), now.getMonth(), 15),
      description: "Electronics purchase",
    });

    // Previous Month Transactions
    // 1. Income: ₹50,000
    await Transaction.create({
      user: user1Doc._id,
      account: accountId,
      category: catSalary._id,
      amount: 50000,
      type: "INCOME",
      paymentMethod: "BANK_TRANSFER",
      date: prevMonthDate,
      description: "July Salary",
    });

    // 2. Food Expense: ₹10,000
    await Transaction.create({
      user: user1Doc._id,
      account: accountId,
      category: catFood._id,
      amount: 10000,
      type: "EXPENSE",
      paymentMethod: "UPI",
      date: prevMonthDate,
      description: "July Groceries",
    });

    // ----------------------------------------------------
    // Test 7: Analytics Overview Aggregation API
    // ----------------------------------------------------
    console.log("\n[Test 7] Testing GET /api/analytics overview aggregation");
    const analyticsRes = await request("/analytics?period=this_month", { cookie: user1Cookie });
    assert.equal(analyticsRes.status, 200);
    const aData = analyticsRes.data.data as {
      summary: {
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        savingsRate: number;
        transactionCount: number;
        comparison?: {
          prevIncome: number;
          prevExpenses: number;
          incomeChangePct: number;
          expenseChangePct: number;
        };
      };
      categoryBreakdown: Array<{ name: string; amount: number; percentage: number }>;
      paymentMethods: Array<{ method: string; amount: number; percentage: number }>;
      accountBreakdown: Array<{ name: string; amount: number }>;
      monthlyTrends: Array<{ month: string; income: number; expense: number; savingsRate: number }>;
      velocityStats: { averageDailySpending: number };
      insights: Array<{ rule: string; type: string; title: string; message: string }>;
    };

    // Verify Financial Summary
    assert.equal(aData.summary.totalIncome, 60000, "Total Income must be 60,000");
    assert.equal(aData.summary.totalExpenses, 20000, "Total Expenses must be 20,000");
    assert.equal(aData.summary.netSavings, 40000, "Net Savings must be 40,000");
    assert.equal(aData.summary.savingsRate, 66.7, "Savings Rate must be (40000/60000)*100 = 66.7%");
    assert.equal(aData.summary.transactionCount, 3);

    // Verify Period Comparison
    assert.ok(aData.summary.comparison, "Comparison data must be present");
    assert.equal(aData.summary.comparison.prevIncome, 50000);
    assert.equal(aData.summary.comparison.prevExpenses, 10000);
    assert.equal(aData.summary.comparison.incomeChangePct, 20); // (60000-50000)/50000 * 100 = +20%
    assert.equal(aData.summary.comparison.expenseChangePct, 100); // (20000-10000)/10000 * 100 = +100%

    // Verify Category Breakdown
    assert.equal(aData.categoryBreakdown.length, 2);
    const topCat = aData.categoryBreakdown[0];
    assert.equal(topCat.name, "Food & Dining");
    assert.equal(topCat.amount, 15000);
    assert.equal(topCat.percentage, 75); // 15000 / 20000 = 75%

    // Verify Payment Methods
    assert.ok(aData.paymentMethods.some((p) => p.method === "UPI" && p.amount === 15000));
    assert.ok(aData.paymentMethods.some((p) => p.method === "CREDIT_CARD" && p.amount === 5000));
    assert.ok(aData.paymentMethods.some((p) => p.method === "BANK_TRANSFER" && p.amount === 60000));

    pass("Analytics Overview calculations, category breakdowns, and payment methods verified");

    // ----------------------------------------------------
    // Test 8: Granular Analytics Sub-Endpoints
    // ----------------------------------------------------
    console.log("\n[Test 8] Testing sub-endpoints: /summary, /trends, /categories, /payment-methods, /accounts, /insights");
    const summaryRes = await request("/analytics/summary?period=this_month", { cookie: user1Cookie });
    assert.equal(summaryRes.status, 200);

    const trendsRes = await request("/analytics/trends?period=6m", { cookie: user1Cookie });
    assert.equal(trendsRes.status, 200);
    assert.ok(Array.isArray(trendsRes.data.data), "Trends must be array");

    const catRes = await request("/analytics/categories?period=this_month", { cookie: user1Cookie });
    assert.equal(catRes.status, 200);

    const pmRes = await request("/analytics/payment-methods?period=this_month", { cookie: user1Cookie });
    assert.equal(pmRes.status, 200);

    const accsRes = await request("/analytics/accounts?period=this_month", { cookie: user1Cookie });
    assert.equal(accsRes.status, 200);

    const insightsRes = await request("/analytics/insights", { cookie: user1Cookie });
    assert.equal(insightsRes.status, 200);
    pass("All modular analytics sub-endpoints return 200 with structured data");

    // ----------------------------------------------------
    // Test 9: Deterministic Financial Insight Rules
    // ----------------------------------------------------
    console.log("\n[Test 9] Testing Deterministic Insight Rules (MoM Spike, Category Concentration, Savings Rate)");
    const insights = await InsightService.evaluateInsights(user1Id);
    assert.ok(insights.length > 0, "Must evaluate at least 1 insight");

    // Check Category Concentration Rule (Food is 75% of expenses >= 30%)
    const concInsight = insights.find((i) => i.rule === "CATEGORY_CONCENTRATION");
    assert.ok(concInsight, "CATEGORY_CONCENTRATION insight must trigger");
    assert.equal(concInsight?.type, "INFO");
    assert.ok(concInsight?.message.includes("Food & Dining accounts for 75% of your monthly expenses"));

    // Check MoM Expense Increase Rule (20,000 vs 10,000 = +100% increase >= 10%)
    const momInsight = insights.find((i) => i.rule === "MONTH_OVER_MONTH_EXPENSE_INCREASE");
    assert.ok(momInsight, "MONTH_OVER_MONTH_EXPENSE_INCREASE insight must trigger");
    assert.equal(momInsight?.type, "WARNING");
    assert.ok(momInsight?.message.includes("100%"));

    // Check Savings Improvement Rule (Saved 40,000 vs 40,000 in prev month)
    const rateInsight = insights.find(
      (i) => i.rule === "SAVINGS_IMPROVEMENT" || i.rule === "STRONG_SAVINGS_RATE"
    );
    assert.ok(rateInsight, "Healthy savings rate or savings improvement insight must trigger");

    // Verify 0 external AI keys or AI services exist
    assert.equal(process.env.OPENAI_API_KEY, undefined);
    assert.equal(process.env.GEMINI_API_KEY, undefined);
    assert.equal(process.env.ANTHROPIC_API_KEY, undefined);

    pass("Deterministic rule engine produces explainable, repeatable insights without AI");

    console.log("\n==========================================================");
    console.log(`  🎉 FinTrack Phase 15 All ${totalTests} Tests PASSED!`);
    console.log("==========================================================\n");
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (mongoServer) {
      await mongoose.disconnect();
      await mongoServer.stop();
    }
  }
}

runPhase15Tests().catch((err) => {
  console.error("\n❌ Phase 15 E2E Test Suite FAILED:", err);
  process.exit(1);
});
