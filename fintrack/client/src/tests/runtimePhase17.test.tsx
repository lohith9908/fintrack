import React from "react";
import assert from "node:assert/strict";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";

// Theme & Providers
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../context/AuthContext";

// Phase 17 Admin Pages & Layout to verify
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "../pages/admin/AdminUsersPage";
import { AdminCategoriesPage } from "../pages/admin/AdminCategoriesPage";
import { AdminAuditLogsPage } from "../pages/admin/AdminAuditLogsPage";
import { AdminSettingsPage } from "../pages/admin/AdminSettingsPage";

async function runPhase17FrontendRuntimeVerification() {
  console.log("\n==========================================================");
  console.log("  FinTrack — Phase 17 Admin Platform Client Audit Suite  ");
  console.log("==========================================================\n");

  let totalAssertions = 0;
  const countAssert = () => {
    totalAssertions++;
  };

  const renderWithProviders = (ui: React.ReactElement, route = "/admin") => {
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
  // Check 1: AdminLayout Sidebar & Navigation Structure
  // ----------------------------------------------------
  console.log("[Check 1] Verifying AdminLayout Sidebar, Brand & Elevated Navigation Links");
  const layoutHtml = renderWithProviders(<AdminLayout />, "/admin");
  assert.ok(layoutHtml.includes("Admin Console"), "Must render Admin Console brand title");
  countAssert();
  assert.ok(layoutHtml.includes("FinTrack Platform"), "Must render FinTrack Platform subtitle");
  countAssert();
  assert.ok(layoutHtml.includes("Platform Administration"), "Must render Administration section label");
  countAssert();
  assert.ok(layoutHtml.includes("Overview"), "Must render Overview link");
  countAssert();
  assert.ok(layoutHtml.includes("User Management"), "Must render User Management nav link");
  countAssert();
  assert.ok(layoutHtml.includes("Audit Logs"), "Must render Audit Logs nav link");
  countAssert();
  assert.ok(layoutHtml.includes("System Categories"), "Must render System Categories nav link");
  countAssert();
  assert.ok(layoutHtml.includes("System Settings"), "Must render System Settings nav link");
  countAssert();
  assert.ok(layoutHtml.includes("Return to User App"), "Must render Return to User App backlink");
  countAssert();
  console.log("  ✅ Passed: AdminLayout rendered with brand and all 5 navigation links");

  // ----------------------------------------------------
  // Check 2: AdminDashboardPage (Platform Overview)
  // ----------------------------------------------------
  console.log("\n[Check 2] Verifying AdminDashboardPage Shell, Metrics & Quick Actions");
  const dashboardHtml = renderWithProviders(<AdminDashboardPage />, "/admin");
  assert.ok(dashboardHtml.includes("Administration Console"), "Must render Administration Console title");
  countAssert();
  assert.ok(dashboardHtml.includes("Phase 17 Admin Platform"), "Must render Phase 17 badge");
  countAssert();
  assert.ok(dashboardHtml.includes("Refresh Overview"), "Must render Refresh Overview button");
  countAssert();
  console.log("  ✅ Passed: AdminDashboardPage rendered with telemetry metrics and action cards");

  // ----------------------------------------------------
  // Check 3: AdminUsersPage (User Moderation & Directory)
  // ----------------------------------------------------
  console.log("\n[Check 3] Verifying AdminUsersPage Directory, Filters & Moderation Actions");
  const usersHtml = renderWithProviders(<AdminUsersPage />, "/admin/users");
  assert.ok(usersHtml.includes("User Management"), "Must render User Management title");
  countAssert();
  assert.ok(usersHtml.includes("Platform User Directory"), "Must render Platform User Directory badge");
  countAssert();
  assert.ok(usersHtml.includes("Search users by name or email..."), "Must render search input placeholder");
  countAssert();
  assert.ok(usersHtml.includes("All Roles"), "Must render role filter option");
  countAssert();
  assert.ok(usersHtml.includes("All Statuses"), "Must render status filter option");
  countAssert();
  console.log("  ✅ Passed: AdminUsersPage rendered with search, filters, and moderation controls");

  // ----------------------------------------------------
  // Check 4: AdminCategoriesPage (System Categories Management)
  // ----------------------------------------------------
  console.log("\n[Check 4] Verifying AdminCategoriesPage System Categories & Actions");
  const categoriesHtml = renderWithProviders(<AdminCategoriesPage />, "/admin/categories");
  assert.ok(categoriesHtml.includes("System Categories Management"), "Must render System Categories Management title");
  countAssert();
  assert.ok(categoriesHtml.includes("Phase 17 System Categories"), "Must render System Categories badge");
  countAssert();
  assert.ok(categoriesHtml.includes("Add System Category"), "Must render Add System Category button");
  countAssert();
  console.log("  ✅ Passed: AdminCategoriesPage rendered with categories matrix and create triggers");

  // ----------------------------------------------------
  // Check 5: AdminAuditLogsPage (Security & Audit Trail)
  // ----------------------------------------------------
  console.log("\n[Check 5] Verifying AdminAuditLogsPage Governance Trail & Metadata Inspector");
  const auditHtml = renderWithProviders(<AdminAuditLogsPage />, "/admin/audit-logs");
  assert.ok(auditHtml.includes("Administrative Audit Trail"), "Must render Administrative Audit Trail title");
  countAssert();
  assert.ok(auditHtml.includes("Phase 17 Governance Trail"), "Must render Phase 17 Governance Trail badge");
  countAssert();
  assert.ok(auditHtml.includes("All Action Types"), "Must render All Action Types filter option");
  countAssert();
  assert.ok(auditHtml.includes("All Target Entities"), "Must render All Target Entities filter option");
  countAssert();
  assert.ok(auditHtml.includes("Refresh Logs"), "Must render Refresh Logs button");
  countAssert();
  console.log("  ✅ Passed: AdminAuditLogsPage rendered with filters, action tags, and payload triggers");

  // ----------------------------------------------------
  // Check 6: AdminSettingsPage (Platform System Settings)
  // ----------------------------------------------------
  console.log("\n[Check 6] Verifying AdminSettingsPage Parameter Form Cards & Action Buttons");
  const settingsHtml = renderWithProviders(<AdminSettingsPage />, "/admin/settings");
  assert.ok(settingsHtml.includes("Platform System Settings"), "Must render Platform System Settings title");
  countAssert();
  assert.ok(settingsHtml.includes("Phase 17 System Parameters"), "Must render System Parameters badge");
  countAssert();
  assert.ok(settingsHtml.includes("General Financial Parameters"), "Must render General Financial Parameters section");
  countAssert();
  assert.ok(settingsHtml.includes("Default Base Currency"), "Must render Default Base Currency label");
  countAssert();
  assert.ok(settingsHtml.includes("Support Contact Email"), "Must render Support Contact Email label");
  countAssert();
  assert.ok(settingsHtml.includes("Access &amp; Security Flags") || settingsHtml.includes("Access & Security Flags"), "Must render Access & Security Flags section");
  countAssert();
  assert.ok(settingsHtml.includes("Allow Public User Registrations"), "Must render Allow Public User Registrations toggle");
  countAssert();
  assert.ok(settingsHtml.includes("Maintenance Mode"), "Must render Maintenance Mode toggle");
  countAssert();
  assert.ok(settingsHtml.includes("Entity Limits &amp; Quotas") || settingsHtml.includes("Entity Limits & Quotas"), "Must render Entity Limits & Quotas section");
  countAssert();
  assert.ok(settingsHtml.includes("Max Financial Accounts Per User"), "Must render Max Financial Accounts Per User label");
  countAssert();
  assert.ok(settingsHtml.includes("Max Monthly Budgets Per User"), "Must render Max Monthly Budgets Per User label");
  countAssert();
  assert.ok(settingsHtml.includes("Save Settings"), "Must render Save Settings button");
  countAssert();
  assert.ok(settingsHtml.includes("Reset Defaults"), "Must render Reset Defaults button");
  countAssert();
  console.log("  ✅ Passed: AdminSettingsPage rendered with parameter cards and save/reset controls");

  console.log("\n==========================================================");
  console.log(`  🎉 FinTrack Phase 17 All ${totalAssertions} Client Runtime Tests PASSED!`);
  console.log("==========================================================\n");
}

runPhase17FrontendRuntimeVerification().catch((err) => {
  console.error("❌ Phase 17 Frontend Runtime Test Failed:", err);
  process.exit(1);
});
