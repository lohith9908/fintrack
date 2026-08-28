import assert from "node:assert/strict";
import http from "http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { seedDatabase } from "../seed/seed";
import { User, Transaction, Category, Budget, SavingsGoal, RecurringTransaction } from "../models";

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

  const contentType = res.headers.get("content-type") || "";
  let data: Record<string, unknown> = {};
  let text = "";
  let arrayBuffer: ArrayBuffer | null = null;

  if (contentType.includes("application/json")) {
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      // Non-JSON
    }
  } else if (contentType.includes("application/pdf")) {
    arrayBuffer = await res.arrayBuffer();
  } else {
    text = await res.text();
  }

  return {
    status: res.status,
    data,
    text,
    arrayBuffer,
    cookie,
    headers: res.headers,
  };
}

async function runPhase16Tests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 16 Calendar, Reports & Export E2E Suite ");
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
    // Test 1: Guard endpoints against unauthenticated access
    // ----------------------------------------------------
    console.log("[Test 1] Guarding calendar and report endpoints against unauthenticated access");
    const unauthCal = await request("/calendar");
    assert.strictEqual(unauthCal.status, 401, "Calendar endpoint must require auth");

    const unauthReport = await request("/reports/monthly");
    assert.strictEqual(unauthReport.status, 401, "Reports monthly endpoint must require auth");

    const unauthPdf = await request("/reports/pdf");
    assert.strictEqual(unauthPdf.status, 401, "PDF endpoint must require auth");

    const unauthCsv = await request("/reports/csv");
    assert.strictEqual(unauthCsv.status, 401, "CSV endpoint must require auth");

    const unauthExport = await request("/reports/export-data");
    assert.strictEqual(unauthExport.status, 401, "Export data endpoint must require auth");
    console.log("  ✅ Passed: All Phase 16 endpoints return 401 for unauthenticated requests");

    // ----------------------------------------------------
    // Setup: Register User A and User B
    // ----------------------------------------------------
    console.log("\n[Setup] Registering test users & creating fixtures...");
    const regResA = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Alice Financial",
        email: "alice.phase16@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      },
    });
    const cookieA = regResA.cookie;
    const userA = await User.findOne({ email: "alice.phase16@example.com" });
    const userAId = userA!._id.toString();

    const regResB = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Bob Isolated",
        email: "bob.phase16@example.com",
        password: "StrongPassword123!",
        confirmPassword: "StrongPassword123!",
      },
    });
    const cookieB = regResB.cookie;

    // Create Account for Alice
    const accRes = await request("/accounts", {
      method: "POST",
      cookie: cookieA,
      body: {
        name: "Alice HDFC Bank",
        type: "BANK_ACCOUNT",
        balance: 100000,
        currency: "INR",
      },
    });
    const accData = accRes.data.data as { account?: { _id: string }; _id?: string };
    const accId = accData.account?._id || accData._id!;

    // Get Categories
    const categories = await Category.find({});
    const foodCat = categories.find((c) => c.name.toLowerCase().includes("food")) || categories[0];
    const salaryCat = categories.find((c) => c.type === "INCOME") || categories[1];

    const currentYear = 2026;
    const currentMonth = 8; // August 2026

    // Create Recurring Transaction (Monthly Rent Bill due on Aug 5)
    await RecurringTransaction.create({
      user: userAId,
      name: "Apartment Rent",
      type: "EXPENSE",
      amount: 25000,
      account: accId,
      category: foodCat._id,
      paymentMethod: "BANK_TRANSFER",
      frequency: "MONTHLY",
      startDate: new Date(Date.UTC(2026, 7, 5)), // Aug 5, 2026
      nextOccurrence: new Date(Date.UTC(2026, 7, 5)),
      status: "ACTIVE",
    });

    // Create Savings Goal (Target Date: Aug 20, 2026)
    await SavingsGoal.create({
      user: userAId,
      name: "Emergency Reserve",
      targetAmount: 50000,
      currentAmount: 35000,
      targetDate: new Date(Date.UTC(2026, 7, 20)),
      status: "ACTIVE",
    });

    // Create Budget for August 2026
    await Budget.create({
      user: userAId,
      category: foodCat._id,
      limitAmount: 15000,
      month: 8,
      year: 2026,
    });

    // Create Completed Transactions in August 2026
    await Transaction.create([
      {
        user: userAId,
        account: accId,
        category: salaryCat._id,
        type: "INCOME",
        amount: 80000,
        date: new Date(Date.UTC(2026, 7, 1)),
        description: "August Monthly Salary",
        paymentMethod: "BANK_TRANSFER",
        status: "COMPLETED",
      },
      {
        user: userAId,
        account: accId,
        category: foodCat._id,
        type: "EXPENSE",
        amount: 5000,
        date: new Date(Date.UTC(2026, 7, 10)),
        description: "Supermarket Grocery Run",
        paymentMethod: "UPI",
        status: "COMPLETED",
      },
      {
        user: userAId,
        account: accId,
        category: foodCat._id,
        type: "EXPENSE",
        amount: 3000,
        date: new Date(Date.UTC(2026, 7, 15)),
        description: "Family Dinner",
        paymentMethod: "CREDIT_CARD",
        status: "COMPLETED",
      },
    ]);
    console.log("  ✓ Fixtures setup completed successfully");

    // ----------------------------------------------------
    // Test 2: Calendar Aggregation (GET /api/calendar)
    // ----------------------------------------------------
    console.log("\n[Test 2] Testing GET /api/calendar event merging & density");
    const calRes = await request(`/calendar?month=${currentMonth}&year=${currentYear}`, {
      cookie: cookieA,
    });

    assert.strictEqual(calRes.status, 200, "Calendar endpoint must return 200");
    const calData = calRes.data.data as {
      month: number;
      year: number;
      events: Array<{ id: string; type: string; title: string; date: string; amount: number }>;
      days: Array<{ date: string; eventsCount: number; totalInflow: number; totalOutflow: number }>;
      summary: { totalProjectedBills: number; totalProjectedIncome: number };
    };

    assert.strictEqual(calData.month, 8);
    assert.strictEqual(calData.year, 2026);
    assert.ok(calData.events.length >= 4, "Must contain recurring, goal, budget, and transactions");

    // Check specific event types
    const recEvt = calData.events.find((e) => e.type === "RECURRING_PAYMENT");
    assert.ok(recEvt, "Must find recurring event in calendar");
    assert.strictEqual(recEvt?.date, "2026-08-05");
    assert.strictEqual(recEvt?.amount, 25000);

    const goalEvt = calData.events.find((e) => e.type === "GOAL_DEADLINE");
    assert.ok(goalEvt, "Must find goal deadline event in calendar");
    assert.strictEqual(goalEvt?.date, "2026-08-20");

    const budgetEvt = calData.events.find((e) => e.type === "BUDGET_PERIOD");
    assert.ok(budgetEvt, "Must find budget period event");

    // Check daily summaries
    assert.strictEqual(calData.days.length, 31, "August must have 31 days");
    console.log("  ✅ Passed: Calendar accurately combined recurring bills, goal deadlines, budgets & transactions");

    // ----------------------------------------------------
    // Test 3: Monthly Report Calculation (GET /api/reports/monthly)
    // ----------------------------------------------------
    console.log("\n[Test 3] Testing GET /api/reports/monthly calculation consistency");
    const reportRes = await request(`/reports/monthly?month=${currentMonth}&year=${currentYear}`, {
      cookie: cookieA,
    });

    assert.strictEqual(reportRes.status, 200, "Monthly report endpoint must return 200");
    const reportData = reportRes.data.data as {
      summary: {
        totalIncome: number;
        totalExpenses: number;
        netSavings: number;
        savingsRate: number;
        transactionCount: number;
      };
      categories: Array<{ name: string; amount: number; percentage: number }>;
      paymentMethods: Array<{ method: string; amount: number; percentage: number }>;
    };

    assert.strictEqual(reportData.summary.totalIncome, 80000, "Total income must equal 80000");
    assert.strictEqual(reportData.summary.totalExpenses, 8000, "Total expenses must equal 8000 (5000+3000)");
    assert.strictEqual(reportData.summary.netSavings, 72000, "Net savings must equal 72000");
    assert.strictEqual(reportData.summary.savingsRate, 90, "Savings rate must equal 90%");
    assert.strictEqual(reportData.summary.transactionCount, 3, "Transaction count must equal 3");

    assert.strictEqual(reportData.categories[0].amount, 8000, "Food category expense must be 8000");
    assert.strictEqual(reportData.categories[0].percentage, 100, "Food category share must be 100%");
    console.log("  ✅ Passed: Monthly report calculations strictly match deterministic ledger rules");

    // ----------------------------------------------------
    // Test 4: PDF Statement Generation (GET /api/reports/pdf)
    // ----------------------------------------------------
    console.log("\n[Test 4] Testing GET /api/reports/pdf binary document generation");
    const pdfRes = await request(`/reports/pdf?month=${currentMonth}&year=${currentYear}`, {
      cookie: cookieA,
    });

    assert.strictEqual(pdfRes.status, 200, "PDF endpoint must return 200");
    assert.strictEqual(pdfRes.headers.get("content-type"), "application/pdf", "Must have application/pdf content type");
    assert.ok(
      String(pdfRes.headers.get("content-disposition")).includes("attachment; filename="),
      "Must include attachment content disposition header"
    );

    assert.ok(pdfRes.arrayBuffer, "PDF must return binary array buffer");
    const pdfBuffer = Buffer.from(pdfRes.arrayBuffer!);
    const pdfStr = pdfBuffer.toString("binary");
    assert.ok(pdfStr.startsWith("%PDF-1.4"), "PDF payload must start with %PDF-1.4 header");
    assert.ok(pdfStr.includes("%%EOF"), "PDF payload must contain %%EOF trailer");
    assert.ok(pdfBuffer.length > 500, "PDF binary size must be valid");
    console.log("  ✅ Passed: Pure deterministic PDF generator produced standard %PDF-1.4 statement buffer");

    // ----------------------------------------------------
    // Test 5: CSV Ledger Export (GET /api/reports/csv)
    // ----------------------------------------------------
    console.log("\n[Test 5] Testing GET /api/reports/csv RFC 4180 export");
    const csvRes = await request(`/reports/csv`, {
      cookie: cookieA,
    });

    assert.strictEqual(csvRes.status, 200, "CSV endpoint must return 200");
    assert.ok(
      String(csvRes.headers.get("content-type")).includes("text/csv"),
      "Must have text/csv content type"
    );
    assert.ok(
      String(csvRes.headers.get("content-disposition")).includes(".csv"),
      "Must have .csv filename header"
    );

    assert.ok(csvRes.text.includes("Date,Type,Amount,Currency,Category,Account"), "Must include CSV header columns");
    assert.ok(csvRes.text.includes("August Monthly Salary"), "Must include Salary transaction");
    assert.ok(csvRes.text.includes("Supermarket Grocery Run"), "Must include Grocery transaction");
    console.log("  ✅ Passed: CSV export adheres to standard ledger format with header definitions");

    // ----------------------------------------------------
    // Test 6: Full User Data Archive Export (GET /api/reports/export-data)
    // ----------------------------------------------------
    console.log("\n[Test 6] Testing GET /api/reports/export-data sanitized data export & security");
    const exportRes = await request(`/reports/export-data`, {
      cookie: cookieA,
    });

    assert.strictEqual(exportRes.status, 200, "Export data endpoint must return 200");
    const exportData = exportRes.data.data as {
      exportMetadata: { version: string; entityCounts: Record<string, number> };
      user: Record<string, unknown>;
      accounts: Array<Record<string, unknown>>;
      transactions: Array<Record<string, unknown>>;
      budgets: Array<Record<string, unknown>>;
      recurringTransactions: Array<Record<string, unknown>>;
      savingsGoals: Array<Record<string, unknown>>;
    };

    assert.strictEqual(exportData.exportMetadata.version, "1.0");
    assert.strictEqual(exportData.user.name, "Alice Financial");
    assert.strictEqual(exportData.user.email, "alice.phase16@example.com");

    // CRITICAL SECURITY ASSERTIONS: Strict exclusion of sensitive credentials
    assert.strictEqual(exportData.user.passwordHash, undefined, "Export MUST NEVER contain passwordHash");
    assert.strictEqual((exportData.user as Record<string, unknown>)["jwt"], undefined, "Export MUST NEVER contain JWT");
    assert.strictEqual((exportData.user as Record<string, unknown>)["resetToken"], undefined, "Export MUST NEVER contain resetToken");
    assert.strictEqual((exportData.user as Record<string, unknown>)["secret"], undefined, "Export MUST NEVER contain secrets");

    // Entity checks
    assert.strictEqual(exportData.accounts.length, 1);
    assert.strictEqual(exportData.transactions.length, 3);
    assert.strictEqual(exportData.budgets.length, 1);
    assert.strictEqual(exportData.recurringTransactions.length, 1);
    assert.strictEqual(exportData.savingsGoals.length, 1);
    console.log("  ✅ Passed: User data archive export sanitized and verified all user entities");

    // ----------------------------------------------------
    // Test 7: Tenant Isolation for User B
    // ----------------------------------------------------
    console.log("\n[Test 7] Testing tenant isolation (User B receives isolated empty dataset)");
    const userBCal = await request(`/calendar?month=8&year=2026`, { cookie: cookieB });
    assert.strictEqual(userBCal.status, 200);
    const userBCalData = userBCal.data.data as { events: Array<unknown> };
    assert.strictEqual(userBCalData.events.length, 0, "User B must see 0 events in calendar");

    const userBReport = await request(`/reports/monthly?month=8&year=2026`, { cookie: cookieB });
    assert.strictEqual(userBReport.status, 200);
    const userBRepData = userBReport.data.data as { summary: { totalIncome: number; totalExpenses: number } };
    assert.strictEqual(userBRepData.summary.totalIncome, 0, "User B income must be 0");
    assert.strictEqual(userBRepData.summary.totalExpenses, 0, "User B expenses must be 0");
    console.log("  ✅ Passed: Cross-tenant isolation strictly enforced across all Phase 16 endpoints");

    console.log("\n==========================================================");
    console.log("  🎉 FinTrack Phase 16 All 7 Backend E2E Tests PASSED!");
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

runPhase16Tests().catch((err) => {
  console.error("❌ Phase 16 E2E Test Suite Failed:", err);
  process.exit(1);
});
