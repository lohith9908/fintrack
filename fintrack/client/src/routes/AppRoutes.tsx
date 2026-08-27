import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { DesignSystemShowcase } from "../pages/DesignSystemShowcase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Sparkles, Construction } from "lucide-react";

/**
 * Shell Foundation Placeholder for future phase routes
 */
const PhaseShellPlaceholder: React.FC<{
  title: string;
  phase: string;
  description: string;
}> = ({ title, phase, description }) => (
  <div className="space-y-6 animate-fadeIn">
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="h-3 w-3" />
          <span>{phase} Foundation Shell</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title} Module Container</CardTitle>
          <Badge variant="secondary" dot>
            Phase 6 Shell Ready
          </Badge>
        </div>
        <CardDescription>
          Responsive layout container wired with theme system, typography, and shared components.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-8 rounded-xl border border-dashed border-border bg-card/40 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 rounded-xl bg-secondary text-muted-foreground">
            <Construction className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">{title} Shell Active</h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              Functional features will be implemented in subsequent phases per IMPLEMENTATION.md.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main Application Routes (AppLayout) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<DesignSystemShowcase />} />
          <Route
            path="/dashboard"
            element={
              <PhaseShellPlaceholder
                title="Financial Dashboard"
                phase="Phase 12"
                description="Executive overview of cash flow, category spending, and deterministic insights."
              />
            }
          />
          <Route
            path="/transactions"
            element={
              <PhaseShellPlaceholder
                title="Transactions & Ledger"
                phase="Phase 9"
                description="Searchable, filterable income and expense records with receipt attachments."
              />
            }
          />
          <Route
            path="/accounts"
            element={
              <PhaseShellPlaceholder
                title="Accounts & Wallets"
                phase="Phase 8"
                description="Manage bank accounts, cash wallets, credit cards, and UPI balances."
              />
            }
          />
          <Route
            path="/budgets"
            element={
              <PhaseShellPlaceholder
                title="Monthly Budgets & Alerts"
                phase="Phase 13"
                description="Category budget allocation and deterministic threshold monitoring."
              />
            }
          />
          <Route
            path="/recurring"
            element={
              <PhaseShellPlaceholder
                title="Recurring Transactions"
                phase="Phase 14"
                description="Subscription and bill payment schedules with automated detection."
              />
            }
          />
          <Route
            path="/goals"
            element={
              <PhaseShellPlaceholder
                title="Savings Goals"
                phase="Phase 14"
                description="Target-oriented savings tracking with visual progress milestones."
              />
            }
          />
          <Route
            path="/calendar"
            element={
              <PhaseShellPlaceholder
                title="Financial Calendar"
                phase="Phase 16"
                description="Daily expense density and upcoming bill obligations timeline."
              />
            }
          />
          <Route
            path="/analytics"
            element={
              <PhaseShellPlaceholder
                title="Analytics & Trends"
                phase="Phase 15"
                description="Income, expense, and category distribution analytics with deterministic insights."
              />
            }
          />
          <Route
            path="/reports"
            element={
              <PhaseShellPlaceholder
                title="Reports & Data Export"
                phase="Phase 16"
                description="PDF summary statements and structured CSV ledger export."
              />
            }
          />
          <Route
            path="/notifications"
            element={
              <PhaseShellPlaceholder
                title="Notifications Center"
                phase="Phase 15"
                description="System alerts, recurring payment reminders, and budget warnings."
              />
            }
          />
          <Route
            path="/settings"
            element={
              <PhaseShellPlaceholder
                title="User Profile & Settings"
                phase="Phase 7"
                description="Profile details, currency preference, timezone, and security controls."
              />
            }
          />
        </Route>

        {/* Authentication Flow Routes (AuthLayout) */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route
            path="login"
            element={
              <PhaseShellPlaceholder
                title="Sign In"
                phase="Phase 7"
                description="Secure session authentication via HTTP-only cookie."
              />
            }
          />
          <Route
            path="register"
            element={
              <PhaseShellPlaceholder
                title="Create Account"
                phase="Phase 7"
                description="Register new FinTrack user account."
              />
            }
          />
          <Route
            path="forgot-password"
            element={
              <PhaseShellPlaceholder
                title="Forgot Password"
                phase="Phase 7"
                description="Request one-time password recovery email."
              />
            }
          />
          <Route
            path="reset-password"
            element={
              <PhaseShellPlaceholder
                title="Reset Password"
                phase="Phase 7"
                description="Set new password using secure reset token."
              />
            }
          />
        </Route>

        {/* Administrative Platform Routes (AdminLayout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={
              <PhaseShellPlaceholder
                title="Admin Platform Overview"
                phase="Phase 17"
                description="Platform status, active users, and system category metrics."
              />
            }
          />
          <Route
            path="users"
            element={
              <PhaseShellPlaceholder
                title="User Management"
                phase="Phase 17"
                description="User status moderation and account lifecycle management."
              />
            }
          />
          <Route
            path="audit-logs"
            element={
              <PhaseShellPlaceholder
                title="Audit Logs"
                phase="Phase 17"
                description="Administrative action history and security audit trail."
              />
            }
          />
          <Route
            path="categories"
            element={
              <PhaseShellPlaceholder
                title="System Categories"
                phase="Phase 17"
                description="Global transaction categories configuration."
              />
            }
          />
          <Route
            path="settings"
            element={
              <PhaseShellPlaceholder
                title="System Settings"
                phase="Phase 17"
                description="Global platform parameters and runtime flags."
              />
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
