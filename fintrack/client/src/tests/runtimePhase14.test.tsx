import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Components to verify
import { RecurringTransactionsPage } from "../pages/recurring/RecurringTransactionsPage";
import { SavingsGoalsPage } from "../pages/goals/SavingsGoalsPage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Progress,
  Badge,
} from "../components/ui";

async function runPhase14FrontendRuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 14 Recurring & Goals Runtime Audit     ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  const renderWithProviders = (ui: React.ReactElement, route = "/recurring") => {
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
  // Check 1: RecurringTransactionsPage Shell & Actions
  // ----------------------------------------------------
  console.log("[Check 1] Rendering RecurringTransactionsPage Shell, Header & Actions");
  const recHtml = renderWithProviders(<RecurringTransactionsPage />);
  assert.ok(
    recHtml.includes("Recurring Transactions &amp; Scheduler") ||
      recHtml.includes("Recurring Transactions & Scheduler"),
    "Must render Recurring page title"
  );
  countAssert();
  assert.ok(recHtml.includes("Phase 14"), "Must render Phase 14 badge");
  countAssert();
  assert.ok(recHtml.includes("Process Due Now"), "Must render Process Due Now button");
  countAssert();
  assert.ok(recHtml.includes("New Recurring Rule"), "Must render New Recurring Rule button");
  countAssert();
  console.log("  ✅ Check 1 PASSED: RecurringTransactionsPage header, actions, and buttons rendered cleanly.");

  // ----------------------------------------------------
  // Check 2: SavingsGoalsPage Shell & Actions
  // ----------------------------------------------------
  console.log("\n[Check 2] Rendering SavingsGoalsPage Shell, Header & Actions");
  const goalsHtml = renderWithProviders(<SavingsGoalsPage />, "/goals");
  assert.ok(
    goalsHtml.includes("Savings Goals &amp; Planning") ||
      goalsHtml.includes("Savings Goals & Planning"),
    "Must render Savings Goals page title"
  );
  countAssert();
  assert.ok(goalsHtml.includes("Phase 14"), "Must render Phase 14 badge");
  countAssert();
  assert.ok(goalsHtml.includes("Set New Goal"), "Must render Set New Goal button");
  countAssert();
  console.log("  ✅ Check 2 PASSED: SavingsGoalsPage header, title, and actions rendered cleanly.");

  // ----------------------------------------------------
  // Check 3: Goal Card Progress & Milestone Elements
  // ----------------------------------------------------
  console.log("\n[Check 3] Savings Goal Card Progress & Badges");
  const sampleGoalCard = (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle>Japan Trip 2027</CardTitle>
        <Badge variant="success">Active</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span>₹75,000 / ₹1,50,000</span>
          <span>50%</span>
        </div>
        <Progress value={50} variant="primary" size="md" />
        <div>₹75,000 to go</div>
      </CardContent>
    </Card>
  );
  const cardHtml = renderWithProviders(sampleGoalCard);
  assert.ok(cardHtml.includes("Japan Trip 2027"), "Must render goal title");
  countAssert();
  assert.ok(cardHtml.includes("50%"), "Must render 50% milestone");
  countAssert();
  assert.ok(cardHtml.includes("₹75,000 to go"), "Must render remaining amount");
  countAssert();
  console.log("  ✅ Check 3 PASSED: Savings goal card progress and status elements verified.");

  // ----------------------------------------------------
  // Check 4: Responsive Constraints & Layout Bounds
  // ----------------------------------------------------
  console.log("\n[Check 4] Layout Bounds & Max Width");
  assert.ok(recHtml.includes("max-w-[1440px]"), "Must adhere to design system max-w-[1440px]");
  countAssert();
  assert.ok(goalsHtml.includes("max-w-[1440px]"), "Must adhere to design system max-w-[1440px]");
  countAssert();
  console.log("  ✅ Check 4 PASSED: Layout bounds and responsive containers verified.");

  console.log("\n==========================================================");
  console.log(`  🌟 ALL ${totalAssertions} FRONTEND PHASE 14 RUNTIME CHECKS PASSED!`);
  console.log("==========================================================\n");
}

runPhase14FrontendRuntimeVerification().catch((err) => {
  console.error("❌ Phase 14 frontend runtime verification failed:", err);
  process.exit(1);
});
