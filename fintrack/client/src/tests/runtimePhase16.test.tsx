import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Phase 16 Components & Pages to verify
import { CalendarPage } from "../pages/calendar/CalendarPage";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { CalendarGrid } from "../components/calendar/CalendarGrid";
import { CalendarEventDrawer } from "../components/calendar/CalendarEventDrawer";
import { ReportPreview } from "../components/reports/ReportPreview";
import { MonthlyReportData } from "../types/report.types";
import { CalendarDaySummary } from "../types/calendar.types";

async function runPhase16FrontendRuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 16 Calendar & Reports Audit Suite     ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  const renderWithProviders = (ui: React.ReactElement, route = "/calendar") => {
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
  // Check 1: CalendarPage Shell, Header & Filter Tabs
  // ----------------------------------------------------
  console.log("[Check 1] Rendering CalendarPage Shell, Header, Navigation & Tabs");
  const calHtml = renderWithProviders(<CalendarPage />, "/calendar");
  assert.ok(calHtml.includes("Financial Calendar"), "Must render Financial Calendar page title");
  countAssert();
  assert.ok(calHtml.includes("Phase 16 Financial Calendar"), "Must render Phase 16 badge");
  countAssert();
  assert.ok(calHtml.includes("Today"), "Must render Today navigation button");
  countAssert();
  assert.ok(calHtml.includes("All Events"), "Must render All Events filter tab");
  countAssert();
  assert.ok(calHtml.includes("Recurring Bills"), "Must render Recurring Bills filter tab");
  countAssert();
  assert.ok(calHtml.includes("Goal Deadlines"), "Must render Goal Deadlines filter tab");
  countAssert();
  assert.ok(calHtml.includes("Budgets"), "Must render Budgets filter tab");
  countAssert();
  console.log("  ✅ Check 1 PASSED: CalendarPage header, month navigation, and filter controls rendered cleanly.");

  // ----------------------------------------------------
  // Check 2: CalendarGrid 7-Column Layout & Density Rendering
  // ----------------------------------------------------
  console.log("\n[Check 2] Rendering CalendarGrid Component");
  const mockDays: CalendarDaySummary[] = Array.from({ length: 31 }, (_, idx) => ({
    date: `2026-08-${String(idx + 1).padStart(2, "0")}`,
    dayNumber: idx + 1,
    isCurrentMonth: true,
    totalInflow: idx === 0 ? 80000 : 0,
    totalOutflow: idx === 4 ? 25000 : 0,
    eventsCount: idx === 4 ? 1 : 0,
    events:
      idx === 4
        ? [
            {
              id: "rec-1",
              type: "RECURRING_PAYMENT",
              title: "Apartment Rent",
              date: "2026-08-05",
              amount: 25000,
              severity: "WARNING",
              actionUrl: "/recurring",
              actionLabel: "View Recurring Rule",
            },
          ]
        : [],
  }));

  const gridHtml = renderWithProviders(
    <CalendarGrid
      month={8}
      year={2026}
      days={mockDays}
      selectedDate="2026-08-05"
      onSelectDate={() => {}}
    />
  );

  assert.ok(gridHtml.includes("Sun"), "Must render Sunday column header");
  countAssert();
  assert.ok(gridHtml.includes("Mon"), "Must render Monday column header");
  countAssert();
  assert.ok(gridHtml.includes("Apartment Rent"), "Must render Rent event title in grid cell");
  countAssert();
  assert.ok(gridHtml.includes("₹25,000"), "Must format and display ₹25,000 outflow");
  countAssert();
  console.log("  ✅ Check 2 PASSED: CalendarGrid 7-column matrix and event chips rendered cleanly.");

  // ----------------------------------------------------
  // Check 3: CalendarEventDrawer Component
  // ----------------------------------------------------
  console.log("\n[Check 3] Rendering CalendarEventDrawer Component");
  const drawerHtml = renderWithProviders(
    <CalendarEventDrawer
      selectedDay={mockDays[4]}
      onClose={() => {}}
      currency="INR"
    />
  );

  assert.ok(drawerHtml.includes("Apartment Rent"), "Must render event title in drawer");
  countAssert();
  assert.ok(drawerHtml.includes("Recurring Bill / Income"), "Must render event type subtitle");
  countAssert();
  assert.ok(drawerHtml.includes("View Recurring Rule"), "Must render deep-link button");
  countAssert();
  assert.ok(drawerHtml.includes("Day Outflow"), "Must render Day Outflow summary");
  countAssert();
  console.log("  ✅ Check 3 PASSED: CalendarEventDrawer event details and action links rendered cleanly.");

  // ----------------------------------------------------
  // Check 4: ReportsPage Shell, Header & Filter Controls
  // ----------------------------------------------------
  console.log("\n[Check 4] Rendering ReportsPage Shell & Header");
  const repHtml = renderWithProviders(<ReportsPage />, "/reports");
  assert.ok(repHtml.includes("Reports &amp; Data Export") || repHtml.includes("Reports & Data Export"), "Must render Reports page title");
  countAssert();
  assert.ok(repHtml.includes("Phase 16 Reports &amp; Data Export") || repHtml.includes("Phase 16 Reports & Data Export"), "Must render Phase 16 badge");
  countAssert();
  assert.ok(repHtml.includes("Export My Data"), "Must render Export My Data header button");
  countAssert();
  assert.ok(repHtml.includes("Report Type"), "Must render Report Type selector");
  countAssert();
  assert.ok(repHtml.includes("Month"), "Must render Month selector");
  countAssert();
  assert.ok(repHtml.includes("Year"), "Must render Year selector");
  countAssert();
  console.log("  ✅ Check 4 PASSED: ReportsPage controls and action buttons rendered cleanly.");

  // ----------------------------------------------------
  // Check 5: ReportPreview Component & Metric Boxes
  // ----------------------------------------------------
  console.log("\n[Check 5] Rendering ReportPreview Component");
  const mockReport: MonthlyReportData = {
    title: "August 2026 Financial Statement",
    month: 8,
    year: 2026,
    monthLabel: "August 2026",
    currency: "INR",
    generatedAt: new Date().toISOString(),
    summary: {
      totalIncome: 80000,
      totalExpenses: 8000,
      netSavings: 72000,
      savingsRate: 90,
      transactionCount: 3,
      avgDailyExpense: 258.06,
    },
    categories: [
      {
        categoryId: "cat1",
        name: "Food & Dining",
        amount: 8000,
        percentage: 100,
        count: 2,
      },
    ],
    paymentMethods: [
      {
        method: "UPI",
        amount: 5000,
        count: 1,
        percentage: 62.5,
      },
      {
        method: "CREDIT_CARD",
        amount: 3000,
        count: 1,
        percentage: 37.5,
      },
    ],
    accounts: [
      {
        accountId: "acc1",
        name: "HDFC Primary",
        type: "BANK_ACCOUNT",
        amount: 8000,
        percentage: 100,
      },
    ],
    topTransactions: [
      {
        id: "txn1",
        date: "2026-08-10T12:00:00Z",
        description: "Supermarket Grocery Run",
        category: "Food & Dining",
        account: "HDFC Primary",
        amount: 5000,
        type: "EXPENSE",
        paymentMethod: "UPI",
      },
    ],
  };

  const previewHtml = renderWithProviders(
    <ReportPreview
      report={mockReport}
      onDownloadPDF={() => {}}
      onDownloadCSV={() => {}}
    />
  );

  assert.ok(previewHtml.includes("August 2026 Financial Statement"), "Must render statement title");
  countAssert();
  assert.ok(previewHtml.includes("Total Inflows"), "Must render Total Inflows card");
  countAssert();
  assert.ok(previewHtml.includes("Total Outflows"), "Must render Total Outflows card");
  countAssert();
  assert.ok(previewHtml.includes("Net Savings"), "Must render Net Savings card");
  countAssert();
  assert.ok(previewHtml.includes("Savings Rate"), "Must render Savings Rate card");
  countAssert();
  assert.ok(
    previewHtml.includes("90%") || (previewHtml.includes("90") && previewHtml.includes("Savings Rate")),
    "Must display 90% savings rate"
  );
  countAssert();
  assert.ok(previewHtml.includes("Download PDF"), "Must render Download PDF button");
  countAssert();
  assert.ok(previewHtml.includes("Download CSV"), "Must render Download CSV button");
  countAssert();
  assert.ok(previewHtml.includes("Category Allocation"), "Must render Category Allocation section");
  countAssert();
  assert.ok(previewHtml.includes("Statement Transactions Ledger"), "Must render Ledger table");
  countAssert();
  console.log("  ✅ Check 5 PASSED: ReportPreview statement preview, metrics, and actions rendered cleanly.");

  console.log("\n==========================================================");
  console.log(`  🎉 FinTrack Phase 16 Client Runtime Verified (${totalAssertions} assertions passed)!`);
  console.log("==========================================================\n");
}

runPhase16FrontendRuntimeVerification().catch((err) => {
  console.error("❌ Phase 16 Frontend Verification Failed:", err);
  process.exit(1);
});
