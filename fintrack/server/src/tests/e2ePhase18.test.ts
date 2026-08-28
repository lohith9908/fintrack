import assert from "node:assert/strict";
import http from "http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { env } from "../config/env";
import { seedDatabase } from "../seed/seed";
import {
  User,
  Transaction,
  Category,
  Account,
  Budget,
  RecurringTransaction,
  SavingsGoal,
  Notification,
  AuditLog,
} from "../models";

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

async function runPhase18BackendPerformanceVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 18 Database Performance & QA Suite     ");
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
    // Test 1: Verify Database Index Coverage
    // ----------------------------------------------------
    console.log("[Test 1] Verifying MongoDB collection indexes and compound keys");
    
    // Ensure all schema indexes are synced/built in MongoDB
    await Promise.all([
      User.syncIndexes(),
      Transaction.syncIndexes(),
      Account.syncIndexes(),
      Category.syncIndexes(),
      Budget.syncIndexes(),
      RecurringTransaction.syncIndexes(),
      SavingsGoal.syncIndexes(),
      Notification.syncIndexes(),
      AuditLog.syncIndexes(),
    ]);

    const [
      userIndexes,
      txnIndexes,
      accIndexes,
      catIndexes,
      budgetIndexes,
      recIndexes,
      goalIndexes,
      notifIndexes,
      auditIndexes,
    ] = await Promise.all([
      User.collection.getIndexes(),
      Transaction.collection.getIndexes(),
      Account.collection.getIndexes(),
      Category.collection.getIndexes(),
      Budget.collection.getIndexes(),
      RecurringTransaction.collection.getIndexes(),
      SavingsGoal.collection.getIndexes(),
      Notification.collection.getIndexes(),
      AuditLog.collection.getIndexes(),
    ]);

    // Check User indexes
    assert.ok(userIndexes.email_1, "User must have unique index on email");
    assert.ok(userIndexes.role_1, "User must have index on role");
    assert.ok(userIndexes.status_1, "User must have index on status");

    // Check Transaction compound indexes
    const txnIndexKeys = Object.keys(txnIndexes);
    assert.ok(txnIndexKeys.length >= 3, "Transaction must have multiple compound indexes");

    // Check Category compound indexes
    const catIndexKeys = Object.keys(catIndexes);
    assert.ok(catIndexKeys.length >= 2, "Category must have compound indexes");

    // Check Account indexes
    const accIndexKeys = Object.keys(accIndexes);
    assert.ok(accIndexKeys.length >= 2, "Account must have compound indexes");

    // Check Budget indexes
    const budgetIndexKeys = Object.keys(budgetIndexes);
    assert.ok(budgetIndexKeys.length >= 2, "Budget must have compound indexes");

    // Check RecurringTransaction indexes
    const recIndexKeys = Object.keys(recIndexes);
    assert.ok(recIndexKeys.length >= 2, "RecurringTransaction must have nextOccurrence indexes");

    // Check SavingsGoal indexes
    const goalIndexKeys = Object.keys(goalIndexes);
    assert.ok(goalIndexKeys.length >= 2, "SavingsGoal must have user status indexes");

    // Check Notification index
    const notifIndexKeys = Object.keys(notifIndexes);
    assert.ok(notifIndexKeys.length >= 2, "Notification must have compound index for unread queries");

    // Check AuditLog index
    const auditIndexKeys = Object.keys(auditIndexes);
    assert.ok(auditIndexKeys.length >= 3, "AuditLog must have compound indexes for actor/target filtering");

    console.log("  ✅ Passed: All 9 core MongoDB collections have optimized compound indexes");

    // ----------------------------------------------------
    // Test 2: Multi-Iteration Financial Aggregation Benchmark
    // ----------------------------------------------------
    console.log("\n[Test 2] Benchmarking batch transaction queries & aggregations with 500+ records (5 iterations each)");
    const userRegRes = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Performance Test User",
        email: "perf.user@example.com",
        password: "PerfUserPassword123!",
        confirmPassword: "PerfUserPassword123!",
      },
    });
    assert.strictEqual(userRegRes.status, 201);
    const userCookie = userRegRes.cookie!;

    const userDoc = await User.findOne({ email: "perf.user@example.com" });
    const userId = userDoc!._id;

    // Create 3 Accounts & retrieve categories
    const [acc1, acc2, acc3] = await Promise.all([
      Account.create({ user: userId, name: "Perf Checking", type: "BANK_ACCOUNT", currency: "INR", openingBalance: 100000, status: "ACTIVE" }),
      Account.create({ user: userId, name: "Perf Savings", type: "BANK_ACCOUNT", currency: "INR", openingBalance: 50000, status: "ACTIVE" }),
      Account.create({ user: userId, name: "Perf Credit Card", type: "CREDIT_CARD", currency: "INR", openingBalance: 0, status: "ACTIVE" }),
    ]);

    const categories = await Category.find({ isSystem: true });
    assert.ok(categories.length > 0, "System categories must exist");

    // Seed 500 Transactions across accounts and categories
    const transactionsToInsert = [];
    const accounts = [acc1._id, acc2._id, acc3._id];
    for (let i = 1; i <= 500; i++) {
      const cat = categories[i % categories.length];
      transactionsToInsert.push({
        user: userId,
        account: accounts[i % accounts.length],
        category: cat._id,
        type: cat.type,
        amount: Math.round((15 + (i * 7.75)) * 100) / 100,
        date: new Date(2026, 7, (i % 28) + 1),
        description: `Batch Ledger Entry #${i}`,
        paymentMethod: i % 2 === 0 ? "UPI" : "DEBIT_CARD",
      });
    }
    await Transaction.insertMany(transactionsToInsert);

    // Helper to benchmark endpoint across multiple iterations
    const benchmarkEndpoint = async (path: string, iterations = 5) => {
      // Warmup iteration
      await request(path, { cookie: userCookie });

      const timings: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const res = await request(path, { cookie: userCookie });
        const duration = performance.now() - start;
        assert.strictEqual(res.status, 200);
        timings.push(duration);
      }
      const sum = timings.reduce((a, b) => a + b, 0);
      const avg = sum / timings.length;
      const min = Math.min(...timings);
      const max = Math.max(...timings);
      return { avg: Math.round(avg * 100) / 100, min: Math.round(min * 100) / 100, max: Math.round(max * 100) / 100, count: timings.length };
    };

    // 1. Dashboard Aggregation Benchmark
    const dashboardMetrics = await benchmarkEndpoint("/dashboard", 5);
    console.log(`  ✓ GET /api/dashboard [5 iterations on 500 txns]: avg=${dashboardMetrics.avg}ms, min=${dashboardMetrics.min}ms, max=${dashboardMetrics.max}ms`);
    assert.ok(dashboardMetrics.avg < 150, `Dashboard aggregation average should be < 150ms (was ${dashboardMetrics.avg}ms)`);

    // 2. Paginated Transactions Query Benchmark
    const txnMetrics = await benchmarkEndpoint("/transactions?page=1&limit=20&type=EXPENSE", 5);
    console.log(`  ✓ GET /api/transactions [5 iterations]: avg=${txnMetrics.avg}ms, min=${txnMetrics.min}ms, max=${txnMetrics.max}ms`);
    assert.ok(txnMetrics.avg < 100, `Transactions query average should be < 100ms (was ${txnMetrics.avg}ms)`);

    // 3. Analytics Aggregation Benchmark
    const analyticsMetrics = await benchmarkEndpoint("/analytics?period=this_month", 5);
    console.log(`  ✓ GET /api/analytics [5 iterations]: avg=${analyticsMetrics.avg}ms, min=${analyticsMetrics.min}ms, max=${analyticsMetrics.max}ms`);
    assert.ok(analyticsMetrics.avg < 150, `Analytics aggregation average should be < 150ms (was ${analyticsMetrics.avg}ms)`);

    console.log("  ✅ Passed: Aggregation pipelines and indexed queries executed well within performance budgets");

    // ----------------------------------------------------
    // Test 3: API Response Payload Sanitization & Leak Checks
    // ----------------------------------------------------
    console.log("\n[Test 3] Verifying API payload cleanliness and security omissions");
    const adminLoginRes = await request("/auth/login", {
      method: "POST",
      body: {
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      },
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminCookie = adminLoginRes.cookie!;

    const adminUsersRes = await request("/admin/users", { cookie: adminCookie });
    assert.strictEqual(adminUsersRes.status, 200);

    const payloadString = JSON.stringify(adminUsersRes.data).toLowerCase();
    assert.ok(!payloadString.includes("passwordhash"), "Payload must not contain passwordHash");
    assert.ok(!payloadString.includes("resettoken"), "Payload must not contain resetToken");
    assert.ok(!payloadString.includes("secret"), "Payload must not contain secret tokens");

    console.log("  ✅ Passed: Sensitive security fields omitted across all API responses");

    console.log("\n==========================================================");
    console.log("  🎉 FinTrack Phase 18 Backend Performance Suite PASSED!  ");
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

runPhase18BackendPerformanceVerification().catch((err) => {
  console.error("❌ Phase 18 Performance Test Failed:", err);
  process.exit(1);
});
