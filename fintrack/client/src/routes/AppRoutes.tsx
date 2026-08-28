import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from "./RouteGuards";

// Lazy-Loaded Application Pages for Performance & Route Code-Splitting per UI_UX.md Section 82
const LoginPage = React.lazy(() =>
  import("../pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import("../pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = React.lazy(() =>
  import("../pages/auth/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = React.lazy(() =>
  import("../pages/auth/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const DashboardPage = React.lazy(() =>
  import("../pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const SettingsPage = React.lazy(() =>
  import("../pages/settings/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const DesignSystemShowcase = React.lazy(() =>
  import("../pages/DesignSystemShowcase").then((m) => ({ default: m.DesignSystemShowcase }))
);
const AccountsPage = React.lazy(() =>
  import("../pages/accounts/AccountsPage").then((m) => ({ default: m.AccountsPage }))
);
const TransactionsPage = React.lazy(() =>
  import("../pages/transactions/TransactionsPage").then((m) => ({ default: m.TransactionsPage }))
);
const BudgetsPage = React.lazy(() =>
  import("../pages/budgets/BudgetsPage").then((m) => ({ default: m.BudgetsPage }))
);
const RecurringTransactionsPage = React.lazy(() =>
  import("../pages/recurring/RecurringTransactionsPage").then((m) => ({
    default: m.RecurringTransactionsPage,
  }))
);
const SavingsGoalsPage = React.lazy(() =>
  import("../pages/goals/SavingsGoalsPage").then((m) => ({ default: m.SavingsGoalsPage }))
);
const NotificationsPage = React.lazy(() =>
  import("../pages/notifications/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  }))
);
const AnalyticsPage = React.lazy(() =>
  import("../pages/analytics/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage }))
);
const CalendarPage = React.lazy(() =>
  import("../pages/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage }))
);
const ReportsPage = React.lazy(() =>
  import("../pages/reports/ReportsPage").then((m) => ({ default: m.ReportsPage }))
);
const AdminDashboardPage = React.lazy(() =>
  import("../pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminUsersPage = React.lazy(() =>
  import("../pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage }))
);
const AdminCategoriesPage = React.lazy(() =>
  import("../pages/admin/AdminCategoriesPage").then((m) => ({ default: m.AdminCategoriesPage }))
);
const AdminAuditLogsPage = React.lazy(() =>
  import("../pages/admin/AdminAuditLogsPage").then((m) => ({ default: m.AdminAuditLogsPage }))
);
const AdminSettingsPage = React.lazy(() =>
  import("../pages/admin/AdminSettingsPage").then((m) => ({ default: m.AdminSettingsPage }))
);

/**
 * Accessible Suspense Loading Fallback with aria live region
 */
const PageLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading page content"
    className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-3 animate-fadeIn"
  >
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    <span className="text-xs font-semibold text-muted-foreground tracking-wide">
      Loading view...
    </span>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoadingFallback />}>
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
          {/* 4. Protected Admin Routes (AdminRoute)                       */}
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
          {/* 5. Global Catch-All Fallback                                 */}
          {/* ============================================================ */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
