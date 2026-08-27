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

interface AccountData {
  _id: string;
  name: string;
  type: string;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  status: string;
  notes?: string;
}

interface AccountsSummary {
  totalNetWorth: number;
  totalBankBalance: number;
  totalCashUpiBalance: number;
  totalCreditLiabilities: number;
  activeAccountsCount: number;
  archivedAccountsCount: number;
}

interface CategoryData {
  _id: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
}

async function runPhase8E2ETests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 8 Accounts & Categories E2E Test Suite ");
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
      console.log("ℹ️ Local MongoDB unreachable. Starting isolated MongoMemoryServer for Phase 8 tests...");
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✓ Isolated MongoMemoryServer connected at: ${memoryUri}`);
    }

    // 2. Ensure Database Seeded (System categories)
    await seedDatabase();

    // 3. Start Test Server
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
    // Step 1: Create 2 Test Users for Ownership Isolation
    // ----------------------------------------------------
    console.log("[Setup] Registering User 1 and User 2 for ownership verification...");
    const user1Email = `user1_${Date.now()}@example.com`;
    const user2Email = `user2_${Date.now()}@example.com`;

    const u1Reg = await apiRequest<{ user: { _id: string; email: string } }>("/auth/register", {
      method: "POST",
      body: { name: "User One", email: user1Email, password: "Password123!", confirmPassword: "Password123!" },
    });
    assert.ok(u1Reg.cookie, "User 1 cookie must be returned");
    const user1Cookie = u1Reg.cookie;

    const u2Reg = await apiRequest<{ user: { _id: string; email: string } }>("/auth/register", {
      method: "POST",
      body: { name: "User Two", email: user2Email, password: "Password123!", confirmPassword: "Password123!" },
    });
    assert.ok(u2Reg.cookie, "User 2 cookie must be returned");
    const user2Cookie = u2Reg.cookie;
    console.log("  ✓ User 1 and User 2 sessions initialized.\n");

    // ----------------------------------------------------
    // Step 2: Unauthenticated Access Guard Check
    // ----------------------------------------------------
    console.log("[Test 1] Unauthenticated requests to /api/accounts and /api/categories");
    const unauthAcc = await apiRequest("/accounts");
    const unauthCat = await apiRequest("/categories");
    assert.equal(unauthAcc.status, 401, "/accounts requires auth");
    assert.equal(unauthCat.status, 401, "/categories requires auth");
    console.log("  ✅ Test 1 PASSED: Unauthenticated access rejected with 401\n");

    // ----------------------------------------------------
    // Step 3: Account Creation & Validation
    // ----------------------------------------------------
    console.log("[Test 2] Create multiple account types (Bank, Cash, UPI, Credit Card)");
    // 1. Bank Account
    const bankRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        name: "HDFC Salary Account",
        type: "BANK_ACCOUNT",
        openingBalance: 45000,
        currency: "INR",
        notes: "Main primary account",
      },
    });
    assert.equal(bankRes.status, 201, "Bank account creation must return 201");
    assert.ok(bankRes.body.data?.account);
    assert.equal(bankRes.body.data.account.name, "HDFC Salary Account");
    assert.equal(bankRes.body.data.account.openingBalance, 45000);
    const bankId = bankRes.body.data.account._id;

    // 2. Cash Wallet
    const cashRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        name: "Cash Wallet",
        type: "CASH",
        openingBalance: 5000,
      },
    });
    assert.equal(cashRes.status, 201);
    assert.ok(cashRes.body.data?.account);
    const cashId = cashRes.body.data.account._id;

    // 3. UPI Wallet
    const upiRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        name: "Google Pay UPI",
        type: "UPI",
        openingBalance: 12000,
      },
    });
    assert.equal(upiRes.status, 201);
    assert.ok(upiRes.body.data?.account);
    const upiId = upiRes.body.data.account._id;

    // 4. Credit Card
    const ccRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        name: "ICICI Amazon Credit Card",
        type: "CREDIT_CARD",
        openingBalance: 7500, // Outstanding balance
        notes: "Monthly statement on 15th",
      },
    });
    assert.equal(ccRes.status, 201);
    assert.ok(ccRes.body.data?.account);
    console.log("  ✅ Test 2 PASSED: 4 accounts created successfully across all supported types\n");

    // ----------------------------------------------------
    // Step 4: Duplicate Account Name Collision
    // ----------------------------------------------------
    console.log("[Test 3] Duplicate account name collision rejection (case-insensitive)");
    const duplicateRes = await apiRequest("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        name: "hdfc salary account", // duplicate with different casing
        type: "BANK_ACCOUNT",
        openingBalance: 1000,
      },
    });
    assert.equal(duplicateRes.status, 409, "Duplicate account name should return 409 Conflict");
    console.log("  ✅ Test 3 PASSED: Duplicate account name rejected with 409 Conflict\n");

    // ----------------------------------------------------
    // Step 5: Get Accounts & Summary Calculation
    // ----------------------------------------------------
    console.log("[Test 4] Get accounts and verify calculated summary statistics");
    const listRes = await apiRequest<{ accounts: AccountData[]; summary: AccountsSummary }>("/accounts", {
      cookie: user1Cookie,
    });
    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.data?.accounts);
    assert.equal(listRes.body.data.accounts.length, 4);

    const summary = listRes.body.data.summary;
    // Assets: Bank (45,000) + Cash (5,000) + UPI (12,000) = 62,000
    // Liabilities: CC (7,500)
    // Net Worth: 62,000 - 7,500 = 54,500
    assert.equal(summary.totalBankBalance, 45000, "Bank balance should equal 45000");
    assert.equal(summary.totalCashUpiBalance, 17000, "Cash & UPI should equal 17000");
    assert.equal(summary.totalCreditLiabilities, 7500, "Credit liabilities should equal 7500");
    assert.equal(summary.totalNetWorth, 54500, "Net worth should equal 54500");
    assert.equal(summary.activeAccountsCount, 4);
    console.log("  ✅ Test 4 PASSED: Account balances and financial summary verified\n");

    // ----------------------------------------------------
    // Step 6: Get Single Account & Update Account
    // ----------------------------------------------------
    console.log("[Test 5] Get single account and update account details");
    const singleRes = await apiRequest<{ account: AccountData }>(`/accounts/${bankId}`, {
      cookie: user1Cookie,
    });
    assert.equal(singleRes.status, 200);
    assert.ok(singleRes.body.data?.account);
    assert.equal(singleRes.body.data.account.name, "HDFC Salary Account");

    const updateRes = await apiRequest<{ account: AccountData }>(`/accounts/${bankId}`, {
      method: "PATCH",
      cookie: user1Cookie,
      body: {
        name: "HDFC Premium Salary Account",
        notes: "Updated corporate payroll account",
      },
    });
    assert.equal(updateRes.status, 200);
    assert.ok(updateRes.body.data?.account);
    assert.equal(updateRes.body.data.account.name, "HDFC Premium Salary Account");
    assert.equal(updateRes.body.data.account.notes, "Updated corporate payroll account");
    console.log("  ✅ Test 5 PASSED: Single account retrieval and update verified\n");

    // ----------------------------------------------------
    // Step 7: Deactivate & Delete Account
    // ----------------------------------------------------
    console.log("[Test 6] Deactivate/Archive and delete account");
    const deactRes = await apiRequest<{ account: AccountData }>(`/accounts/${cashId}/deactivate`, {
      method: "POST",
      cookie: user1Cookie,
      body: { archive: true },
    });
    assert.equal(deactRes.status, 200);
    assert.ok(deactRes.body.data?.account);
    assert.equal(deactRes.body.data.account.status, "ARCHIVED");

    const deleteRes = await apiRequest(`/accounts/${upiId}`, {
      method: "DELETE",
      cookie: user1Cookie,
    });
    assert.equal(deleteRes.status, 200);

    const postDeleteCheck = await apiRequest(`/accounts/${upiId}`, {
      cookie: user1Cookie,
    });
    assert.equal(postDeleteCheck.status, 404, "Deleted account should not be found");
    console.log("  ✅ Test 6 PASSED: Account deactivation and deletion verified\n");

    // ----------------------------------------------------
    // Step 8: Ownership Isolation on Accounts
    // ----------------------------------------------------
    console.log("[Test 7] Cross-user ownership isolation on Accounts");
    const u2Read = await apiRequest(`/accounts/${bankId}`, { cookie: user2Cookie });
    const u2Update = await apiRequest(`/accounts/${bankId}`, { method: "PATCH", cookie: user2Cookie, body: { name: "Hacked" } });
    const u2Delete = await apiRequest(`/accounts/${bankId}`, { method: "DELETE", cookie: user2Cookie });

    assert.equal(u2Read.status, 404, "User 2 cannot read User 1 account");
    assert.equal(u2Update.status, 404, "User 2 cannot update User 1 account");
    assert.equal(u2Delete.status, 404, "User 2 cannot delete User 1 account");
    console.log("  ✅ Test 7 PASSED: User 2 cannot access or mutate User 1 accounts\n");

    // ----------------------------------------------------
    // Step 9: Categories Retrieval (System Categories)
    // ----------------------------------------------------
    console.log("[Test 8] Retrieve System Categories");
    const catListRes = await apiRequest<{ categories: CategoryData[] }>("/categories", {
      cookie: user1Cookie,
    });
    assert.equal(catListRes.status, 200);
    assert.ok(catListRes.body.data?.categories);
    assert.ok(catListRes.body.data.categories.length >= 13, "Should have 13 system categories");

    const foodCat = catListRes.body.data.categories.find((c) => c.name === "Food");
    assert.ok(foodCat, "Food system category must exist");
    assert.equal(foodCat.isSystem, true);
    assert.equal(foodCat.type, "EXPENSE");
    console.log("  ✅ Test 8 PASSED: System categories retrieved and verified\n");

    // ----------------------------------------------------
    // Step 10: Create Custom Categories
    // ----------------------------------------------------
    console.log("[Test 9] Create custom income and expense categories");
    const customIncome = await apiRequest<{ category: CategoryData }>("/categories", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        name: "Crypto Staking",
        type: "INCOME",
        icon: "Coins",
        color: "#8B5CF6",
      },
    });
    assert.equal(customIncome.status, 201);
    assert.ok(customIncome.body.data?.category);
    assert.equal(customIncome.body.data.category.name, "Crypto Staking");
    assert.equal(customIncome.body.data.category.isSystem, false);
    const customIncomeId = customIncome.body.data.category._id;

    const customExpense = await apiRequest<{ category: CategoryData }>("/categories", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        name: "Pet Supplies",
        type: "EXPENSE",
        icon: "Dog",
        color: "#F59E0B",
      },
    });
    assert.equal(customExpense.status, 201);
    assert.ok(customExpense.body.data?.category);
    const customExpenseId = customExpense.body.data.category._id;
    console.log("  ✅ Test 9 PASSED: Custom income and expense categories created\n");

    // ----------------------------------------------------
    // Step 11: Category Duplicate Collision
    // ----------------------------------------------------
    console.log("[Test 10] Category collision rejection against system categories");
    const dupSystemCat = await apiRequest("/categories", {
      method: "POST",
      cookie: user1Cookie,
      body: {
        name: "food", // duplicate system category
        type: "EXPENSE",
      },
    });
    assert.equal(dupSystemCat.status, 409, "Duplicate category name should return 409");
    console.log("  ✅ Test 10 PASSED: Category collision rejection against system categories verified\n");

    // ----------------------------------------------------
    // Step 12: Protect System Categories from Modification/Deletion
    // ----------------------------------------------------
    console.log("[Test 11] Protect system categories from modification and deletion");
    const modSystemCat = await apiRequest(`/categories/${foodCat._id}`, {
      method: "PATCH",
      cookie: user1Cookie,
      body: { name: "Fast Food" },
    });
    assert.equal(modSystemCat.status, 403, "Modifying system category must return 403 Forbidden");

    const delSystemCat = await apiRequest(`/categories/${foodCat._id}`, {
      method: "DELETE",
      cookie: user1Cookie,
    });
    assert.equal(delSystemCat.status, 403, "Deleting system category must return 403 Forbidden");
    console.log("  ✅ Test 11 PASSED: System categories strictly protected (403 Forbidden)\n");

    // ----------------------------------------------------
    // Step 13: Update and Delete Custom Categories
    // ----------------------------------------------------
    console.log("[Test 12] Update and delete custom categories with ownership isolation");
    // User 2 cannot modify User 1's custom category
    const u2CatMod = await apiRequest(`/categories/${customIncomeId}`, {
      method: "PATCH",
      cookie: user2Cookie,
      body: { name: "Hacked Category" },
    });
    assert.equal(u2CatMod.status, 403, "User 2 cannot modify User 1 custom category");

    // User 1 updates own custom category
    const u1CatMod = await apiRequest<{ category: CategoryData }>(`/categories/${customIncomeId}`, {
      method: "PATCH",
      cookie: user1Cookie,
      body: { name: "DeFi & Staking Rewards", color: "#6366F1" },
    });
    assert.equal(u1CatMod.status, 200);
    assert.ok(u1CatMod.body.data?.category);
    assert.equal(u1CatMod.body.data.category.name, "DeFi & Staking Rewards");

    // User 1 deletes custom category
    const u1CatDel = await apiRequest(`/categories/${customExpenseId}`, {
      method: "DELETE",
      cookie: user1Cookie,
    });
    assert.equal(u1CatDel.status, 200);
    console.log("  ✅ Test 12 PASSED: Custom category update and deletion verified\n");

    console.log("==========================================================");
    console.log("  🌟 ALL 12 PHASE 8 E2E TEST SCENARIOS PASSED WITH ZERO ERRORS!");
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

runPhase8E2ETests().catch((err) => {
  console.error("❌ Phase 8 E2E test suite failed:", err);
  process.exit(1);
});
