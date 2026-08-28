import React, { useState, useEffect, useCallback } from "react";
import {
  Sliders,
  RotateCcw,
  Save,
  Globe,
  Lock,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { AdminService } from "../../services/admin.service";
import { useToast } from "../../components/ui/Toast";
import { getErrorMessage } from "../../services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Switch } from "../../components/ui/Switch";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";

export const AdminSettingsPage: React.FC = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Editable Form Settings
  const [defaultCurrency, setDefaultCurrency] = useState<string>("INR");
  const [allowUserRegistration, setAllowUserRegistration] = useState<boolean>(true);
  const [maxAccountsPerUser, setMaxAccountsPerUser] = useState<number>(10);
  const [maxBudgetsPerUser, setMaxBudgetsPerUser] = useState<number>(20);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(1440);
  const [supportEmail, setSupportEmail] = useState<string>("support@fintrack.local");

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await AdminService.getSystemSettings();
      const s = res.settings;
      if (s.defaultCurrency) setDefaultCurrency(String(s.defaultCurrency));
      if (s.allowUserRegistration !== undefined) setAllowUserRegistration(Boolean(s.allowUserRegistration));
      if (s.maxAccountsPerUser) setMaxAccountsPerUser(Number(s.maxAccountsPerUser));
      if (s.maxBudgetsPerUser) setMaxBudgetsPerUser(Number(s.maxBudgetsPerUser));
      if (s.maintenanceMode !== undefined) setMaintenanceMode(Boolean(s.maintenanceMode));
      if (s.sessionTimeoutMinutes) setSessionTimeoutMinutes(Number(s.sessionTimeoutMinutes));
      if (s.supportEmail) setSupportEmail(String(s.supportEmail));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await AdminService.updateSystemSettingsBatch({
        defaultCurrency,
        allowUserRegistration,
        maxAccountsPerUser,
        maxBudgetsPerUser,
        maintenanceMode,
        sessionTimeoutMinutes,
        supportEmail,
      });
      toast.success("Platform system settings updated successfully", "Settings Saved");
    } catch (err) {
      toast.error(getErrorMessage(err), "Failed to save system settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      await AdminService.resetSystemSettings();
      toast.success("System settings restored to initial platform defaults", "Settings Reset");
      setResetModalOpen(false);
      fetchSettings();
    } catch (err) {
      toast.error(getErrorMessage(err), "Reset Failed");
    } finally {
      setIsResetting(false);
    }
  };

  const currencyOptions = [
    { value: "INR", label: "INR (₹) - Indian Rupee" },
    { value: "USD", label: "USD ($) - US Dollar" },
    { value: "EUR", label: "EUR (€) - Euro" },
    { value: "GBP", label: "GBP (£) - British Pound" },
    { value: "CAD", label: "CAD ($) - Canadian Dollar" },
    { value: "AUD", label: "AUD ($) - Australian Dollar" },
    { value: "SGD", label: "SGD ($) - Singapore Dollar" },
    { value: "JPY", label: "JPY (¥) - Japanese Yen" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sliders className="h-3 w-3" />
            <span>Phase 17 System Parameters</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Platform System Settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage global runtime parameters, registration flags, user quota limits, and support contact configurations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setResetModalOpen(true)}
            className="text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            type="submit"
            form="admin-settings-form"
            size="sm"
            isLoading={isSaving}
            className="text-xs font-semibold"
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            <span>Save Settings</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load system settings"
          message={error}
          onRetry={fetchSettings}
        />
      ) : (
        <form id="admin-settings-form" onSubmit={handleSaveSettings} className="space-y-6">
          {/* General Platform Parameters */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span>General Financial Parameters</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Default locale and global base currency configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Default Base Currency</label>
                  <Select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    options={currencyOptions}
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Applied as initial currency for newly registered user accounts.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Support Contact Email</label>
                  <Input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                    required
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Displayed in help footers and automated transactional emails.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access & Maintenance Controls */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                <span>Access & Security Flags</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Registration controls and maintenance status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/30">
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground block">Allow Public User Registrations</span>
                  <span className="text-[11px] text-muted-foreground block">
                    When disabled, new signups are blocked and only existing accounts can authenticate.
                  </span>
                </div>
                <Switch
                  checked={allowUserRegistration}
                  onCheckedChange={(checked) => setAllowUserRegistration(checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/30">
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground block flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span>Maintenance Mode</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Puts the user application in read-only maintenance notice while keeping admin console active.
                  </span>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={(checked) => setMaintenanceMode(checked)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Session Expiration Duration (Minutes)</label>
                <Input
                  type="number"
                  min={15}
                  max={43200}
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                  className="max-w-xs font-mono"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Defaults to 1440 minutes (24 hours).
                </span>
              </div>
            </CardContent>
          </Card>

          {/* User Quotas & Entity Limits */}
          <Card>
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-500" />
                <span>Entity Limits & Quotas</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Per-user resource allocation safeguards
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Max Financial Accounts Per User</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={maxAccountsPerUser}
                    onChange={(e) => setMaxAccountsPerUser(Number(e.target.value))}
                    className="font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Limits wallets and bank accounts per user.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Max Monthly Budgets Per User</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={maxBudgetsPerUser}
                    onChange={(e) => setMaxBudgetsPerUser(Number(e.target.value))}
                    className="font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground block">
                    Limits simultaneous active category budgets.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset System Settings to Defaults?"
        message="This action will restore all platform configuration parameters to factory defaults. All custom settings will be overwritten."
        confirmLabel="Reset to Defaults"
        variant="danger"
        isLoading={isResetting}
      />
    </div>
  );
};
