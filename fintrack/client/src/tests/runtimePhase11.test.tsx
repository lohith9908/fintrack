import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Page to verify
import { DashboardPage } from "../pages/dashboard/DashboardPage";

async function runPhase11FrontendRuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 11 Frontend Runtime & Component Audit  ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  const renderWithProviders = (ui: React.ReactElement, route = "/dashboard") => {
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
  // Check 1: DashboardPage Header & Welcome Banner
  // ----------------------------------------------------
  console.log("[Check 1] Rendering DashboardPage Header & Welcome Banner");
  const html = renderWithProviders(<DashboardPage />);

  assert.ok(html.includes("Welcome back,"), "Must render welcome greeting");
  countAssert();
  assert.ok(html.includes("Add Transaction"), "Must render Add Transaction quick action button");
  countAssert();
  assert.ok(html.includes("max-w-[1440px]"), "Must use standard max-w-[1440px] container");
  countAssert();
  console.log("  ✅ Check 1 PASSED: Dashboard header, greeting, and action buttons rendered cleanly.");

  // ----------------------------------------------------
  // Check 2: Period Filter Tabs
  // ----------------------------------------------------
  console.log("\n[Check 2] Period Filter Tabs");
  assert.ok(html.includes("30 Days"), "Must have 30 Days period tab");
  countAssert();
  assert.ok(html.includes("This Month"), "Must have This Month period tab");
  countAssert();
  assert.ok(html.includes("6 Months"), "Must have 6 Months period tab");
  countAssert();
  assert.ok(html.includes("1 Year"), "Must have 1 Year period tab");
  countAssert();
  assert.ok(html.includes("All Time"), "Must have All Time period tab");
  countAssert();
  console.log("  ✅ Check 2 PASSED: All 5 period selection tabs rendered.");

  console.log("\n==========================================================");
  console.log(`  🌟 ALL ${totalAssertions} FRONTEND PHASE 11 RUNTIME CHECKS PASSED!`);
  console.log("==========================================================\n");
}

runPhase11FrontendRuntimeVerification().catch((err) => {
  console.error("❌ Phase 11 frontend runtime verification failed:", err);
  process.exit(1);
});
