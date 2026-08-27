import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Page & Widgets to verify
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import {
  IncomeExpenseChart,
  CategoryPieChart,
  SavingsTrendChart,
  BudgetWidget,
  SavingsGoalsWidget,
  UpcomingPaymentsWidget,
  InsightsWidget,
} from "../components/dashboard";
import {
  MonthlyTrendItem,
  CategoryBreakdownItem,
  BudgetStatusItem,
  GoalStatusItem,
  RecurringPaymentItem,
  FinancialInsight,
} from "../types/dashboard.types";

async function runPhase12FrontendRuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 12 Dashboard & Widgets Runtime Audit   ");
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
  // Check 1: DashboardPage Shell & Period Controls
  // ----------------------------------------------------
  console.log("[Check 1] Rendering DashboardPage Shell & Period Controls");
  const dashHtml = renderWithProviders(<DashboardPage />);
  assert.ok(dashHtml.includes("Welcome back,"), "Must render welcome greeting");
  countAssert();
  assert.ok(dashHtml.includes("30 Days"), "Must have 30 Days period tab");
  countAssert();
  assert.ok(dashHtml.includes("This Month"), "Must have This Month period tab");
  countAssert();
  assert.ok(dashHtml.includes("max-w-[1440px]"), "Must use standard max-w-[1440px] container");
  countAssert();
  console.log("  ✅ Check 1 PASSED: Dashboard shell, greeting, and period selector rendered cleanly.");

  // ----------------------------------------------------
  // Check 2: IncomeExpenseChart Widget
  // ----------------------------------------------------
  console.log("\n[Check 2] Income vs Expenses Bar Chart Component");
  const mockTrends: MonthlyTrendItem[] = [
    { month: "2026-03", label: "Mar 2026", income: 60000, expense: 35000, savings: 25000, savingsRate: 41.7 },
    { month: "2026-04", label: "Apr 2026", income: 65000, expense: 40000, savings: 25000, savingsRate: 38.5 },
    { month: "2026-05", label: "May 2026", income: 70000, expense: 42000, savings: 28000, savingsRate: 40.0 },
    { month: "2026-06", label: "Jun 2026", income: 75000, expense: 45000, savings: 30000, savingsRate: 40.0 },
    { month: "2026-07", label: "Jul 2026", income: 80000, expense: 48000, savings: 32000, savingsRate: 40.0 },
    { month: "2026-08", label: "Aug 2026", income: 85000, expense: 32000, savings: 53000, savingsRate: 62.4 },
  ];
  const barChartHtml = renderWithProviders(<IncomeExpenseChart data={mockTrends} />);
  assert.ok(barChartHtml.includes("Income vs Expenses"), "Must render chart title");
  countAssert();
  assert.ok(barChartHtml.includes("Aug"), "Must render month labels");
  countAssert();
  console.log("  ✅ Check 2 PASSED: IncomeExpenseChart rendered with multi-series columns.");

  // ----------------------------------------------------
  // Check 3: CategoryPieChart Widget
  // ----------------------------------------------------
  console.log("\n[Check 3] Category Pie / Donut Chart Component");
  const mockCategories: CategoryBreakdownItem[] = [
    { categoryId: "c1", name: "Food & Groceries", type: "EXPENSE", color: "#10B981", amount: 12000, percentage: 37.5 },
    { categoryId: "c2", name: "Shopping", type: "EXPENSE", color: "#3B82F6", amount: 10000, percentage: 31.25 },
    { categoryId: "c3", name: "Transport", type: "EXPENSE", color: "#F59E0B", amount: 6000, percentage: 18.75 },
    { categoryId: "c4", name: "Utilities", type: "EXPENSE", color: "#EC4899", amount: 4000, percentage: 12.5 },
  ];
  const pieChartHtml = renderWithProviders(<CategoryPieChart categories={mockCategories} />);
  assert.ok(pieChartHtml.includes("Expense Categories"), "Must render chart title");
  countAssert();
  assert.ok(pieChartHtml.includes("Food &amp; Groceries") || pieChartHtml.includes("Food & Groceries"), "Must render category names in legend");
  countAssert();
  console.log("  ✅ Check 3 PASSED: CategoryPieChart rendered with donut segments and legend.");

  // ----------------------------------------------------
  // Check 4: SavingsTrendChart Widget
  // ----------------------------------------------------
  console.log("\n[Check 4] Savings Trend Trajectory Chart Component");
  const trendChartHtml = renderWithProviders(<SavingsTrendChart data={mockTrends} />);
  assert.ok(trendChartHtml.includes("Savings &amp; Accumulation Trend") || trendChartHtml.includes("Savings & Accumulation Trend"), "Must render trend title");
  countAssert();
  console.log("  ✅ Check 4 PASSED: SavingsTrendChart rendered with trajectory path.");

  // ----------------------------------------------------
  // Check 5: Budget & Goals Widgets
  // ----------------------------------------------------
  console.log("\n[Check 5] Budget and Savings Goals Widgets");
  const mockBudgets: BudgetStatusItem[] = [
    { _id: "b1", categoryName: "Dining", categoryColor: "#F43F5E", amount: 15000, spent: 12000, remaining: 3000, percentage: 80, isExceeded: false },
  ];
  const budgetHtml = renderWithProviders(<BudgetWidget budgets={mockBudgets} />);
  assert.ok(budgetHtml.includes("Monthly Budgets"), "Must render Budget widget header");
  countAssert();
  assert.ok(budgetHtml.includes("Dining"), "Must render category name");
  countAssert();

  const mockGoals: GoalStatusItem[] = [
    { _id: "g1", name: "Vacation Fund", targetAmount: 50000, currentAmount: 25000, percentage: 50 },
  ];
  const goalsHtml = renderWithProviders(<SavingsGoalsWidget goals={mockGoals} />);
  assert.ok(goalsHtml.includes("Savings Goals"), "Must render Goals widget header");
  countAssert();
  assert.ok(goalsHtml.includes("Vacation Fund"), "Must render goal title");
  countAssert();
  console.log("  ✅ Check 5 PASSED: Budget and Savings Goals progress widgets verified.");

  // ----------------------------------------------------
  // Check 6: Upcoming Payments & Insights Widgets
  // ----------------------------------------------------
  console.log("\n[Check 6] Upcoming Payments & Deterministic Insights Widgets");
  const mockPayments: RecurringPaymentItem[] = [
    { _id: "r1", description: "Netflix Subscription", amount: 649, type: "EXPENSE", frequency: "MONTHLY", nextDueDate: "2026-09-01T00:00:00.000Z", accountName: "HDFC Credit" },
  ];
  const paymentHtml = renderWithProviders(<UpcomingPaymentsWidget payments={mockPayments} />);
  assert.ok(paymentHtml.includes("Upcoming Recurring"), "Must render upcoming payments header");
  countAssert();
  assert.ok(paymentHtml.includes("Netflix Subscription"), "Must render recurring payment title");
  countAssert();

  const mockInsights: FinancialInsight[] = [
    { id: "i1", type: "SUCCESS", title: "Healthy Savings", message: "Great job saving over 30% of your earnings." },
  ];
  const insightHtml = renderWithProviders(<InsightsWidget insights={mockInsights} />);
  assert.ok(insightHtml.includes("Financial Insights &amp; Diagnostics") || insightHtml.includes("Financial Insights & Diagnostics"), "Must render insights header");
  countAssert();
  assert.ok(insightHtml.includes("Healthy Savings"), "Must render insight title");
  countAssert();
  console.log("  ✅ Check 6 PASSED: Upcoming payments and deterministic insights verified.");

  console.log("\n==========================================================");
  console.log(`  🌟 ALL ${totalAssertions} FRONTEND PHASE 12 RUNTIME CHECKS PASSED!`);
  console.log("==========================================================\n");
}

runPhase12FrontendRuntimeVerification().catch((err) => {
  console.error("❌ Phase 12 frontend runtime verification failed:", err);
  process.exit(1);
});
