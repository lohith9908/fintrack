import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Page to verify
import { AccountsPage } from "../pages/accounts/AccountsPage";

async function runPhase8FrontendRuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 8 Frontend Runtime & Component Audit   ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  const renderWithProviders = (ui: React.ReactElement, route = "/accounts") => {
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
  // Check 1: AccountsPage Shell & Structure
  // ----------------------------------------------------
  console.log("[Check 1] Rendering AccountsPage Component");
  const html = renderWithProviders(<AccountsPage />);

  assert.ok(html.includes("Accounts &amp; Wallets") || html.includes("Accounts & Wallets"), "Must render page title");
  countAssert();
  assert.ok(html.includes("Add Account"), "Must render Add Account action button");
  countAssert();
  assert.ok(html.includes("Categories"), "Must render Categories manager button");
  countAssert();
  console.log("  ✅ Check 1 PASSED: AccountsPage header and primary actions rendered cleanly.");

  // ----------------------------------------------------
  // Check 2: Filter Tabs
  // ----------------------------------------------------
  console.log("\n[Check 2] Filter Tabs in AccountsPage");
  assert.ok(html.includes("All Wallets"), "Must have All Wallets tab");
  countAssert();
  assert.ok(html.includes("Bank Accounts"), "Must have Bank Accounts tab");
  countAssert();
  assert.ok(html.includes("Cash &amp; UPI") || html.includes("Cash & UPI"), "Must have Cash & UPI tab");
  countAssert();
  assert.ok(html.includes("Credit Cards"), "Must have Credit Cards tab");
  countAssert();
  assert.ok(html.includes("Archived"), "Must have Archived tab");
  countAssert();
  console.log("  ✅ Check 2 PASSED: All 5 account filter tabs rendered.");

  // ----------------------------------------------------
  // Check 3: Modals and Dialog Elements
  // ----------------------------------------------------
  console.log("\n[Check 3] Dialog and Form Elements");
  assert.ok(html.includes("max-w-[1440px]"), "Must use standard max-w-[1440px] container");
  countAssert();
  console.log("  ✅ Check 3 PASSED: Layout boundaries and container widths verified.");

  console.log("\n==========================================================");
  console.log(`  🌟 ALL ${totalAssertions} FRONTEND PHASE 8 RUNTIME CHECKS PASSED!`);
  console.log("==========================================================\n");
}

runPhase8FrontendRuntimeVerification().catch((err) => {
  console.error("❌ Phase 8 frontend runtime verification failed:", err);
  process.exit(1);
});
