import assert from "node:assert/strict";
import http from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { env } from "../config/env";
import { seedDatabase } from "../seed/seed";

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

interface TransactionData {
  _id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: {
    _id: string;
    name: string;
    type: string;
    icon?: string;
    color?: string;
  };
  description: string;
  date: string;
  paymentMethod: string;
  account: {
    _id: string;
    name: string;
    type: string;
    currency: string;
  };
  notes?: string;
}

interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
}

interface AccountData {
  _id: string;
  name: string;
  currentBalance: number;
}

interface CategoryData {
  _id: string;
  name: string;
  type: string;
}

async function runPhase9E2ETests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 9 Transactions Core E2E Test Suite     ");
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
      console.log("ℹ️ Local MongoDB unreachable. Starting isolated MongoMemoryServer for Phase 9 tests...");
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
      const body = (await res.json()) as ApiResponse<T>;
      return { status: res.status, body, cookie: cookieResult };
    };

    // ----------------------------------------------------
    // Setup: Create 2 Users, Accounts, and Categories
    // ----------------------------------------------------
    console.log("[Setup] Registering test users and creating initial accounts...");
    const u1Reg = await apiRequest<{ user: { _id: string } }>("/auth/register", {
      method: "POST",
      body: { name: "Txn User 1", email: `txn_user1_${Date.now()}@example.com`, password: "Password123!", confirmPassword: "Password123!" },
    });
    assert.ok(u1Reg.cookie);
    const user1Cookie = u1Reg.cookie;

    const u2Reg = await apiRequest<{ user: { _id: string } }>("/auth/register", {
      method: "POST",
      body: { name: "Txn User 2", email: `txn_user2_${Date.now()}@example.com`, password: "Password123!", confirmPassword: "Password123!" },
    });
    assert.ok(u2Reg.cookie);
    const user2Cookie = u2Reg.cookie;

    // Create User 1 Accounts: Bank (45,000), Cash (5,000), Credit Card (0)
    const bankRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: { name: "HDFC Checking", type: "BANK_ACCOUNT", openingBalance: 45000 },
    });
    assert.ok(bankRes.body.data?.account);
    const bankId = bankRes.body.data.account._id;

    const cashRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: { name: "Cash Wallet", type: "CASH", openingBalance: 5000 },
    });
    assert.ok(cashRes.body.data?.account);
    const cashId = cashRes.body.data.account._id;

    // Create User 2 Account (for ownership checks)
    const u2AccRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user2Cookie,
      body: { name: "User2 Secret Wallet", type: "CASH", openingBalance: 1000 },
    });
    assert.ok(u2AccRes.body.data?.account);
    const u2AccountId = u2AccRes.body.data.account._id;

    // Fetch Categories
    const catList = await apiRequest<{ categories: CategoryData[] }>("/categories", { cookie: user1Cookie });
    assert.ok(catList.body.data?.categories);
    const salaryCat = catList.body.data.categories.find((c) => c.name === "Salary" && c.type === "INCOME")!;
    const foodCat = catList.body.data.categories.find((c) => c.name === "Food" && c.type === "EXPENSE")!;
    assert.ok(salaryCat && foodCat, "System categories must exist");
    console.log("  ✓ Test users, accounts, and categories initialized.\n");

    // ----------------------------------------------------
    // Test 1: Unauthenticated Guard
    // ----------------------------------------------------
    console.log("[Test 1] Unauthenticated request to /api/transactions");
    const unauthRes = await apiRequest("/transactions");
    assert.equal(unauthRes.status, 401, "/transactions requires authentication");
    console.log("  ✅ Test 1 PASSED: 401 Unauthorized for unauthenticated requests\n");

    // ----------------------------------------------------
    // Test 2: Validation Guards (Amount & Category Mismatch)
    // ----------------------------------------------------
    console.log("[Test 2] Transaction validation guards (Negative amount, Category type mismatch)");
    // 2a. Zero or Negative amount
    const invalidAmount = await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        amount: -500,
        type: "INCOME",
        category: salaryCat._id,
        description: "Invalid Amount",
        date: "2026-08-27",
        paymentMethod: "BANK_TRANSFER",
        account: bankId,
      },
    });
    assert.equal(invalidAmount.status, 422, "Negative amount must return 422 Validation Error");

    // 2b. Mismatched Category Type (Income transaction with Expense Food Category)
    const mismatchedCat = await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        amount: 2500,
        type: "INCOME",
        category: foodCat._id, // Expense category for income
        description: "Mismatched category",
        date: "2026-08-27",
        paymentMethod: "BANK_TRANSFER",
        account: bankId,
      },
    });
    assert.equal(mismatchedCat.status, 400, "Category type mismatch must return 400");

    // 2c. Account Ownership mismatch (User 1 trying to use User 2's account)
    const foreignAccount = await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        amount: 1000,
        type: "INCOME",
        category: salaryCat._id,
        description: "Foreign Account Attack",
        date: "2026-08-27",
        paymentMethod: "BANK_TRANSFER",
        account: u2AccountId,
      },
    });
    assert.equal(foreignAccount.status, 404, "Foreign account must return 404 Not Found");
    console.log("  ✅ Test 2 PASSED: Validation guards strictly enforced (amount, category type, account ownership)\n");

    // ----------------------------------------------------
    // Test 3: Create Income and Expense Transactions
    // ----------------------------------------------------
    console.log("[Test 3] Create valid Income and Expense transactions");
    // 3a. Income: Salary ₹75,000 into Bank Account
    const incomeRes = await apiRequest<{ transaction: TransactionData }>("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        amount: 75000,
        type: "INCOME",
        category: salaryCat._id,
        description: "August Tech Salary",
        date: "2026-08-27",
        paymentMethod: "BANK_TRANSFER",
        account: bankId,
        notes: "Monthly direct deposit",
      },
    });
    assert.equal(incomeRes.status, 201, "Income transaction creation must return 201");
    assert.ok(incomeRes.body.data?.transaction);
    assert.equal(incomeRes.body.data.transaction.amount, 75000);
    assert.equal(incomeRes.body.data.transaction.category.name, "Salary");
    assert.equal(incomeRes.body.data.transaction.account.name, "HDFC Checking");
    const incomeId = incomeRes.body.data.transaction._id;

    // 3b. Expense: Groceries ₹3,500 from Cash Wallet
    const expenseRes = await apiRequest<{ transaction: TransactionData }>("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        amount: 3500,
        type: "EXPENSE",
        category: foodCat._id,
        description: "Supermarket Groceries",
        date: "2026-08-27",
        paymentMethod: "CASH",
        account: cashId,
        notes: "Organic food & produce",
      },
    });
    assert.equal(expenseRes.status, 201, "Expense transaction creation must return 201");
    assert.ok(expenseRes.body.data?.transaction);
    assert.equal(expenseRes.body.data.transaction.amount, 3500);
    assert.equal(expenseRes.body.data.transaction.category.name, "Food");
    assert.equal(expenseRes.body.data.transaction.account.name, "Cash Wallet");
    const expenseId = expenseRes.body.data.transaction._id;
    console.log("  ✅ Test 3 PASSED: Income and Expense transactions created with populated references\n");

    // ----------------------------------------------------
    // Test 4: List Transactions & Financial Summary Calculation
    // ----------------------------------------------------
    console.log("[Test 4] List transactions and verify aggregated financial totals");
    const listRes = await apiRequest<{ transactions: TransactionData[]; summary: TransactionSummary }>("/transactions", {
      cookie: user1Cookie,
    });
    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.data?.transactions);
    assert.equal(listRes.body.data.transactions.length, 2);

    const summary = listRes.body.data.summary;
    // Total Income: 75,000
    // Total Expenses: 3,500
    // Net Cash Flow: 75,000 - 3,500 = 71,500
    assert.equal(summary.totalIncome, 75000, "Total Income should be 75,000");
    assert.equal(summary.totalExpenses, 3500, "Total Expenses should be 3,500");
    assert.equal(summary.netCashFlow, 71500, "Net Cash Flow should be 71,500");
    assert.equal(summary.transactionCount, 2);
    console.log("  ✅ Test 4 PASSED: Financial summary calculations verified\n");

    // ----------------------------------------------------
    // Test 5: Dynamic Account Balance Updates
    // ----------------------------------------------------
    console.log("[Test 5] Dynamic Account Balance Updates via /api/accounts");
    const accountsRes = await apiRequest<{ accounts: AccountData[] }>("/accounts", { cookie: user1Cookie });
    assert.equal(accountsRes.status, 200);
    assert.ok(accountsRes.body.data?.accounts);

    const updatedBank = accountsRes.body.data.accounts.find((a) => a._id === bankId);
    const updatedCash = accountsRes.body.data.accounts.find((a) => a._id === cashId);

    // Bank: 45,000 opening + 75,000 income = 120,000
    assert.equal(updatedBank?.currentBalance, 120000, "Bank account balance should be 120,000");
    // Cash: 5,000 opening - 3,500 expense = 1,500
    assert.equal(updatedCash?.currentBalance, 1500, "Cash wallet balance should be 1,500");
    console.log("  ✅ Test 5 PASSED: Account balances updated dynamically with transactions\n");

    // ----------------------------------------------------
    // Test 6: Single Transaction Details & Update
    // ----------------------------------------------------
    console.log("[Test 6] Get single transaction and update transaction");
    const singleRes = await apiRequest<{ transaction: TransactionData }>(`/transactions/${expenseId}`, {
      cookie: user1Cookie,
    });
    assert.equal(singleRes.status, 200);
    assert.ok(singleRes.body.data?.transaction);
    assert.equal(singleRes.body.data.transaction.description, "Supermarket Groceries");

    // Update expense amount from 3,500 to 4,000
    const updateRes = await apiRequest<{ transaction: TransactionData }>(`/transactions/${expenseId}`, {
      method: "PATCH",
      cookie: user1Cookie,
      body: {
        amount: 4000,
        description: "Supermarket Groceries & Snacks",
      },
    });
    assert.equal(updateRes.status, 200);
    assert.ok(updateRes.body.data?.transaction);
    assert.equal(updateRes.body.data.transaction.amount, 4000);
    assert.equal(updateRes.body.data.transaction.description, "Supermarket Groceries & Snacks");

    // Verify recalculated cash balance: 5,000 - 4,000 = 1,000
    const postUpdateAccounts = await apiRequest<{ accounts: AccountData[] }>("/accounts", { cookie: user1Cookie });
    const cashPostUpdate = postUpdateAccounts.body.data?.accounts.find((a) => a._id === cashId);
    assert.equal(cashPostUpdate?.currentBalance, 1000, "Cash balance should update to 1,000");
    console.log("  ✅ Test 6 PASSED: Transaction update and balance recalculation verified\n");

    // ----------------------------------------------------
    // Test 7: Ownership Isolation
    // ----------------------------------------------------
    console.log("[Test 7] Cross-user ownership isolation on Transactions");
    const u2Read = await apiRequest(`/transactions/${incomeId}`, { cookie: user2Cookie });
    const u2Update = await apiRequest(`/transactions/${incomeId}`, { method: "PATCH", cookie: user2Cookie, body: { amount: 999999 } });
    const u2Delete = await apiRequest(`/transactions/${incomeId}`, { method: "DELETE", cookie: user2Cookie });

    assert.equal(u2Read.status, 404, "User 2 cannot read User 1 transaction");
    assert.equal(u2Update.status, 404, "User 2 cannot update User 1 transaction");
    assert.equal(u2Delete.status, 404, "User 2 cannot delete User 1 transaction");
    console.log("  ✅ Test 7 PASSED: Ownership strictly isolated across users\n");

    // ----------------------------------------------------
    // Test 8: Delete Transaction
    // ----------------------------------------------------
    console.log("[Test 8] Delete transaction and verify balance rollback");
    const deleteRes = await apiRequest(`/transactions/${expenseId}`, {
      method: "DELETE",
      cookie: user1Cookie,
    });
    assert.equal(deleteRes.status, 200);

    // Verify Cash Wallet balance restored back to opening balance 5,000
    const finalAccounts = await apiRequest<{ accounts: AccountData[] }>("/accounts", { cookie: user1Cookie });
    const finalCash = finalAccounts.body.data?.accounts.find((a) => a._id === cashId);
    assert.equal(finalCash?.currentBalance, 5000, "Cash balance restored back to 5,000 upon transaction deletion");

    // Verify transaction list count is now 1
    const finalList = await apiRequest<{ transactions: TransactionData[] }>("/transactions", { cookie: user1Cookie });
    assert.equal(finalList.body.data?.transactions.length, 1);
    console.log("  ✅ Test 8 PASSED: Transaction deleted and financial balance restored\n");

    console.log("==========================================================");
    console.log("  🌟 ALL 8 PHASE 9 E2E TEST SCENARIOS PASSED WITH ZERO ERRORS!");
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

runPhase9E2ETests().catch((err) => {
  console.error("❌ Phase 9 E2E test suite failed:", err);
  process.exit(1);
});
