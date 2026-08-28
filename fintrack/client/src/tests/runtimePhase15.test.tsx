import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Phase 15 Components & Pages to verify
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { AnalyticsPage } from "../pages/analytics/AnalyticsPage";
import { SpendingTrendChart } from "../components/analytics/SpendingTrendChart";
import { SavingsTrendChart } from "../components/analytics/SavingsTrendChart";
import { PaymentMethodChart } from "../components/analytics/PaymentMethodChart";
import { AccountSpendingChart } from "../components/analytics/AccountSpendingChart";
import { InsightsPanel } from "../components/analytics/InsightsPanel";
import { NotificationBellDropdown } from "../components/notifications/NotificationBellDropdown";
import { AnalyticsFilterBar } from "../components/analytics/AnalyticsFilterBar";

async function runPhase15FrontendRuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 15 Notifications & Analytics Audit     ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  const renderWithProviders = (ui: React.ReactElement, route = "/analytics") => {
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
  // Check 1: NotificationsPage Shell, Header & Filter Tabs
  // ----------------------------------------------------
  console.log("[Check 1] Rendering NotificationsPage Shell, Header, Tabs & Actions");
  const notifHtml = renderWithProviders(<NotificationsPage />, "/notifications");
  assert.ok(notifHtml.includes("Notifications"), "Must render Notifications page title");
  countAssert();
  assert.ok(notifHtml.includes("Phase 15 Notification Center"), "Must render Phase 15 badge");
  countAssert();
  assert.ok(notifHtml.includes("Clear Read"), "Must render Clear Read button");
  countAssert();
  assert.ok(notifHtml.includes("All Alerts"), "Must render All Alerts tab");
  countAssert();
  assert.ok(notifHtml.includes("Unread"), "Must render Unread tab");
  countAssert();
  assert.ok(notifHtml.includes("Budgets"), "Must render Budgets tab");
  countAssert();
  console.log("  ✅ Check 1 PASSED: NotificationsPage header, tabs, and action controls rendered cleanly.");

  // ----------------------------------------------------
  // Check 2: AnalyticsPage Shell, Header & Filter Bar
  // ----------------------------------------------------
  console.log("\n[Check 2] Rendering AnalyticsPage Shell, Header & Actions");
  const analyticsHtml = renderWithProviders(<AnalyticsPage />, "/analytics");
  assert.ok(
    analyticsHtml.includes("Analytics &amp; Trends") ||
      analyticsHtml.includes("Analytics & Trends"),
    "Must render Analytics page title"
  );
  countAssert();
  assert.ok(analyticsHtml.includes("Phase 15 Financial Analytics"), "Must render Phase 15 badge");
  countAssert();
  assert.ok(analyticsHtml.includes("Refresh Analytics"), "Must render Refresh Analytics button");
  countAssert();
  assert.ok(analyticsHtml.includes("Log Transaction"), "Must render Log Transaction button");
  countAssert();
  console.log("  ✅ Check 2 PASSED: AnalyticsPage header and actions rendered cleanly.");

  // ----------------------------------------------------
  // Check 3: AnalyticsFilterBar Interactive Controls
  // ----------------------------------------------------
  console.log("\n[Check 3] Rendering AnalyticsFilterBar Controls");
  const filterHtml = renderWithProviders(
    <AnalyticsFilterBar
      filters={{ period: "30d" }}
      onFilterChange={() => {}}
      onResetFilters={() => {}}
      accounts={[{ _id: "acc1", name: "HDFC Bank" }]}
      categories={[{ _id: "cat1", name: "Groceries", type: "EXPENSE" }]}
    />
  );
  assert.ok(filterHtml.includes("Timeframe"), "Must render Timeframe filter label");
  countAssert();
  assert.ok(filterHtml.includes("Account"), "Must render Account filter label");
  countAssert();
  assert.ok(filterHtml.includes("Category"), "Must render Category filter label");
  countAssert();
  assert.ok(filterHtml.includes("Payment Method"), "Must render Payment Method filter label");
  countAssert();
  console.log("  ✅ Check 3 PASSED: AnalyticsFilterBar controls rendered cleanly.");

  // ----------------------------------------------------
  // Check 4: SpendingTrendChart & SavingsTrendChart
  // ----------------------------------------------------
  console.log("\n[Check 4] Rendering SpendingTrendChart & SavingsTrendChart SVG Components");
  const sampleTrends = [
    { month: "2026-06", label: "Jun 2026", income: 50000, expense: 32000, savings: 18000, savingsRate: 36 },
    { month: "2026-07", label: "Jul 2026", income: 55000, expense: 35000, savings: 20000, savingsRate: 36.4 },
    { month: "2026-08", label: "Aug 2026", income: 60000, expense: 38000, savings: 22000, savingsRate: 36.7 },
  ];

  const spendingChartHtml = renderWithProviders(<SpendingTrendChart data={sampleTrends} />);
  assert.ok(spendingChartHtml.includes("Income vs Expenses"), "Must render Income vs Expenses chart title");
  countAssert();
  assert.ok(spendingChartHtml.includes("<svg"), "Must render SVG chart viewport");
  countAssert();
  assert.ok(spendingChartHtml.includes("Jun"), "Must render month labels");
  countAssert();

  const savingsChartHtml = renderWithProviders(<SavingsTrendChart data={sampleTrends} />);
  assert.ok(savingsChartHtml.includes("Savings Progression"), "Must render Savings Progression chart title");
  countAssert();
  assert.ok(savingsChartHtml.includes("<svg"), "Must render SVG chart viewport");
  countAssert();
  console.log("  ✅ Check 4 PASSED: Chart components render responsive SVG and metric axes.");

  // ----------------------------------------------------
  // Check 5: PaymentMethodChart & AccountSpendingChart
  // ----------------------------------------------------
  console.log("\n[Check 5] Rendering PaymentMethodChart & AccountSpendingChart Distribution");
  const samplePaymentMethods = [
    { method: "UPI", amount: 25000, count: 18, percentage: 65.8 },
    { method: "CREDIT_CARD", amount: 13000, count: 4, percentage: 34.2 },
  ];
  const pmHtml = renderWithProviders(<PaymentMethodChart data={samplePaymentMethods} />);
  assert.ok(pmHtml.includes("Payment Methods"), "Must render Payment Methods title");
  countAssert();
  assert.ok(pmHtml.includes("UPI"), "Must render UPI method");
  countAssert();
  assert.ok(pmHtml.includes("65.8%"), "Must render UPI percentage");
  countAssert();

  const sampleAccounts = [
    { accountId: "acc1", name: "Salary Account", type: "BANK_ACCOUNT", amount: 30000, count: 12, percentage: 78.9 },
    { accountId: "acc2", name: "Cash Wallet", type: "CASH", amount: 8000, count: 10, percentage: 21.1 },
  ];
  const accHtml = renderWithProviders(<AccountSpendingChart data={sampleAccounts} />);
  assert.ok(accHtml.includes("Account Spending"), "Must render Account Spending title");
  countAssert();
  assert.ok(accHtml.includes("Salary Account"), "Must render account name");
  countAssert();
  console.log("  ✅ Check 5 PASSED: Payment methods and account spending distribution rendered cleanly.");

  // ----------------------------------------------------
  // Check 6: Deterministic InsightsPanel
  // ----------------------------------------------------
  console.log("\n[Check 6] Rendering InsightsPanel Component");
  const sampleInsights = [
    {
      id: "ins-1",
      rule: "MONTH_OVER_MONTH_EXPENSE_INCREASE",
      type: "WARNING" as const,
      severity: "HIGH" as const,
      title: "Monthly Spending Surge",
      message: "Your total expenses increased by 18% compared with last month.",
      actionUrl: "/transactions",
      actionLabel: "Review Transactions",
    },
    {
      id: "ins-2",
      rule: "SAVINGS_IMPROVEMENT",
      type: "SUCCESS" as const,
      severity: "LOW" as const,
      title: "Savings Improvement",
      message: "You saved ₹4,500 more than last month.",
      actionUrl: "/goals",
      actionLabel: "Allocate to Goals",
    },
  ];

  const insightsHtml = renderWithProviders(<InsightsPanel insights={sampleInsights} />);
  assert.ok(insightsHtml.includes("Deterministic Financial Insights"), "Must render panel title");
  countAssert();
  assert.ok(insightsHtml.includes("100% Private &amp; Deterministic") || insightsHtml.includes("100% Private & Deterministic"), "Must render privacy badge");
  countAssert();
  assert.ok(insightsHtml.includes("Monthly Spending Surge"), "Must render insight 1 title");
  countAssert();
  assert.ok(insightsHtml.includes("Review Transactions"), "Must render action button");
  countAssert();
  console.log("  ✅ Check 6 PASSED: InsightsPanel rendered deterministic insights with severity indicators.");

  // ----------------------------------------------------
  // Check 7: NotificationBellDropdown Trigger
  // ----------------------------------------------------
  console.log("\n[Check 7] Rendering NotificationBellDropdown Header Trigger");
  const bellHtml = renderWithProviders(<NotificationBellDropdown />);
  assert.ok(bellHtml.includes("<button"), "Must render bell button trigger");
  countAssert();
  console.log("  ✅ Check 7 PASSED: NotificationBellDropdown trigger rendered cleanly.");

  console.log("\n==========================================================");
  console.log(`  🎉 FinTrack Phase 15 Frontend Verification PASSED! (${totalAssertions} assertions)`);
  console.log("==========================================================\n");
}

runPhase15FrontendRuntimeVerification().catch((err) => {
  console.error("\n❌ Phase 15 Frontend Runtime Audit FAILED:", err);
  process.exit(1);
});
