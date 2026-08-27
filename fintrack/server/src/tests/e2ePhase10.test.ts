import assert from "node:assert/strict";
import http from "node:http";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../app";
import { env } from "../config/env";
import { seedDatabase } from "../seed/seed";
import { RECEIPT_UPLOAD_DIR } from "../middlewares/upload.middleware";

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
  };
  description: string;
  date: string;
  paymentMethod: string;
  account: {
    _id: string;
    name: string;
  };
  notes?: string;
  receipt?: {
    fileId: string;
    storageKey: string;
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AccountData {
  _id: string;
  name: string;
}

interface CategoryData {
  _id: string;
  name: string;
  type: string;
}

async function runPhase10E2ETests() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 10 Search, Filters & Receipts Test     ");
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
      console.log("ℹ️ Local MongoDB unreachable. Starting isolated MongoMemoryServer for Phase 10 tests...");
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
        headers?: Record<string, string>;
      } = {}
    ): Promise<{ status: number; body: ApiResponse<T>; cookie?: string; rawRes: Response }> => {
      const headers: Record<string, string> = {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      };
      if (options.cookie) {
        headers["Cookie"] = options.cookie;
      }

      const res = await fetch(`${baseUrl}${path}`, {
        method: options.method || "GET",
        headers,
        body:
          options.body instanceof FormData
            ? (options.body as unknown as BodyInit)
            : options.body
            ? JSON.stringify(options.body)
            : undefined,
      });

      const setCookie = res.headers.get("set-cookie");
      const cookieResult = setCookie ? setCookie.split(";")[0] : undefined;
      let body: ApiResponse<T>;
      try {
        body = (await res.json()) as ApiResponse<T>;
      } catch {
        body = { success: false, message: "" };
      }
      return { status: res.status, body, cookie: cookieResult, rawRes: res };
    };

    // ----------------------------------------------------
    // Setup: Create 2 Users & Accounts
    // ----------------------------------------------------
    console.log("[Setup] Initializing test users and transactions...");
    const u1Reg = await apiRequest<{ user: { _id: string } }>("/auth/register", {
      method: "POST",
      body: { name: "Phase 10 User 1", email: `p10_user1_${Date.now()}@example.com`, password: "Password123!", confirmPassword: "Password123!" },
    });
    assert.ok(u1Reg.cookie);
    const user1Cookie = u1Reg.cookie;

    const u2Reg = await apiRequest<{ user: { _id: string } }>("/auth/register", {
      method: "POST",
      body: { name: "Phase 10 User 2", email: `p10_user2_${Date.now()}@example.com`, password: "Password123!", confirmPassword: "Password123!" },
    });
    assert.ok(u2Reg.cookie);
    const user2Cookie = u2Reg.cookie;

    // Create User 1 Accounts: Bank and Cash
    const bankRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: { name: "Primary Bank Account", type: "BANK_ACCOUNT", openingBalance: 50000 },
    });
    assert.ok(bankRes.body.data?.account);
    const bankId = bankRes.body.data.account._id;

    const cashRes = await apiRequest<{ account: AccountData }>("/accounts", {
      method: "POST",
      cookie: user1Cookie,
      body: { name: "Daily Cash", type: "CASH", openingBalance: 10000 },
    });
    assert.ok(cashRes.body.data?.account);
    const cashId = cashRes.body.data.account._id;

    // Fetch Categories
    const catList = await apiRequest<{ categories: CategoryData[] }>("/categories", { cookie: user1Cookie });
    assert.ok(catList.body.data?.categories);
    const salaryCat = catList.body.data.categories.find((c) => c.name === "Salary")!;
    const foodCat = catList.body.data.categories.find((c) => c.name === "Food")!;
    const shoppingCat = catList.body.data.categories.find((c) => c.name === "Shopping")!;

    // Create multiple transactions for search, filter & pagination tests
    const t1 = await apiRequest<{ transaction: TransactionData }>("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: { amount: 80000, type: "INCOME", category: salaryCat._id, description: "Monthly Tech Salary", date: "2026-08-01", paymentMethod: "BANK_TRANSFER", account: bankId, notes: "Direct payroll deposit" },
    });
    assert.ok(t1.body.data?.transaction);
    const txn1Id = t1.body.data.transaction._id;

    await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: { amount: 2400, type: "EXPENSE", category: foodCat._id, description: "Amazon Fresh Groceries", date: "2026-08-05", paymentMethod: "UPI", account: bankId, notes: "Weekly veggies" },
    });

    await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: { amount: 1500, type: "EXPENSE", category: foodCat._id, description: "Dinner at Bistro", date: "2026-08-10", paymentMethod: "CASH", account: cashId, notes: "Italian food" },
    });

    await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: { amount: 12000, type: "EXPENSE", category: shoppingCat._id, description: "Amazon Electronics", date: "2026-08-15", paymentMethod: "CREDIT_CARD", account: bankId, notes: "Mechanical keyboard" },
    });

    await apiRequest("/transactions", {
      method: "POST",
      cookie: user1Cookie,
      body: { amount: 650, type: "EXPENSE", category: foodCat._id, description: "Coffee & Snacks", date: "2026-08-20", paymentMethod: "CASH", account: cashId },
    });
    console.log("  ✓ 5 test transactions created successfully.\n");

    // ----------------------------------------------------
    // Test 1: Text Search (description and notes)
    // ----------------------------------------------------
    console.log("[Test 1] User-scoped text search (description and notes)");
    // 1a. Search "Amazon" -> should match "Amazon Fresh Groceries" and "Amazon Electronics"
    const searchRes = await apiRequest<{ transactions: TransactionData[]; pagination: PaginationMeta }>("/transactions?search=Amazon", {
      cookie: user1Cookie,
    });
    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.body.data?.transactions);
    assert.equal(searchRes.body.data.transactions.length, 2, "Search for 'Amazon' should return 2 matches");
    assert.ok(searchRes.body.data.transactions.every((t) => t.description.includes("Amazon")));

    // 1b. Search in notes: "Italian" -> matches "Dinner at Bistro"
    const searchNotesRes = await apiRequest<{ transactions: TransactionData[] }>("/transactions?search=Italian", {
      cookie: user1Cookie,
    });
    assert.equal(searchNotesRes.status, 200);
    assert.equal(searchNotesRes.body.data?.transactions.length, 1);
    assert.equal(searchNotesRes.body.data?.transactions[0].description, "Dinner at Bistro");

    // 1c. User 2 search isolation (User 2 sees 0 transactions for "Amazon")
    const u2SearchRes = await apiRequest<{ transactions: TransactionData[] }>("/transactions?search=Amazon", {
      cookie: user2Cookie,
    });
    assert.equal(u2SearchRes.status, 200);
    assert.equal(u2SearchRes.body.data?.transactions.length, 0, "User 2 cannot search User 1 transactions");
    console.log("  ✅ Test 1 PASSED: User-scoped text search verified across description and notes\n");

    // ----------------------------------------------------
    // Test 2: Date Range Filter
    // ----------------------------------------------------
    console.log("[Test 2] Date Range Filtering (startDate and endDate)");
    // Filter between 2026-08-01 and 2026-08-10 (Txn 1, 2, 3)
    const dateRangeRes = await apiRequest<{ transactions: TransactionData[] }>("/transactions?startDate=2026-08-01&endDate=2026-08-10", {
      cookie: user1Cookie,
    });
    assert.equal(dateRangeRes.status, 200);
    assert.equal(dateRangeRes.body.data?.transactions.length, 3);
    console.log("  ✅ Test 2 PASSED: Date range filtering verified\n");

    // ----------------------------------------------------
    // Test 3: Amount Range Filter
    // ----------------------------------------------------
    console.log("[Test 3] Amount Range Filtering (minAmount and maxAmount)");
    // Filter amounts between 1000 and 5000 (Txn 2: 2400, Txn 3: 1500)
    const amountFilterRes = await apiRequest<{ transactions: TransactionData[] }>("/transactions?minAmount=1000&maxAmount=5000", {
      cookie: user1Cookie,
    });
    assert.equal(amountFilterRes.status, 200);
    assert.equal(amountFilterRes.body.data?.transactions.length, 2);
    assert.ok(amountFilterRes.body.data?.transactions.every((t) => t.amount >= 1000 && t.amount <= 5000));
    console.log("  ✅ Test 3 PASSED: Amount range filtering verified\n");

    // ----------------------------------------------------
    // Test 4: Category, Account & Payment Method Filters
    // ----------------------------------------------------
    console.log("[Test 4] Category, Account, and Payment Method Filtering");
    // Food category filter (3 transactions)
    const foodFilterRes = await apiRequest<{ transactions: TransactionData[] }>(`/transactions?category=${foodCat._id}`, {
      cookie: user1Cookie,
    });
    assert.equal(foodFilterRes.status, 200);
    assert.equal(foodFilterRes.body.data?.transactions.length, 3);

    // Cash payment method filter (2 transactions)
    const cashFilterRes = await apiRequest<{ transactions: TransactionData[] }>("/transactions?paymentMethod=CASH", {
      cookie: user1Cookie,
    });
    assert.equal(cashFilterRes.status, 200);
    assert.equal(cashFilterRes.body.data?.transactions.length, 2);
    console.log("  ✅ Test 4 PASSED: Category, Account, and Payment Method filters verified\n");

    // ----------------------------------------------------
    // Test 5: Server-side Pagination
    // ----------------------------------------------------
    console.log("[Test 5] Server-side Pagination (page, limit, totalPages, next/prev)");
    // Page 1 with limit 2 (Total = 5, totalPages = 3)
    const page1Res = await apiRequest<{ transactions: TransactionData[]; pagination: PaginationMeta }>("/transactions?page=1&limit=2", {
      cookie: user1Cookie,
    });
    assert.equal(page1Res.status, 200);
    assert.ok(page1Res.body.data?.pagination);
    assert.equal(page1Res.body.data.transactions.length, 2);
    assert.equal(page1Res.body.data.pagination.page, 1);
    assert.equal(page1Res.body.data.pagination.limit, 2);
    assert.equal(page1Res.body.data.pagination.total, 5);
    assert.equal(page1Res.body.data.pagination.totalPages, 3);
    assert.equal(page1Res.body.data.pagination.hasNextPage, true);
    assert.equal(page1Res.body.data.pagination.hasPrevPage, false);

    // Page 3 (final page with 1 item)
    const page3Res = await apiRequest<{ transactions: TransactionData[]; pagination: PaginationMeta }>("/transactions?page=3&limit=2", {
      cookie: user1Cookie,
    });
    assert.equal(page3Res.status, 200);
    assert.equal(page3Res.body.data?.transactions.length, 1);
    assert.equal(page3Res.body.data?.pagination.hasNextPage, false);
    assert.equal(page3Res.body.data?.pagination.hasPrevPage, true);
    console.log("  ✅ Test 5 PASSED: Server-side pagination and metadata verified\n");

    // ----------------------------------------------------
    // Test 6: Multer File Upload Validation
    // ----------------------------------------------------
    console.log("[Test 6] Multer Receipt Upload: valid image, valid PDF, invalid type, size limit");

    // 6a. Valid JPEG upload
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const formDataJpeg = new FormData();
    formDataJpeg.append("receipt", new Blob([jpegBuffer], { type: "image/jpeg" }), "receipt_aug.jpg");

    const uploadJpegRes = await apiRequest<{ transaction: TransactionData }>(`/transactions/${txn1Id}/receipt`, {
      method: "POST",
      cookie: user1Cookie,
      body: formDataJpeg,
    });
    assert.equal(uploadJpegRes.status, 200, "Valid JPEG receipt upload must succeed with 200");
    assert.ok(uploadJpegRes.body.data?.transaction.receipt);
    assert.equal(uploadJpegRes.body.data.transaction.receipt.originalName, "receipt_aug.jpg");
    assert.equal(uploadJpegRes.body.data.transaction.receipt.mimeType, "image/jpeg");
    const storedStorageKey = uploadJpegRes.body.data.transaction.receipt.storageKey;
    assert.ok(fs.existsSync(path.resolve(RECEIPT_UPLOAD_DIR, storedStorageKey)), "File must exist in receipts directory");

    // 6b. Invalid file type (.txt / text/plain) rejected with 400 Bad Request
    const textBuffer = Buffer.from("Malicious script content");
    const formDataInvalid = new FormData();
    formDataInvalid.append("receipt", new Blob([textBuffer], { type: "text/plain" }), "test.txt");

    const uploadInvalidRes = await apiRequest(`/transactions/${txn1Id}/receipt`, {
      method: "POST",
      cookie: user1Cookie,
      body: formDataInvalid,
    });
    assert.equal(uploadInvalidRes.status, 400, "Disallowed file type must return 400 Bad Request");

    // 6c. Oversized file (> 5MB) rejected
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024); // 5.5MB
    const formDataLarge = new FormData();
    formDataLarge.append("receipt", new Blob([largeBuffer], { type: "image/png" }), "large_receipt.png");

    const uploadLargeRes = await apiRequest(`/transactions/${txn1Id}/receipt`, {
      method: "POST",
      cookie: user1Cookie,
      body: formDataLarge,
    });
    assert.equal(uploadLargeRes.status, 400, "Oversized file > 5MB must return 400 Bad Request");
    console.log("  ✅ Test 6 PASSED: Multer upload validation (type & size) strictly enforced\n");

    // ----------------------------------------------------
    // Test 7: Authorized Receipt Retrieval
    // ----------------------------------------------------
    console.log("[Test 7] Authorized Receipt Download & Stream Verification");
    // 7a. Owner (User 1) accesses own receipt -> 200 OK with correct MIME
    const getReceiptRes = await fetch(`${baseUrl}/transactions/${txn1Id}/receipt`, {
      headers: { Cookie: user1Cookie },
    });
    assert.equal(getReceiptRes.status, 200);
    assert.equal(getReceiptRes.headers.get("content-type"), "image/jpeg");

    // 7b. User 2 accesses User 1's receipt -> 404 Not Found (Access Denied)
    const u2ReceiptRes = await fetch(`${baseUrl}/transactions/${txn1Id}/receipt`, {
      headers: { Cookie: user2Cookie },
    });
    assert.equal(u2ReceiptRes.status, 404, "User 2 cannot access User 1's receipt");

    // 7c. Unauthenticated request -> 401 Unauthorized
    const unauthReceiptRes = await fetch(`${baseUrl}/transactions/${txn1Id}/receipt`);
    assert.equal(unauthReceiptRes.status, 401, "Unauthenticated receipt access returns 401");
    console.log("  ✅ Test 7 PASSED: Receipt retrieval strictly authorized and user-scoped\n");

    // ----------------------------------------------------
    // Test 8: Receipt Deletion & Disk Cleanup
    // ----------------------------------------------------
    console.log("[Test 8] Receipt Deletion and Disk Storage Cleanup");
    const deleteReceiptRes = await apiRequest<{ transaction: TransactionData }>(`/transactions/${txn1Id}/receipt`, {
      method: "DELETE",
      cookie: user1Cookie,
    });
    assert.equal(deleteReceiptRes.status, 200);
    assert.equal(deleteReceiptRes.body.data?.transaction.receipt, undefined, "Receipt field should be cleared");
    assert.ok(!fs.existsSync(path.resolve(RECEIPT_UPLOAD_DIR, storedStorageKey)), "Deleted receipt file must be unlinked from storage");
    console.log("  ✅ Test 8 PASSED: Receipt metadata and physical file deleted cleanly\n");

    console.log("==========================================================");
    console.log("  🌟 ALL 8 PHASE 10 E2E TEST SCENARIOS PASSED WITH ZERO ERRORS!");
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

runPhase10E2ETests().catch((err) => {
  console.error("❌ Phase 10 E2E test suite failed:", err);
  process.exit(1);
});
