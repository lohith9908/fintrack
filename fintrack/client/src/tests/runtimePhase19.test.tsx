import React from "react";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Layouts to verify
import { AppLayout } from "../layouts/AppLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";

// Direct component imports for rendering audits
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../pages/auth/ResetPasswordPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { TransactionsPage } from "../pages/transactions/TransactionsPage";
import { AccountsPage } from "../pages/accounts/AccountsPage";
import { BudgetsPage } from "../pages/budgets/BudgetsPage";
import { RecurringTransactionsPage } from "../pages/recurring/RecurringTransactionsPage";
import { SavingsGoalsPage } from "../pages/goals/SavingsGoalsPage";
import { AnalyticsPage } from "../pages/analytics/AnalyticsPage";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { CalendarPage } from "../pages/calendar/CalendarPage";
import { NotificationsPage } from "../pages/notifications/NotificationsPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminCategoriesPage } from "../pages/admin/AdminCategoriesPage";
import { AdminAuditLogsPage } from "../pages/admin/AdminAuditLogsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";
import { DesignSystemShowcase } from "../pages/DesignSystemShowcase";

async function runPhase19FrontendSecurityAndRuntimeAudit() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 19 Security & Production Readiness UX  ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  const renderWithProviders = (
    ui: React.ReactElement,
    route = "/dashboard",
    theme: "light" | "dark" = "light"
  ) => {
    return renderToString(
      <MemoryRouter initialEntries={[route]}>
        <ThemeProvider defaultTheme={theme}>
          <ToastProvider>
            <AuthProvider>{ui}</AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  // -------------------------------------------------------------------------
  // Check 1: Zero Auth Token Storage in localStorage / sessionStorage Audit
  // -------------------------------------------------------------------------
  console.log("[Audit 1] Security Scan: Verifying zero localStorage/sessionStorage auth token storage");
  const clientSrcDir = path.resolve(__dirname, "..");
  
  function scanFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.resolve(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (!file.includes("tests") && !file.includes("node_modules")) {
          results = results.concat(scanFiles(filePath));
        }
      } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        results.push(filePath);
      }
    }
    return results;
  }

  const clientFiles = scanFiles(clientSrcDir);
  const tokenStorageViolations: string[] = [];

  for (const filePath of clientFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    // Look for unsafe token storage patterns
    const regex = /(localStorage|sessionStorage)\.setItem\(\s*['"`](token|jwt|fintrack_token|auth_token)['"`]/i;
    if (regex.test(content)) {
      tokenStorageViolations.push(filePath);
    }
  }

  assert.strictEqual(
    tokenStorageViolations.length,
    0,
    `Found token storage violations in client code: ${tokenStorageViolations.join(", ")}`
  );
  countAssert();
  console.log(`  ✅ Passed: Scanned ${clientFiles.length} client files — 0 localStorage/sessionStorage auth token leaks detected`);

  // -------------------------------------------------------------------------
  // Check 2: Complete Page Component Tree Rendering Audit
  // -------------------------------------------------------------------------
  console.log("\n[Audit 2] Complete Page Component Tree Rendering Audit");

  const pageEntries: Array<{ name: string; component: React.ReactElement; route: string }> = [
    { name: "LoginPage", component: <LoginPage />, route: "/login" },
    { name: "RegisterPage", component: <RegisterPage />, route: "/register" },
    { name: "ForgotPasswordPage", component: <ForgotPasswordPage />, route: "/forgot-password" },
    { name: "ResetPasswordPage", component: <ResetPasswordPage />, route: "/reset-password" },
    { name: "DashboardPage", component: <DashboardPage />, route: "/dashboard" },
    { name: "TransactionsPage", component: <TransactionsPage />, route: "/transactions" },
    { name: "AccountsPage", component: <AccountsPage />, route: "/accounts" },
    { name: "BudgetsPage", component: <BudgetsPage />, route: "/budgets" },
    { name: "RecurringTransactionsPage", component: <RecurringTransactionsPage />, route: "/recurring" },
    { name: "SavingsGoalsPage", component: <SavingsGoalsPage />, route: "/goals" },
    { name: "AnalyticsPage", component: <AnalyticsPage />, route: "/analytics" },
    { name: "ReportsPage", component: <ReportsPage />, route: "/reports" },
    { name: "CalendarPage", component: <CalendarPage />, route: "/calendar" },
    { name: "NotificationsPage", component: <NotificationsPage />, route: "/notifications" },
    { name: "SettingsPage", component: <SettingsPage />, route: "/settings" },
    { name: "AdminDashboardPage", component: <AdminDashboardPage />, route: "/admin/overview" },
    { name: "AdminUsersPage", component: <AdminUsersPage />, route: "/admin/users" },
    { name: "AdminCategoriesPage", component: <AdminCategoriesPage />, route: "/admin/categories" },
    { name: "AdminAuditLogsPage", component: <AdminAuditLogsPage />, route: "/admin/audit-logs" },
    { name: "AdminSettingsPage", component: <AdminSettingsPage />, route: "/admin/system-settings" },
    { name: "DesignSystemShowcase", component: <DesignSystemShowcase />, route: "/design-system" },
  ];

  for (const entry of pageEntries) {
    const html = renderWithProviders(entry.component, entry.route);
    assert.ok(html && html.length > 0, `Page ${entry.name} must render non-empty HTML`);
    countAssert();
  }
  console.log(`  ✅ Passed: All ${pageEntries.length} pages rendered successfully without runtime errors`);

  // -------------------------------------------------------------------------
  // Check 3: Dark & Light Theme State Rendering
  // -------------------------------------------------------------------------
  console.log("\n[Audit 3] Theme Provider & Layout Rendering Verification");
  const lightHtml = renderWithProviders(<AppLayout />, "/dashboard", "light");
  const darkHtml = renderWithProviders(<AppLayout />, "/dashboard", "dark");
  const adminHtml = renderWithProviders(<AdminLayout />, "/admin/overview", "light");

  assert.ok(lightHtml.includes("id=\"main-content\""), "AppLayout in light mode has main-content id");
  countAssert();
  assert.ok(darkHtml.includes("id=\"main-content\""), "AppLayout in dark mode has main-content id");
  countAssert();
  assert.ok(adminHtml.includes("id=\"main-content\""), "AdminLayout has main-content id");
  countAssert();
  console.log("  ✅ Passed: Dark and light theme providers render and encapsulate layout trees properly");

  // -------------------------------------------------------------------------
  // Check 4: AuthLayout Rendering & Accessible Forms
  // -------------------------------------------------------------------------
  console.log("\n[Audit 4] AuthLayout & Form Controls Verification");
  const authLayoutHtml = renderWithProviders(<AuthLayout />, "/login");
  assert.ok(authLayoutHtml.includes("FinTrack"), "AuthLayout must render application brand");
  countAssert();

  const loginPageHtml = renderWithProviders(<LoginPage />, "/login");
  assert.ok(loginPageHtml.includes("type=\"email\""), "LoginPage must include email input");
  countAssert();
  assert.ok(loginPageHtml.includes("type=\"password\""), "LoginPage must include password input");
  countAssert();
  console.log("  ✅ Passed: AuthLayout and accessible authentication form controls verified");

  console.log("\n==========================================================");
  console.log(`  🎉 FinTrack Phase 19 Frontend Audit PASSED (${totalAssertions} assertions)! `);
  console.log("==========================================================\n");
}

runPhase19FrontendSecurityAndRuntimeAudit().catch((err) => {
  console.error("❌ Phase 19 Frontend Audit Failed:", err);
  process.exit(1);
});
