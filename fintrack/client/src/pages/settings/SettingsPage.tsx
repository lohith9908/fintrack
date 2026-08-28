import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Palette,
  Bell,
  Lock,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
  Download,
} from "lucide-react";
import { ReportService } from "../../services/report.service";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../components/ui/Toast";
import { getErrorMessage } from "../../services/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Switch,
  Tabs,
  Badge,
  Avatar,
  Dialog,
} from "../../components/ui";
import { UserTheme, INotificationPreferences } from "../../types/auth.types";

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  const { theme: activeTheme, setTheme } = useTheme();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currency, setCurrency] = useState(user?.currency || "INR");
  const [timezone, setTimezone] = useState(user?.timezone || "Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState(user?.dateFormat || "DD MMM YYYY");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notifications Form State
  const [notifications, setNotifications] = useState<INotificationPreferences>({
    budgetAlerts: user?.notificationPreferences?.budgetAlerts ?? true,
    recurringPaymentAlerts: user?.notificationPreferences?.recurringPaymentAlerts ?? true,
    goalAlerts: user?.notificationPreferences?.goalAlerts ?? true,
    financialInsights: user?.notificationPreferences?.financialInsights ?? true,
    systemNotifications: user?.notificationPreferences?.systemNotifications ?? true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Security / Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account Deletion State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setCurrency(user.currency || "INR");
      setTimezone(user.timezone || "Asia/Kolkata");
      setDateFormat(user.dateFormat || "DD MMM YYYY");
      setNotifications({
        budgetAlerts: user.notificationPreferences?.budgetAlerts ?? true,
        recurringPaymentAlerts: user.notificationPreferences?.recurringPaymentAlerts ?? true,
        goalAlerts: user.notificationPreferences?.goalAlerts ?? true,
        financialInsights: user.notificationPreferences?.financialInsights ?? true,
        systemNotifications: user.notificationPreferences?.systemNotifications ?? true,
      });
    }
  }, [user]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name cannot be empty.", "Validation Error");
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        currency,
        timezone,
        dateFormat,
      });
      toast.success("Profile details updated successfully.", "Saved");
    } catch (err) {
      toast.error(getErrorMessage(err), "Update Failed");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Notifications Save
  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingNotifications(true);
      await updateProfile({
        notificationPreferences: notifications,
      });
      toast.success("Notification preferences saved.", "Preferences Updated");
    } catch (err) {
      toast.error(getErrorMessage(err), "Save Failed");
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Handle Theme Preference
  const handleThemeSelect = async (newTheme: UserTheme) => {
    setTheme(newTheme);
    try {
      await updateProfile({ theme: newTheme });
      toast.info(`Theme set to ${newTheme.toUpperCase()}`, "Theme Updated");
    } catch {
      // Local theme is already applied
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword || !newPassword) {
      setPasswordError("Please enter both current and new password.");
      return;
    }

    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError("New password must be at least 8 characters with letters and numbers.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const msg = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      toast.success(msg, "Password Changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      const msg = getErrorMessage(err);
      setPasswordError(msg);
      toast.error(msg, "Password Change Failed");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError("Password is required to confirm account deletion.");
      return;
    }

    try {
      setIsDeletingAccount(true);
      await deleteAccount(deletePassword);
      toast.info("Your account has been deleted.", "Account Removed");
      setDeleteDialogOpen(false);
    } catch (err) {
      const msg = getErrorMessage(err);
      setDeleteError(msg);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const [isExportingData, setIsExportingData] = useState(false);
  const handleExportData = async () => {
    try {
      setIsExportingData(true);
      const archive = await ReportService.downloadUserDataArchive();
      toast.success(
        `Exported ${archive.exportMetadata.entityCounts.transactions} transactions, ${archive.exportMetadata.entityCounts.accounts} accounts`,
        "Archive Downloaded"
      );
    } catch (err) {
      toast.error(getErrorMessage(err), "Export Failed");
    } finally {
      setIsExportingData(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">User Settings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your personal profile, localization preferences, security credentials, and alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Avatar name={user?.name || "User"} size="md" status="online" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">{user?.name}</span>
              <Badge variant={user?.role === "ADMIN" ? "danger" : "primary"} size="sm">
                {user?.role}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: "profile", label: "Profile", icon: <UserIcon className="h-4 w-4" /> },
          { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
          { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
          { id: "security", label: "Security", icon: <Lock className="h-4 w-4" /> },
          { id: "danger", label: "Danger Zone", icon: <Trash2 className="h-4 w-4" /> },
        ]}
      />

      {/* TAB 1: Profile Details */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your public display profile and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">Email Address</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="flex h-10 w-full rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                    />
                    <Badge variant="success" size="sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Select
                  label="Default Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { value: "INR", label: "INR (₹) — Indian Rupee" },
                    { value: "USD", label: "USD ($) — US Dollar" },
                    { value: "EUR", label: "EUR (€) — Euro" },
                    { value: "GBP", label: "GBP (£) — British Pound" },
                    { value: "AED", label: "AED (د.إ) — UAE Dirham" },
                    { value: "SGD", label: "SGD ($) — Singapore Dollar" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  options={[
                    { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +5:30)" },
                    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                    { value: "America/New_York", label: "America/New_York (EST/EDT)" },
                    { value: "Europe/London", label: "Europe/London (GMT/BST)" },
                    { value: "Asia/Dubai", label: "Asia/Dubai (GST +4:00)" },
                    { value: "Asia/Singapore", label: "Asia/Singapore (SGT +8:00)" },
                  ]}
                />
                <Select
                  label="Date Format"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  options={[
                    { value: "DD MMM YYYY", label: "22 Aug 2026 (DD MMM YYYY)" },
                    { value: "YYYY-MM-DD", label: "2026-08-22 (ISO YYYY-MM-DD)" },
                    { value: "DD/MM/YYYY", label: "22/08/2026 (DD/MM/YYYY)" },
                    { value: "MM/DD/YYYY", label: "08/22/2026 (MM/DD/YYYY)" },
                  ]}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end p-4">
              <Button type="submit" isLoading={isSavingProfile} leftIcon={<Save className="h-4 w-4" />}>
                Save Profile Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* TAB 2: Appearance & Theme */}
      {activeTab === "appearance" && (
        <Card className="animate-fadeIn">
          <CardHeader>
            <CardTitle>Appearance & Theme</CardTitle>
            <CardDescription>Customize the look and feel of your FinTrack workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => handleThemeSelect("light")}
                className={`flex flex-col items-center p-5 rounded-2xl border transition-all text-center gap-3 ${
                  activeTheme === "light"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="p-3 rounded-full bg-secondary text-foreground">
                  <Sun className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Light Theme</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">High clarity daylight surface</p>
                </div>
                {activeTheme === "light" && <Badge variant="primary" size="sm">Active</Badge>}
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => handleThemeSelect("dark")}
                className={`flex flex-col items-center p-5 rounded-2xl border transition-all text-center gap-3 ${
                  activeTheme === "dark"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="p-3 rounded-full bg-secondary text-foreground">
                  <Moon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Dark Theme</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Low-eye-strain financial surface</p>
                </div>
                {activeTheme === "dark" && <Badge variant="primary" size="sm">Active</Badge>}
              </button>

              {/* System Option */}
              <button
                type="button"
                onClick={() => handleThemeSelect("system")}
                className={`flex flex-col items-center p-5 rounded-2xl border transition-all text-center gap-3 ${
                  activeTheme === "system"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="p-3 rounded-full bg-secondary text-foreground">
                  <Laptop className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">System Default</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Match OS display settings</p>
                </div>
                {activeTheme === "system" && <Badge variant="primary" size="sm">Active</Badge>}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Notification Preferences */}
      {activeTab === "notifications" && (
        <form onSubmit={handleSaveNotifications} className="space-y-6 animate-fadeIn">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure notifications and automated financial threshold alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Switch
                checked={notifications.budgetAlerts}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, budgetAlerts: checked }))
                }
                label="Budget Threshold Warnings"
                description="Notify when monthly spending in any category crosses 80% or 100% of budget limit"
              />

              <div className="border-t border-border/40" />

              <Switch
                checked={notifications.recurringPaymentAlerts}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, recurringPaymentAlerts: checked }))
                }
                label="Recurring Payment Reminders"
                description="Alert 2 days prior to scheduled subscriptions, utility bills, and loan EMI payments"
              />

              <div className="border-t border-border/40" />

              <Switch
                checked={notifications.goalAlerts}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, goalAlerts: checked }))
                }
                label="Savings Goal Milestone Alerts"
                description="Celebrate reaching 25%, 50%, 75%, and 100% of savings goals"
              />

              <div className="border-t border-border/40" />

              <Switch
                checked={notifications.financialInsights}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, financialInsights: checked }))
                }
                label="Deterministic Financial Insights"
                description="Weekly deterministic summaries comparing income, expense trends, and savings rate"
              />

              <div className="border-t border-border/40" />

              <Switch
                checked={notifications.systemNotifications}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, systemNotifications: checked }))
                }
                label="System & Security Alerts"
                description="Important security notices, new login alerts, and system status updates"
              />
            </CardContent>
            <CardFooter className="flex justify-end p-4">
              <Button
                type="submit"
                isLoading={isSavingNotifications}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* TAB 4: Security / Change Password */}
      {activeTab === "security" && (
        <form onSubmit={handleChangePassword} className="space-y-6 animate-fadeIn">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Ensure your financial account remains secure with a strong password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordError && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium animate-fadeIn"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                />
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-secondary/30 text-xs space-y-1.5 text-muted-foreground">
                <span className="font-bold text-foreground">Password Security Policy:</span>
                <ul className="list-disc pl-5 space-y-0.5">
                  <li>At least 8 characters in length</li>
                  <li>Must contain at least one alphabetical letter</li>
                  <li>Must contain at least one numeric digit</li>
                  <li>Must not match your current password</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end p-4">
              <Button
                type="submit"
                isLoading={isChangingPassword}
                leftIcon={<Lock className="h-4 w-4" />}
              >
                Update Password
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* TAB 5: Danger Zone / Account Deletion */}
      {activeTab === "danger" && (
        <Card className="border-destructive/30 animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your FinTrack account and financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Export All Financial Data</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download a complete, sanitized JSON archive of all your accounts, transactions, budgets, goals, and recurring rules.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                isLoading={isExportingData}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export JSON Archive
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">Delete FinTrack Account</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permanently delete your profile, financial accounts, transaction records, and budgets. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setDeletePassword("");
                  setDeleteError(null);
                  setDeleteDialogOpen(true);
                }}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Deletion Password Confirmation Dialog */}
      <Dialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        size="sm"
        title="Confirm Account Deletion"
        description="Enter your account password to confirm permanent account deletion."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteAccount}
              isLoading={isDeletingAccount}
            >
              Permanently Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {deleteError && (
            <p className="text-xs text-destructive font-medium animate-fadeIn">{deleteError}</p>
          )}
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
          />
        </div>
      </Dialog>
    </div>
  );
};
