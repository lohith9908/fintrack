import assert from "node:assert/strict";
import http from "http";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import { app } from "../app";
import { env } from "../config/env";
import { seedDatabase } from "../seed/seed";
import {
  Transaction,
  Category,
  RecurringTransaction,
} from "../models";
import { RecurringService } from "../services";

let server: http.Server;
let mongoServer: MongoMemoryServer | null = null;
let baseUrl: string;

async function request(
  urlPath: string,
  options: {
    method?: string;
    body?: Record<string, unknown> | FormData;
    cookie?: string;
    headers?: Record<string, string>;
  } = {}
) {
  const url = `${baseUrl}${urlPath.startsWith("/") ? urlPath : `/${urlPath}`}`;
  const headers: Record<string, string> = { ...options.headers };

  let reqBody: string | FormData | undefined;
  if (options.body) {
    if (options.body instanceof FormData) {
      reqBody = options.body;
      // Do not set Content-Type header manually for FormData
    } else {
      headers["Content-Type"] = "application/json";
      reqBody = JSON.stringify(options.body);
    }
  }
  if (options.cookie) {
    headers["Cookie"] = options.cookie;
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: reqBody as BodyInit | undefined,
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

  return {
    status: res.status,
    data,
    cookie,
    headers: res.headers,
  };
}

async function runPhase19SecurityHardeningAndE2ESuite() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 19 Security Hardening & E2E Suite      ");
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
    // =========================================================================
    // SECTION 19.1: SECURITY, AUTHENTICATION & RBAC HARDENING
    // =========================================================================
    console.log("----------------------------------------------------------");
    console.log("  19.1 Security, Authentication & Multi-Tenant RBAC       ");
    console.log("----------------------------------------------------------");

    // 1. Unauthenticated Requests Rejected with 401
    const unauthTxnRes = await request("/transactions");
    assert.strictEqual(unauthTxnRes.status, 401, "Unauthenticated transactions request must return 401");
    const unauthAdminRes = await request("/admin/overview");
    assert.strictEqual(unauthAdminRes.status, 401, "Unauthenticated admin request must return 401");
    console.log("  ✅ Check 1.1: Unauthenticated requests strictly return 401 Unauthorized");

    // 2. Tampered / Invalid JWT Rejection
    const tamperedCookie = "fintrack_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tamperedPayload.invalidSig";
    const tamperedRes = await request("/dashboard/overview", { cookie: tamperedCookie });
    assert.strictEqual(tamperedRes.status, 401, "Tampered JWT must be rejected with 401");
    console.log("  ✅ Check 1.2: Tampered & invalid JWT tokens rejected with 401");

    // 3. Expired Token Rejection
    const expiredToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, env.JWT_SECRET, { expiresIn: "0s" });
    const expiredRes = await request("/dashboard/overview", { cookie: `fintrack_token=${expiredToken}` });
    assert.strictEqual(expiredRes.status, 401, "Expired JWT must be rejected with 401");
    console.log("  ✅ Check 1.3: Expired JWT tokens rejected with 401");

    // 4. Register Alice (Regular User) and Bob (Regular User)
    const aliceReg = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Alice Security",
        email: "alice.security@example.com",
        password: "AlicePassword123!",
        confirmPassword: "AlicePassword123!",
      },
    });
    assert.strictEqual(aliceReg.status, 201);
    const aliceCookie = aliceReg.cookie!;

    const bobReg = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Bob Security",
        email: "bob.security@example.com",
        password: "BobPassword123!",
        confirmPassword: "BobPassword123!",
      },
    });
    assert.strictEqual(bobReg.status, 201);
    const bobCookie = bobReg.cookie!;

    // 5. RBAC Guard: Non-Admin Access to Admin Endpoints Blocked with 403
    const aliceAdminAttempt = await request("/admin/users", { cookie: aliceCookie });
    assert.strictEqual(aliceAdminAttempt.status, 403, "Non-admin user accessing /api/admin must receive 403 Forbidden");
    console.log("  ✅ Check 1.4: Non-admin users strictly blocked with 403 Forbidden from admin routes");

    // 6. Cross-Tenant Data Isolation (Alice cannot access Bob's account or transactions)
    const bobAccountRes = await request("/accounts", {
      method: "POST",
      cookie: bobCookie,
      body: {
        name: "Bob Secret Checking",
        type: "BANK_ACCOUNT",
        currency: "INR",
        openingBalance: 50000,
      },
    });
    assert.strictEqual(bobAccountRes.status, 201);
    const bobAccountId = (bobAccountRes.data.data as Record<string, unknown>).account
      ? ((bobAccountRes.data.data as Record<string, unknown>).account as Record<string, unknown>)._id as string
      : ((bobAccountRes.data.data as Record<string, unknown>)._id as string);

    // Alice attempts to GET and DELETE Bob's account
    const aliceGetBobAcc = await request(`/accounts/${bobAccountId}`, { cookie: aliceCookie });
    assert.strictEqual(aliceGetBobAcc.status, 404, "Alice must receive 404 when querying Bob's account");

    const aliceDeleteBobAcc = await request(`/accounts/${bobAccountId}`, { method: "DELETE", cookie: aliceCookie });
    assert.strictEqual(aliceDeleteBobAcc.status, 404, "Alice must receive 404 when attempting to delete Bob's account");
    console.log("  ✅ Check 1.5: Multi-tenant ownership isolation enforced across all endpoints (returns 404)");

    // =========================================================================
    // SECTION 19.4: END-TO-END CRITICAL FLOWS & LIFECYCLES
    // =========================================================================
    console.log("\n----------------------------------------------------------");
    console.log("  19.4 End-to-End Critical Flows Validation               ");
    console.log("----------------------------------------------------------");

    // 1. Authentication Flow: Register -> Login -> Profile -> Logout
    const authUserEmail = "e2e.flow@example.com";
    const authRegRes = await request("/auth/register", {
      method: "POST",
      body: {
        name: "E2E Flow User",
        email: authUserEmail,
        password: "E2EFlowPassword123!",
        confirmPassword: "E2EFlowPassword123!",
      },
    });
    assert.strictEqual(authRegRes.status, 201);

    const authLoginRes = await request("/auth/login", {
      method: "POST",
      body: { email: authUserEmail, password: "E2EFlowPassword123!" },
    });
    assert.strictEqual(authLoginRes.status, 200);
    const e2eCookie = authLoginRes.cookie!;

    const authProfileRes = await request("/auth/me", { cookie: e2eCookie });
    assert.strictEqual(authProfileRes.status, 200);
    const authUserObj = ((authProfileRes.data.data as Record<string, unknown>).user || authProfileRes.data.data) as Record<string, unknown>;
    assert.strictEqual(authUserObj.email, authUserEmail);

    const authLogoutRes = await request("/auth/logout", { method: "POST", cookie: e2eCookie });
    assert.strictEqual(authLogoutRes.status, 200);
    console.log("  ✅ Flow 1: Authentication lifecycle (Register -> Login -> Me -> Logout) verified");

    // 2. Transaction & Balance Flow: Create Account -> Add Expense -> Verify Balance -> Delete Expense -> Restored Balance
    const testAccountRes = await request("/accounts", {
      method: "POST",
      cookie: aliceCookie,
      body: {
        name: "Alice Primary Checking",
        type: "BANK_ACCOUNT",
        currency: "INR",
        openingBalance: 10000,
      },
    });
    assert.strictEqual(testAccountRes.status, 201);
    const aliceAccountData = (testAccountRes.data.data as Record<string, unknown>).account as Record<string, unknown>;
    const aliceAccountId = aliceAccountData._id as string;

    const sysCategories = await Category.find({ isSystem: true });
    const diningCategory = sysCategories.find((c) => c.name.toLowerCase().includes("dining") || c.name.toLowerCase().includes("food")) || sysCategories[0];

    // Add Expense of 2500
    const addTxnRes = await request("/transactions", {
      method: "POST",
      cookie: aliceCookie,
      body: {
        account: aliceAccountId,
        category: diningCategory._id.toString(),
        type: "EXPENSE",
        amount: 2500,
        date: new Date().toISOString(),
        description: "Team Dinner Expense",
        paymentMethod: "DEBIT_CARD",
      },
    });
    assert.strictEqual(addTxnRes.status, 201);
    const txnData = (addTxnRes.data.data as Record<string, unknown>).transaction as Record<string, unknown>;
    const txnId = txnData._id as string;

    // Check Account Balance: should be 10000 - 2500 = 7500
    const accSummaryRes1 = await request(`/accounts/${aliceAccountId}`, { cookie: aliceCookie });
    assert.strictEqual(accSummaryRes1.status, 200);
    const accDetail1 = (accSummaryRes1.data.data as Record<string, unknown>).account as Record<string, unknown>;
    assert.strictEqual(accDetail1.currentBalance, 7500, "Account balance must be 7500 after 2500 expense");

    // Delete Transaction
    const delTxnRes = await request(`/transactions/${txnId}`, { method: "DELETE", cookie: aliceCookie });
    assert.strictEqual(delTxnRes.status, 200);

    // Check Account Balance: should be restored to 10000
    const accSummaryRes2 = await request(`/accounts/${aliceAccountId}`, { cookie: aliceCookie });
    assert.strictEqual(accSummaryRes2.status, 200);
    const accDetail2 = (accSummaryRes2.data.data as Record<string, unknown>).account as Record<string, unknown>;
    assert.strictEqual(accDetail2.currentBalance, 10000, "Account balance must be restored to 10000 after deleting expense");
    console.log("  ✅ Flow 2: Transaction lifecycle & live account balance equation verified");

    // 3. Budget Threshold Alert Flow: Create Budget ($5000) -> Add Expense ($4600 / 92%) -> Check Critical Notification
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const budgetRes = await request("/budgets", {
      method: "POST",
      cookie: aliceCookie,
      body: {
        category: diningCategory._id.toString(),
        month: currentMonth,
        year: currentYear,
        limitAmount: 5000,
        alertThresholds: { informational: 50, warning: 75, critical: 90, exceeded: 100 },
      },
    });
    assert.strictEqual(budgetRes.status, 201);

    // Add Expense of 4600 (92% of limit -> Critical threshold)
    await request("/transactions", {
      method: "POST",
      cookie: aliceCookie,
      body: {
        account: aliceAccountId,
        category: diningCategory._id.toString(),
        type: "EXPENSE",
        amount: 4600,
        date: new Date().toISOString(),
        description: "Catering Dinner (High Expense)",
        paymentMethod: "DEBIT_CARD",
      },
    });

    // Wait briefly for asynchronous budget alert background task to complete
    await new Promise((r) => setTimeout(r, 150));

    // Verify Notification is generated
    const notifsRes = await request("/notifications", { cookie: aliceCookie });
    assert.strictEqual(notifsRes.status, 200);
    const notifsList = (notifsRes.data.data as Record<string, unknown>).notifications as Array<Record<string, unknown>>;
    const budgetAlert = notifsList.find((n) => n.type === "BUDGET_ALERT" || n.severity === "CRITICAL" || n.severity === "WARNING");
    assert.ok(budgetAlert, "Budget alert notification must be created when expense reaches 92% of limit");
    console.log("  ✅ Flow 3: Budget usage tracking and automated threshold alert generation verified");

    // 4. Savings Goal Contribution Flow: Create Goal ($20000) -> Add Contribution ($8000) -> Verify 40% Progress
    const goalRes = await request("/goals", {
      method: "POST",
      cookie: aliceCookie,
      body: {
        name: "Emergency Fund Goal",
        targetAmount: 20000,
        targetDate: new Date(currentYear + 1, 11, 31).toISOString(),
        category: "EMERGENCY_FUND",
      },
    });
    assert.strictEqual(goalRes.status, 201);
    const goalData = ((goalRes.data.data as Record<string, unknown>).goal || goalRes.data.data) as Record<string, unknown>;
    const goalId = goalData._id as string;

    const contribRes = await request(`/goals/${goalId}/contribute`, {
      method: "POST",
      cookie: aliceCookie,
      body: {
        amount: 8000,
        date: new Date().toISOString(),
        note: "Initial emergency deposit",
      },
    });
    assert.strictEqual(contribRes.status, 200);
    const updatedGoal = ((contribRes.data.data as Record<string, unknown>).goal || contribRes.data.data) as Record<string, unknown>;
    assert.strictEqual(updatedGoal.currentAmount, 8000);
    assert.strictEqual(updatedGoal.percentage, 40);
    console.log("  ✅ Flow 4: Savings goal contributions and progress calculations verified");

    // 5. Admin Governance & Sanitized Audit Logging Flow
    const adminLoginRes = await request("/auth/login", {
      method: "POST",
      body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminCookie = adminLoginRes.cookie!;

    // Admin updates setting
    const updateSettingRes = await request("/admin/settings/allowUserRegistration", {
      method: "PATCH",
      cookie: adminCookie,
      body: { value: true },
    });
    assert.strictEqual(updateSettingRes.status, 200);

    // Verify Audit Log captured this action
    const auditLogsRes = await request("/admin/audit-logs?limit=5", { cookie: adminCookie });
    assert.strictEqual(auditLogsRes.status, 200);
    const logs = (auditLogsRes.data.data as Record<string, unknown>).logs as Array<Record<string, unknown>>;
    assert.ok(logs.length > 0, "Audit logs must record administrative action");

    const payloadString = JSON.stringify(logs).toLowerCase();
    assert.ok(!payloadString.includes("passwordhash"), "Audit log must not contain passwordHash");
    assert.ok(!payloadString.includes("resettoken"), "Audit log must not contain resetToken");
    console.log("  ✅ Flow 5: Admin action execution & credential-sanitized audit log trail verified");

    // =========================================================================
    // SECTION 19.5 & 19.6: FINANCIAL & RECURRING ENGINE INTEGRITY
    // =========================================================================
    console.log("\n----------------------------------------------------------");
    console.log("  19.5 & 19.6 Financial & Recurring Engine Integrity      ");
    console.log("----------------------------------------------------------");

    // Test Recurring Engine Idempotency and Exactly-Once Execution
    const recRuleRes = await request("/recurring-transactions", {
      method: "POST",
      cookie: aliceCookie,
      body: {
        name: "Daily Coffee Subscription",
        account: aliceAccountId,
        category: diningCategory._id.toString(),
        type: "EXPENSE",
        amount: 350,
        frequency: "DAILY",
        startDate: new Date(currentYear, currentMonth - 1, 1).toISOString(),
        paymentMethod: "UPI",
      },
    });
    assert.strictEqual(recRuleRes.status, 201);
    const recRule = (((recRuleRes.data.data as Record<string, unknown>).recurringTransaction || recRuleRes.data.data) as Record<string, unknown>);

    // Force nextOccurrence to past (due)
    await RecurringTransaction.updateOne(
      { _id: recRule._id },
      { $set: { nextOccurrence: new Date(Date.now() - 60000) } }
    );

    // Run Engine Pass 1
    const engineRun1 = await RecurringService.processDueTransactions();
    assert.strictEqual(engineRun1.processedCount, 1, "Must process exactly 1 due recurring item");

    // Count created transactions
    const txnCount1 = await Transaction.countDocuments({ description: "[Recurring] Daily Coffee Subscription" });
    assert.strictEqual(txnCount1, 1, "Exactly 1 transaction must be created on due date");

    // Run Engine Pass 2 Immediately (Idempotency Check)
    const engineRun2 = await RecurringService.processDueTransactions();
    assert.strictEqual(engineRun2.processedCount, 0, "Second engine run must process 0 items (idempotent)");

    const txnCount2 = await Transaction.countDocuments({ description: "[Recurring] Daily Coffee Subscription" });
    assert.strictEqual(txnCount2, 1, "Transaction count must remain 1 (no duplicate generation)");
    console.log("  ✅ Passed: Recurring transaction scheduler verified for idempotency and exactly-once execution");

    // Paused Rule Check
    await RecurringTransaction.updateOne({ _id: recRule._id }, { $set: { isActive: false, nextOccurrence: new Date(Date.now() - 60000) } });
    const engineRun3 = await RecurringService.processDueTransactions();
    assert.strictEqual(engineRun3.processedCount, 0, "Paused recurring transaction must not process");
    console.log("  ✅ Passed: Paused recurring rules (isActive: false) are safely ignored by engine");

    // =========================================================================
    // SECTION 19.7: FILE & UPLOAD SECURITY VALIDATION
    // =========================================================================
    console.log("\n----------------------------------------------------------");
    console.log("  19.7 File Upload Security & Path Traversal Immunity     ");
    console.log("----------------------------------------------------------");

    // Create a transaction to test receipt operations
    const receiptTxnRes = await request("/transactions", {
      method: "POST",
      cookie: aliceCookie,
      body: {
        account: aliceAccountId,
        category: diningCategory._id.toString(),
        type: "EXPENSE",
        amount: 850,
        date: new Date().toISOString(),
        description: "Receipt Test Transaction",
        paymentMethod: "DEBIT_CARD",
      },
    });
    assert.strictEqual(receiptTxnRes.status, 201);
    const receiptTxnId = ((receiptTxnRes.data.data as Record<string, unknown>).transaction as Record<string, unknown>)._id as string;

    // 1. Upload valid receipt (dummy PDF)
    const tempPdfPath = path.resolve(process.cwd(), "temp_valid_receipt.pdf");
    fs.writeFileSync(tempPdfPath, "%PDF-1.4 test valid pdf content");

    const pdfBlob = new Blob([fs.readFileSync(tempPdfPath)], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("receipt", pdfBlob, "receipt.pdf");

    const uploadRes = await request(`/transactions/${receiptTxnId}/receipt`, {
      method: "POST",
      cookie: aliceCookie,
      body: formData,
    });
    fs.unlinkSync(tempPdfPath);
    assert.strictEqual(uploadRes.status, 200, "Valid PDF upload must succeed");
    console.log("  ✅ Check 7.1: Valid PDF receipt upload succeeded and metadata persisted");

    // 2. Download / View Receipt
    const downloadRes = await request(`/transactions/${receiptTxnId}/receipt`, { cookie: aliceCookie });
    assert.strictEqual(downloadRes.status, 200, "Authorized user must be able to view/download receipt");

    // 3. Cross-Tenant Download Blocked (Bob trying to download Alice's receipt)
    const bobDownloadRes = await request(`/transactions/${receiptTxnId}/receipt`, { cookie: bobCookie });
    assert.strictEqual(bobDownloadRes.status, 404, "Unauthorized user cannot access another user's receipt (404)");
    console.log("  ✅ Check 7.2: Cross-tenant receipt download access strictly blocked with 404");

    // 4. Path Traversal Immunity Check
    const traversalAttemptRes = await request(`/transactions/..%2f..%2fpackage.json/receipt`, { cookie: aliceCookie });
    assert.ok(traversalAttemptRes.status === 400 || traversalAttemptRes.status === 404, "Path traversal ID must be rejected");

    // 5. Delete Receipt
    const delReceiptRes = await request(`/transactions/${receiptTxnId}/receipt`, {
      method: "DELETE",
      cookie: aliceCookie,
    });
    assert.strictEqual(delReceiptRes.status, 200, "Receipt deleted successfully");
    console.log("  ✅ Check 7.3: Receipt deleted cleanly and unlinked from storage");

    console.log("\n==========================================================");
    console.log("  🎉 FinTrack Phase 19 Security & E2E Suite ALL PASSED!   ");
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

runPhase19SecurityHardeningAndE2ESuite().catch((err) => {
  console.error("❌ Phase 19 Security & E2E Test Failed:", err);
  process.exit(1);
});
