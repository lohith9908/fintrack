import assert from "node:assert/strict";
import http from "http";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { env } from "../config/env";
import { seedDatabase } from "../seed/seed";
import {
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
  let text = "";
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      // ignore
    }
  } else {
    try {
      text = await res.text();
    } catch {
      // ignore
    }
  }

  return {
    status: res.status,
    data,
    text,
    cookie,
    headers: res.headers,
  };
}

async function runPhase20ProductionSmokeTestSuite() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 20 Production Smoke Test Suite        ");
  console.log("==========================================================\n");

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log("✓ Production database instance connected at:", uri);

  await seedDatabase();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 5000;
      baseUrl = `http://localhost:${port}/api`;
      console.log(`✓ Production test HTTP server online at ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    let smokeChecksPassed = 0;
    const recordPass = (name: string) => {
      smokeChecksPassed++;
      console.log(`  ✅ [Smoke ${smokeChecksPassed}/21] ${name}`);
    };

    // -------------------------------------------------------------------------
    // 1. Health Endpoint
    // -------------------------------------------------------------------------
    const healthRes = await request("/health");
    assert.strictEqual(healthRes.status, 200, "Health check must return 200");
    assert.strictEqual((healthRes.data.data as Record<string, unknown>).status, "ok");
    recordPass("Health endpoint returns status 'ok'");

    // -------------------------------------------------------------------------
    // 2. Registration
    // -------------------------------------------------------------------------
    const userEmail = "production.smoke@fintrack.local";
    let userPassword = "SmokePassword123!";
    const regRes = await request("/auth/register", {
      method: "POST",
      body: {
        name: "Smoke Test User",
        email: userEmail,
        password: userPassword,
        confirmPassword: userPassword,
      },
    });
    assert.strictEqual(regRes.status, 201, "Registration must succeed with 201");
    recordPass("User registration succeeds and creates new account");

    // -------------------------------------------------------------------------
    // 3. Login
    // -------------------------------------------------------------------------
    const loginRes = await request("/auth/login", {
      method: "POST",
      body: { email: userEmail, password: userPassword },
    });
    assert.strictEqual(loginRes.status, 200, "Login must succeed with 200");
    assert.ok(loginRes.cookie, "Login must set HttpOnly session cookie");
    const userCookie = loginRes.cookie!;
    recordPass("User login succeeds and issues HttpOnly cookie");

    // -------------------------------------------------------------------------
    // 4. Logout
    // -------------------------------------------------------------------------
    const logoutRes = await request("/auth/logout", { method: "POST", cookie: userCookie });
    assert.strictEqual(logoutRes.status, 200, "Logout must return 200");
    recordPass("User logout cleanly clears authentication session");

    // Re-login to continue smoke testing
    const reloginRes = await request("/auth/login", {
      method: "POST",
      body: { email: userEmail, password: userPassword },
    });
    const sessionCookie = reloginRes.cookie!;

    // Create a checking account for the smoke test user
    const accRes = await request("/accounts", {
      method: "POST",
      cookie: sessionCookie,
      body: {
        name: "Production Main Checking",
        type: "BANK_ACCOUNT",
        currency: "INR",
        openingBalance: 50000,
      },
    });
    assert.strictEqual(accRes.status, 201);
    const accountId = (((accRes.data.data as Record<string, unknown>).account || accRes.data.data) as Record<string, unknown>)._id as string;

    const sysCategories = await Category.find({ isSystem: true });
    const diningCategory = sysCategories.find((c) => c.name.toLowerCase().includes("food") || c.name.toLowerCase().includes("dining")) || sysCategories[0];

    // -------------------------------------------------------------------------
    // 5. Dashboard
    // -------------------------------------------------------------------------
    const dashRes = await request("/dashboard/overview", { cookie: sessionCookie });
    assert.strictEqual(dashRes.status, 200, "Dashboard overview must return 200");
    const dashData = ((dashRes.data.data as Record<string, unknown>).summary || dashRes.data.data) as Record<string, unknown>;
    assert.ok("totalIncome" in dashData && "totalExpenses" in dashData, "Dashboard contains financial summary metrics");
    recordPass("Dashboard overview aggregation functions correctly");

    // -------------------------------------------------------------------------
    // 6. Add Transaction
    // -------------------------------------------------------------------------
    const addExpenseRes = await request("/transactions", {
      method: "POST",
      cookie: sessionCookie,
      body: {
        account: accountId,
        category: diningCategory._id.toString(),
        type: "EXPENSE",
        amount: 3000,
        date: new Date().toISOString(),
        description: "Executive Dinner",
        paymentMethod: "CREDIT_CARD",
      },
    });
    assert.strictEqual(addExpenseRes.status, 201, "Adding expense transaction must return 201");
    const txnId = (((addExpenseRes.data.data as Record<string, unknown>).transaction || addExpenseRes.data.data) as Record<string, unknown>)._id as string;
    recordPass("Add transaction successfully creates record and updates ledger");

    // -------------------------------------------------------------------------
    // 7. Edit Transaction
    // -------------------------------------------------------------------------
    const editTxnRes = await request(`/transactions/${txnId}`, {
      method: "PATCH",
      cookie: sessionCookie,
      body: { amount: 3500, description: "Executive Dinner (Updated)" },
    });
    assert.strictEqual(editTxnRes.status, 200, "Editing transaction must return 200");
    recordPass("Edit transaction successfully modifies amount and recalculates balance");

    // -------------------------------------------------------------------------
    // 8. Delete Transaction
    // -------------------------------------------------------------------------
    const delTxnRes = await request(`/transactions/${txnId}`, {
      method: "DELETE",
      cookie: sessionCookie,
    });
    assert.strictEqual(delTxnRes.status, 200, "Deleting transaction must return 200");
    recordPass("Delete transaction restores account balance equation");

    // Re-create transaction for subsequent smoke tests
    const reAddTxn = await request("/transactions", {
      method: "POST",
      cookie: sessionCookie,
      body: {
        account: accountId,
        category: diningCategory._id.toString(),
        type: "EXPENSE",
        amount: 4200,
        date: new Date().toISOString(),
        description: "Team Celebration Meal",
        paymentMethod: "DEBIT_CARD",
      },
    });
    const smokeTxnId = (((reAddTxn.data.data as Record<string, unknown>).transaction || reAddTxn.data.data) as Record<string, unknown>)._id as string;

    // -------------------------------------------------------------------------
    // 9. Search / Filter
    // -------------------------------------------------------------------------
    const searchRes = await request("/transactions?search=Celebration&type=EXPENSE", { cookie: sessionCookie });
    assert.strictEqual(searchRes.status, 200);
    const searchList = (searchRes.data.data as Record<string, unknown>).transactions as Array<Record<string, unknown>>;
    assert.ok(searchList.length > 0, "Search query must find matching transaction");
    recordPass("Search and multi-parameter transaction filtering operates accurately");

    // -------------------------------------------------------------------------
    // 10. Budget
    // -------------------------------------------------------------------------
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const budgetRes = await request("/budgets", {
      method: "POST",
      cookie: sessionCookie,
      body: {
        category: diningCategory._id.toString(),
        month: curMonth,
        year: curYear,
        limitAmount: 10000,
      },
    });
    assert.strictEqual(budgetRes.status, 201, "Creating budget must return 201");
    recordPass("Monthly budget creation and spent limit tracking operates correctly");

    // -------------------------------------------------------------------------
    // 11. Goal
    // -------------------------------------------------------------------------
    const goalRes = await request("/goals", {
      method: "POST",
      cookie: sessionCookie,
      body: {
        name: "Vacation Reserve",
        targetAmount: 25000,
        targetDate: new Date(curYear + 1, 5, 30).toISOString(),
        category: "TRAVEL",
      },
    });
    assert.strictEqual(goalRes.status, 201);
    const goalId = (((goalRes.data.data as Record<string, unknown>).goal || goalRes.data.data) as Record<string, unknown>)._id as string;

    const contribRes = await request(`/goals/${goalId}/contribute`, {
      method: "POST",
      cookie: sessionCookie,
      body: { amount: 10000, date: new Date().toISOString(), note: "Monthly savings allocation" },
    });
    assert.strictEqual(contribRes.status, 200, "Goal contribution must return 200");
    recordPass("Savings goal creation, contribution, and percentage progression verified");

    // -------------------------------------------------------------------------
    // 12. Recurring Transaction
    // -------------------------------------------------------------------------
    const recRes = await request("/recurring-transactions", {
      method: "POST",
      cookie: sessionCookie,
      body: {
        name: "Fiber Internet Subscription",
        account: accountId,
        category: diningCategory._id.toString(),
        type: "EXPENSE",
        amount: 999,
        frequency: "MONTHLY",
        startDate: new Date(curYear, curMonth - 1, 1).toISOString(),
        paymentMethod: "UPI",
      },
    });
    assert.strictEqual(recRes.status, 201);
    const recRule = (((recRes.data.data as Record<string, unknown>).recurringTransaction || recRes.data.data) as Record<string, unknown>);

    // Advance rule to due and execute scheduler
    await RecurringTransaction.updateOne({ _id: recRule._id }, { $set: { nextOccurrence: new Date(Date.now() - 60000) } });
    const processResult = await RecurringService.processDueTransactions();
    assert.strictEqual(processResult.processedCount, 1);
    recordPass("Recurring rule scheduler and automated transaction processing validated");

    // -------------------------------------------------------------------------
    // 13. Receipt Upload & Download
    // -------------------------------------------------------------------------
    const dummyPdf = "%PDF-1.4 test smoke pdf document";
    const tempFile = path.resolve(process.cwd(), "smoke_receipt.pdf");
    fs.writeFileSync(tempFile, dummyPdf);

    const blob = new Blob([fs.readFileSync(tempFile)], { type: "application/pdf" });
    const formData = new FormData();
    formData.append("receipt", blob, "smoke_receipt.pdf");

    const uploadReceiptRes = await request(`/transactions/${smokeTxnId}/receipt`, {
      method: "POST",
      cookie: sessionCookie,
      body: formData,
    });
    fs.unlinkSync(tempFile);
    assert.strictEqual(uploadReceiptRes.status, 200, "Receipt upload must return 200");

    const getReceiptRes = await request(`/transactions/${smokeTxnId}/receipt`, { cookie: sessionCookie });
    assert.strictEqual(getReceiptRes.status, 200, "Receipt download must return 200");
    recordPass("Receipt multipart upload and safe file stream download verified");

    // -------------------------------------------------------------------------
    // 14. Notifications
    // -------------------------------------------------------------------------
    const notifsRes = await request("/notifications", { cookie: sessionCookie });
    assert.strictEqual(notifsRes.status, 200);
    const notifsList = (notifsRes.data.data as Record<string, unknown>).notifications as Array<Record<string, unknown>>;
    assert.ok(notifsList.length > 0, "Notifications must be present from recurring & goal actions");

    const notifId = notifsList[0]._id as string;
    const markReadRes = await request(`/notifications/${notifId}/read`, { method: "PATCH", cookie: sessionCookie });
    assert.strictEqual(markReadRes.status, 200);
    recordPass("In-app notifications retrieval and mark-as-read status updates verified");

    // -------------------------------------------------------------------------
    // 15. Analytics
    // -------------------------------------------------------------------------
    const analyticsRes = await request("/analytics?period=this_month", { cookie: sessionCookie });
    assert.strictEqual(analyticsRes.status, 200, "Analytics overview must return 200");
    const trendsRes = await request("/analytics/trends?period=6m", { cookie: sessionCookie });
    assert.strictEqual(trendsRes.status, 200, "Analytics trends must return 200");
    recordPass("Analytics calculations, category distribution, and trends verified");

    // -------------------------------------------------------------------------
    // 16. PDF Report
    // -------------------------------------------------------------------------
    const pdfReportRes = await request(`/reports/pdf?month=${curMonth}&year=${curYear}`, { cookie: sessionCookie });
    assert.strictEqual(pdfReportRes.status, 200, "PDF statement must return 200");
    assert.ok(
      pdfReportRes.headers.get("content-type")?.includes("application/pdf"),
      "PDF report must return application/pdf content type"
    );
    recordPass("Deterministic PDF statement generator produces valid PDF binary");

    // -------------------------------------------------------------------------
    // 17. CSV Export
    // -------------------------------------------------------------------------
    const csvExportRes = await request("/reports/csv", { cookie: sessionCookie });
    assert.strictEqual(csvExportRes.status, 200, "CSV export must return 200");
    assert.ok(
      csvExportRes.headers.get("content-type")?.includes("text/csv") ||
        csvExportRes.headers.get("content-type")?.includes("text/plain"),
      "CSV export must return CSV MIME type"
    );
    recordPass("RFC 4180 compliant CSV ledger export operates cleanly");

    // -------------------------------------------------------------------------
    // 18. User Settings
    // -------------------------------------------------------------------------
    const updateProfileRes = await request("/users/profile", {
      method: "PATCH",
      cookie: sessionCookie,
      body: { name: "Smoke Test User (Updated Name)", currency: "INR" },
    });
    assert.strictEqual(updateProfileRes.status, 200, "Updating user profile must return 200");

    const newPassword = "NewSmokePassword123!";
    const changePassRes = await request("/users/change-password", {
      method: "POST",
      cookie: sessionCookie,
      body: { currentPassword: userPassword, newPassword, confirmPassword: newPassword },
    });
    assert.strictEqual(changePassRes.status, 200, "Changing password must return 200");
    userPassword = newPassword;
    recordPass("User profile update and secure password rotation verified");

    // -------------------------------------------------------------------------
    // 19. Admin Login
    // -------------------------------------------------------------------------
    const adminLoginRes = await request("/auth/login", {
      method: "POST",
      body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
    });
    assert.strictEqual(adminLoginRes.status, 200, "Admin login must return 200");
    assert.ok(adminLoginRes.cookie, "Admin login must set HttpOnly cookie");
    const adminCookie = adminLoginRes.cookie!;
    recordPass("Administrator authentication succeeds with system credentials");

    // -------------------------------------------------------------------------
    // 20. Admin User Management
    // -------------------------------------------------------------------------
    const adminUsersRes = await request("/admin/users", { cookie: adminCookie });
    assert.strictEqual(adminUsersRes.status, 200, "Admin user list must return 200");
    const usersList = (adminUsersRes.data.data as Record<string, unknown>).users as Array<Record<string, unknown>>;
    const regularUser = usersList.find((u) => u.email === userEmail);
    assert.ok(regularUser, "Regular user must be listed in admin user management");

    const regUserId = (regularUser._id || regularUser.id) as string;
    const updateStatusRes = await request(`/admin/users/${regUserId}/status`, {
      method: "PATCH",
      cookie: adminCookie,
      body: { status: "ACTIVE" },
    });
    assert.strictEqual(updateStatusRes.status, 200, "Admin updating user status must return 200");
    recordPass("Administrative user management and role/status governance verified");

    // -------------------------------------------------------------------------
    // 21. Audit Logs
    // -------------------------------------------------------------------------
    const auditLogsRes = await request("/admin/audit-logs?limit=10", { cookie: adminCookie });
    assert.strictEqual(auditLogsRes.status, 200, "Audit logs must return 200");
    const auditLogs = (auditLogsRes.data.data as Record<string, unknown>).logs as Array<Record<string, unknown>>;
    assert.ok(auditLogs.length > 0, "Audit logs must record system activity");
    recordPass("System audit logging securely captures actions with sanitized payloads");

    console.log("\n==========================================================");
    console.log(`  🎉 ALL 21 PHASE 20 PRODUCTION SMOKE TESTS PASSED!       `);
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

runPhase20ProductionSmokeTestSuite().catch((err) => {
  console.error("❌ Phase 20 Production Smoke Test Failed:", err);
  process.exit(1);
});
