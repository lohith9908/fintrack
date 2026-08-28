import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from "./RouteGuards";

// Pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  SettingsPage,
  DashboardPage,
  DesignSystemShowcase,
  AccountsPage,
  TransactionsPage,
  BudgetsPage,
  RecurringTransactionsPage,
  SavingsGoalsPage,
  NotificationsPage,
  AnalyticsPage,
  CalendarPage,
  ReportsPage,
  AdminDashboardPage,
  AdminUsersPage,
  AdminCategoriesPage,
  AdminAuditLogsPage,
  AdminSettingsPage,
} from "../pages";

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================================ */}
        {/* 1. Public Authentication Routes (PublicOnlyRoute)            */}
        {/* ============================================================ */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route index element={<Navigate to="/auth/login" replace />} />
          </Route>
        </Route>

        {/* ============================================================ */}
        {/* 2. Design System Showcase & Shell View                       */}
        {/* ============================================================ */}
        <Route element={<AppLayout />}>
          <Route path="/design-system" element={<DesignSystemShowcase />} />
        </Route>

        {/* ============================================================ */}
        {/* 3. Protected Application Routes (ProtectedRoute)             */}
        {/* ============================================================ */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/recurring" element={<RecurringTransactionsPage />} />
            <Route path="/goals" element={<SavingsGoalsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* ============================================================ */}
        {/* 3. Protected Admin Routes (AdminRoute)                       */}
        {/* ============================================================ */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* ============================================================ */}
        {/* 4. Global Catch-All Fallback                                 */}
        {/* ============================================================ */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
