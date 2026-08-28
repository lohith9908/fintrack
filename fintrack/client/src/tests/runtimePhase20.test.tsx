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

// Shell Layouts
import { AppLayout } from "../layouts/AppLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { AuthLayout } from "../layouts/AuthLayout";

// Named Component Imports for all 21 Application Views
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

async function runPhase20FrontendProductionAudit() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 20 Frontend Production & Release Audit ");
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
  // 1. Production Build Distribution Artifacts Verification
  // -------------------------------------------------------------------------
  console.log("[Audit 1] Verifying production build distribution artifacts in client/dist");
  const distDir = path.resolve(__dirname, "../../dist");
  if (fs.existsSync(distDir)) {
    const indexHtml = path.join(distDir, "index.html");
    assert.ok(fs.existsSync(indexHtml), "dist/index.html must exist in production build");
    countAssert();

    const assetsDir = path.join(distDir, "assets");
    assert.ok(fs.existsSync(assetsDir), "dist/assets must exist");
    countAssert();

    const assetFiles = fs.readdirSync(assetsDir);
    const jsChunks = assetFiles.filter((f) => f.endsWith(".js"));
    const cssChunks = assetFiles.filter((f) => f.endsWith(".css"));
    assert.ok(jsChunks.length > 0, "Production bundle must contain code-split JS chunks");
    countAssert();
    assert.ok(cssChunks.length > 0, "Production bundle must contain compiled CSS stylesheets");
    countAssert();
    console.log(`  ✅ Passed: Production build verified (${jsChunks.length} JS chunks, ${cssChunks.length} CSS files)`);
  } else {
    console.log("  ℹ️ Note: client/dist will be compiled during production build quality gate");
  }

  // -------------------------------------------------------------------------
  // 2. Zero Auth Token Storage in Client Storage Audit
  // -------------------------------------------------------------------------
  console.log("\n[Audit 2] Zero Auth Token Security Audit across frontend source code");
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
    const regex = /(localStorage|sessionStorage)\.setItem\(\s*['"`](token|jwt|fintrack_token|auth_token)['"`]/i;
    if (regex.test(content)) {
      tokenStorageViolations.push(filePath);
    }
  }

  assert.strictEqual(
    tokenStorageViolations.length,
    0,
    `Security violation: Auth tokens found in client storage: ${tokenStorageViolations.join(", ")}`
  );
  countAssert();
  console.log(`  ✅ Passed: Scanned ${clientFiles.length} client files — 0 localStorage/sessionStorage auth tokens`);

  // -------------------------------------------------------------------------
  // 3. Complete 21-Page Component Tree Rendering Audit
  // -------------------------------------------------------------------------
  console.log("\n[Audit 3] Complete 21-Page Application Tree Rendering Audit");

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
    assert.ok(html && html.length > 0, `Page ${entry.name} must render valid HTML tree`);
    countAssert();
  }
  console.log(`  ✅ Passed: All ${pageEntries.length} application views rendered without runtime exceptions`);

  // -------------------------------------------------------------------------
  // 4. Shell Layouts, Theme Switching & Accessibility Landmarks
  // -------------------------------------------------------------------------
  console.log("\n[Audit 4] Layout Landmarks, Themes & Accessibility Verification");

  const appLayoutLight = renderWithProviders(<AppLayout />, "/dashboard", "light");
  const appLayoutDark = renderWithProviders(<AppLayout />, "/dashboard", "dark");
  const adminLayout = renderWithProviders(<AdminLayout />, "/admin/overview", "light");
  const authLayout = renderWithProviders(<AuthLayout />, "/login", "light");

  assert.ok(appLayoutLight.includes('id="main-content"'), "AppLayout light mode contains #main-content");
  countAssert();
  assert.ok(appLayoutDark.includes('id="main-content"'), "AppLayout dark mode contains #main-content");
  countAssert();
  assert.ok(adminLayout.includes('id="main-content"'), "AdminLayout contains #main-content");
  countAssert();
  assert.ok(authLayout.includes("FinTrack"), "AuthLayout renders brand header");
  countAssert();
  assert.ok(appLayoutLight.includes("Skip to main content"), "AppLayout includes accessible skip link");
  countAssert();
  assert.ok(adminLayout.includes("Skip to main content"), "AdminLayout includes accessible skip link");
  countAssert();
  console.log("  ✅ Passed: All layouts expose accessible landmarks and skip navigation anchors");

  console.log("\n==========================================================");
  console.log(`  🎉 FinTrack Phase 20 Frontend Audit PASSED (${totalAssertions} assertions)! `);
  console.log("==========================================================\n");
}

runPhase20FrontendProductionAudit().catch((err) => {
  console.error("❌ Phase 20 Frontend Audit Failed:", err);
  process.exit(1);
});
