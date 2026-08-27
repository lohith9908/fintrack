import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Page to verify
import { TransactionsPage } from "../pages/transactions/TransactionsPage";

async function runPhase9FrontendRuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 9 Frontend Runtime & Component Audit   ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  const renderWithProviders = (ui: React.ReactElement, route = "/transactions") => {
    return renderToString(
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider defaultTheme="light">
          <ToastProvider>
            <AuthProvider>{ui}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  // ----------------------------------------------------
  // Check 1: TransactionsPage Shell & Header
  // ----------------------------------------------------
  console.log("[Check 1] Rendering TransactionsPage Component");
  const html = renderWithProviders(<TransactionsPage />);

  assert.ok(html.includes("Transactions &amp; Ledger") || html.includes("Transactions & Ledger"), "Must render page title");
  countAssert();
  assert.ok(html.includes("Add Transaction"), "Must render Add Transaction action button");
  countAssert();
  console.log("  ✅ Check 1 PASSED: TransactionsPage header and primary actions rendered cleanly.");

  // ----------------------------------------------------
  // Check 2: Filter Tabs
  // ----------------------------------------------------
  console.log("\n[Check 2] Filter Tabs in TransactionsPage");
  assert.ok(html.includes("All Transactions"), "Must have All Transactions tab");
  countAssert();
  assert.ok(html.includes("Expenses"), "Must have Expenses tab");
  countAssert();
  assert.ok(html.includes("Income"), "Must have Income tab");
  countAssert();
  console.log("  ✅ Check 2 PASSED: All transaction filter tabs rendered.");

  // ----------------------------------------------------
  // Check 3: Dialog and Layout Elements
  // ----------------------------------------------------
  console.log("\n[Check 3] Layout Constraints");
  assert.ok(html.includes("max-w-[1440px]"), "Must use standard max-w-[1440px] container");
  countAssert();
  console.log("  ✅ Check 3 PASSED: Layout boundaries and container widths verified.");

  console.log("\n==========================================================");
  console.log(`  🌟 ALL ${totalAssertions} FRONTEND PHASE 9 RUNTIME CHECKS PASSED!`);
  console.log("==========================================================\n");
}

runPhase9FrontendRuntimeVerification().catch((err) => {
  console.error("❌ Phase 9 frontend runtime verification failed:", err);
  process.exit(1);
});
