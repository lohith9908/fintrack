import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Building2,
  Wallet,
  CreditCard,
  Smartphone,
  Layers,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Tags,
  Lock,
} from "lucide-react";
import { AccountService } from "../../services/account.service";
import { CategoryService } from "../../services/category.service";
import {
  IAccount,
  AccountsSummary,
  AccountType,
  CreateAccountPayload,
} from "../../types/account.types";
import {
  ICategory,
  CategoryType,
  CreateCategoryPayload,
} from "../../types/category.types";
import {
  Button,
  Input,
  Select,
  CurrencyInput,
  Textarea,
  Tabs,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  Dropdown,
  Skeleton,
  EmptyState,
  ErrorState,
  ConfirmDialog,
} from "../../components/ui";
import { useToast } from "../../components/ui/Toast";
import { formatCurrency } from "../../utils/formatters";

// Icon and Color palette mappings
const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  BANK_ACCOUNT: {
    label: "Bank Account",
    icon: Building2,
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  CASH: {
    label: "Cash Wallet",
    icon: Wallet,
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  UPI: {
    label: "UPI Wallet",
    icon: Smartphone,
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  },
  CREDIT_CARD: {
    label: "Credit Card",
    icon: CreditCard,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  OTHER: {
    label: "Other Asset",
    icon: Layers,
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
};

const CATEGORY_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#64748B", // Slate
];

export const AccountsPage: React.FC = () => {
  const toast = useToast();

  // State: Accounts
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [summary, setSummary] = useState<AccountsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // State: Account Dialogs
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<IAccount | null>(null);
  const [accountFormData, setAccountFormData] = useState<CreateAccountPayload>({
    name: "",
    type: "BANK_ACCOUNT",
    openingBalance: 0,
    currency: "INR",
    notes: "",
  });
  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);

  // State: Deactivate/Delete confirmation
  const [accountToDelete, setAccountToDelete] = useState<IAccount | null>(null);
  const [accountToDeactivate, setAccountToDeactivate] = useState<IAccount | null>(null);

  // State: Categories Manager
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [categoryTypeTab, setCategoryTypeTab] = useState<CategoryType>("EXPENSE");
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState<CreateCategoryPayload>({
    name: "",
    type: "EXPENSE",
    icon: "Tag",
    color: "#EF4444",
  });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Fetch Accounts
  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await AccountService.getAccounts();
      setAccounts(data.accounts);
      setSummary(data.summary);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load accounts";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Categories
  const loadCategories = useCallback(async () => {
    try {
      setIsCategoriesLoading(true);
      const data = await CategoryService.getCategories();
      setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setIsCategoriesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    if (activeFilter === "all") return acc.status !== "ARCHIVED";
    if (activeFilter === "bank") return acc.type === "BANK_ACCOUNT" && acc.status !== "ARCHIVED";
    if (activeFilter === "cash_upi") return (acc.type === "CASH" || acc.type === "UPI") && acc.status !== "ARCHIVED";
    if (activeFilter === "credit") return acc.type === "CREDIT_CARD" && acc.status !== "ARCHIVED";
    if (activeFilter === "archived") return acc.status === "ARCHIVED" || acc.status === "INACTIVE";
    return true;
  });

  // Handle Account Form Open
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccountFormData({
      name: "",
      type: "BANK_ACCOUNT",
      openingBalance: 0,
      currency: "INR",
      notes: "",
    });
    setIsAddAccountOpen(true);
  };

  const handleOpenEditAccount = (acc: IAccount) => {
    setEditingAccount(acc);
    setAccountFormData({
      name: acc.name,
      type: acc.type,
      openingBalance: acc.openingBalance,
      currency: acc.currency,
      notes: acc.notes || "",
    });
    setIsAddAccountOpen(true);
  };

  // Handle Account Submit (Create / Edit)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountFormData.name.trim()) {
      toast.warning("Please enter an account name");
      return;
    }

    try {
      setIsSubmittingAccount(true);
      if (editingAccount) {
        await AccountService.updateAccount(editingAccount._id, {
          name: accountFormData.name.trim(),
          type: accountFormData.type,
          currency: accountFormData.currency,
          notes: accountFormData.notes?.trim(),
        });
        toast.success("Account updated successfully");
      } else {
        await AccountService.createAccount(accountFormData);
        toast.success("Account created successfully");
      }
      setIsAddAccountOpen(false);
      loadAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save account";
      toast.error(msg);
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  // Handle Deactivate Account
  const handleConfirmDeactivate = async () => {
    if (!accountToDeactivate) return;
    try {
      await AccountService.deactivateAccount(accountToDeactivate._id, true);
      toast.success(`${accountToDeactivate.name} archived`);
      setAccountToDeactivate(null);
      loadAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to archive account";
      toast.error(msg);
    }
  };

  // Handle Delete Account
  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    try {
      const res = await AccountService.deleteAccount(accountToDelete._id);
      toast.success(res.message);
      setAccountToDelete(null);
      loadAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      toast.error(msg);
    }
  };

  // Handle Categories Management
  const handleOpenCategories = () => {
    loadCategories();
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryData.name.trim()) {
      toast.warning("Category name is required");
      return;
    }

    try {
      setIsSubmittingCategory(true);
      await CategoryService.createCategory({
        ...newCategoryData,
        type: categoryTypeTab,
      });
      toast.success("Custom category created");
      setNewCategoryData({
        name: "",
        type: categoryTypeTab,
        icon: "Tag",
        color: categoryTypeTab === "INCOME" ? "#10B981" : "#EF4444",
      });
      loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      toast.error(msg);
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: ICategory) => {
    try {
      await CategoryService.deleteCategory(cat._id);
      toast.success("Category deleted");
      loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1440px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Wallet className="h-3 w-3" />
            <span>Phase 8 Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Accounts & Wallets
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your bank accounts, cash reserves, credit cards, and custom categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenCategories}
            className="flex items-center gap-2"
          >
            <Tags className="h-4 w-4" />
            <span>Categories</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddAccount}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card hover className="bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Total Net Worth
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(summary.totalNetWorth)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Assets minus liabilities across {summary.activeAccountsCount} active accounts
              </p>
            </CardContent>
          </Card>

          <Card hover className="bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Bank Balances
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(summary.totalBankBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Savings & checking bank deposits
              </p>
            </CardContent>
          </Card>

          <Card hover className="bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Cash & UPI Wallets
                </CardTitle>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Smartphone className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(summary.totalCashUpiBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Instant liquidity & digital wallets
              </p>
            </CardContent>
          </Card>

          <Card hover className="bg-gradient-to-br from-card to-card/80 border-amber-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-wider text-amber-500 font-semibold">
                  Credit Card Liabilities
                </CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-amber-500">
                {formatCurrency(summary.totalCreditLiabilities)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total outstanding credit card balance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
          variant="pill"
          tabs={[
            { id: "all", label: "All Wallets", badge: accounts.filter((a) => a.status !== "ARCHIVED").length.toString() },
            { id: "bank", label: "Bank Accounts" },
            { id: "cash_upi", label: "Cash & UPI" },
            { id: "credit", label: "Credit Cards" },
            { id: "archived", label: "Archived" },
          ]}
        />
      </div>

      {/* Accounts Content Grid / States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton variant="card" className="h-44" />
          <Skeleton variant="card" className="h-44" />
          <Skeleton variant="card" className="h-44" />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load accounts"
          message={error}
          onRetry={loadAccounts}
        />
      ) : filteredAccounts.length === 0 ? (
        <EmptyState
          title={activeFilter === "all" ? "No accounts created yet" : "No accounts match this filter"}
          description={
            activeFilter === "all"
              ? "Start tracking your financial health by adding your primary bank account or cash wallet."
              : "Try switching tabs or adding a new account under this category."
          }
          actionLabel="Add Account"
          onAction={handleOpenAddAccount}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAccounts.map((account) => {
            const config = ACCOUNT_TYPE_CONFIG[account.type] || ACCOUNT_TYPE_CONFIG.OTHER;
            const Icon = config.icon;
            const isCredit = account.type === "CREDIT_CARD";

            return (
              <Card
                key={account._id}
                hover
                className={`relative flex flex-col justify-between transition-all ${
                  account.status === "ARCHIVED" ? "opacity-60 border-dashed" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground line-clamp-1">
                          {account.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground font-medium">
                            {config.label}
                          </span>
                          {account.status !== "ACTIVE" && (
                            <Badge variant="outline" size="sm">
                              {account.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Dropdown
                      trigger={
                        <button
                          aria-label="Account actions menu"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      }
                      items={[
                        {
                          id: "edit",
                          label: "Edit Details",
                          icon: <Edit2 className="h-3.5 w-3.5" />,
                          onClick: () => handleOpenEditAccount(account),
                        },
                        {
                          id: "archive",
                          label: account.status === "ARCHIVED" ? "Deactivate" : "Archive Account",
                          icon: <Archive className="h-3.5 w-3.5" />,
                          onClick: () => setAccountToDeactivate(account),
                        },
                        {
                          id: "delete",
                          label: "Delete Permanently",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          destructive: true,
                          onClick: () => setAccountToDelete(account),
                        },
                      ]}
                    />
                  </div>
                </CardHeader>

                <CardContent className="pt-2 pb-4 space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {isCredit ? "Outstanding Liability" : "Current Balance"}
                    </span>
                    <div
                      className={`text-2xl font-bold tracking-tight ${
                        isCredit ? "text-amber-500" : "text-foreground"
                      }`}
                    >
                      {formatCurrency(account.currentBalance, account.currency)}
                    </div>
                  </div>

                  {account.notes && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-1 bg-secondary/50 p-2 rounded-lg border border-border/50">
                      {account.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Account Dialog */}
      <Dialog
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        title={editingAccount ? "Edit Account" : "Add Financial Account"}
        description={
          editingAccount
            ? "Update the details and notes for this financial account."
            : "Connect a new bank account, cash reserve, UPI wallet, or credit card."
        }
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <Input
            label="Account Name *"
            placeholder="e.g. HDFC Salary Account, Physical Wallet"
            value={accountFormData.name}
            onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Account Type *"
              value={accountFormData.type}
              onChange={(e) =>
                setAccountFormData({
                  ...accountFormData,
                  type: e.target.value as AccountType,
                })
              }
              options={[
                { value: "BANK_ACCOUNT", label: "Bank Account" },
                { value: "CASH", label: "Cash Wallet" },
                { value: "UPI", label: "UPI Wallet" },
                { value: "CREDIT_CARD", label: "Credit Card" },
                { value: "OTHER", label: "Other Asset" },
              ]}
            />

            <Select
              label="Currency *"
              value={accountFormData.currency}
              onChange={(e) => setAccountFormData({ ...accountFormData, currency: e.target.value })}
              options={[
                { value: "INR", label: "INR (₹) - Indian Rupee" },
                { value: "USD", label: "USD ($) - US Dollar" },
                { value: "EUR", label: "EUR (€) - Euro" },
                { value: "GBP", label: "GBP (£) - British Pound" },
              ]}
            />
          </div>

          {!editingAccount && (
            <CurrencyInput
              label="Opening Balance"
              currencySymbol={accountFormData.currency === "USD" ? "$" : "₹"}
              value={accountFormData.openingBalance?.toString() || "0"}
              onChangeValue={(val: number) =>
                setAccountFormData({ ...accountFormData, openingBalance: val || 0 })
              }
              helperText={
                accountFormData.type === "CREDIT_CARD"
                  ? "Enter any current outstanding balance on this card."
                  : "Initial amount available in this account."
              }
            />
          )}

          <Textarea
            label="Notes & Details (Optional)"
            placeholder="e.g. Primary salary account, statement cycle on 15th"
            value={accountFormData.notes}
            onChange={(e) => setAccountFormData({ ...accountFormData, notes: e.target.value })}
            maxCharacters={500}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddAccountOpen(false)}
              disabled={isSubmittingAccount}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingAccount}>
              {editingAccount ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Categories Manager Dialog */}
      <Dialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Transaction Categories"
        description="Organize your income and expense records with system defaults and custom tags."
      >
        <div className="space-y-6">
          {/* Income vs Expense Tabs */}
          <Tabs
            activeTab={categoryTypeTab}
            onTabChange={(tab) => setCategoryTypeTab(tab as CategoryType)}
            variant="pill"
            tabs={[
              { id: "EXPENSE", label: "Expense Categories" },
              { id: "INCOME", label: "Income Categories" },
            ]}
          />

          {/* Add Custom Category Form */}
          <form
            onSubmit={handleCreateCategory}
            className="p-4 rounded-xl bg-card border border-border space-y-3"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Add New Custom {categoryTypeTab === "INCOME" ? "Income" : "Expense"} Category
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="e.g. Crypto Staking, Pet Care"
                value={newCategoryData.name}
                onChange={(e) =>
                  setNewCategoryData({ ...newCategoryData, name: e.target.value })
                }
                className="flex-1"
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingCategory}
                className="whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </div>

            {/* Color Palette Picker */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground mr-1">Color:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategoryData({ ...newCategoryData, color })}
                    className={`h-5 w-5 rounded-full border-2 transition-transform ${
                      newCategoryData.color === color
                        ? "scale-125 border-foreground"
                        : "border-transparent hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </form>

          {/* Categories List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {isCategoriesLoading ? (
              <div className="space-y-2">
                <Skeleton variant="text" className="h-10" />
                <Skeleton variant="text" className="h-10" />
                <Skeleton variant="text" className="h-10" />
              </div>
            ) : (
              categories
                .filter((cat) => cat.type === categoryTypeTab)
                .map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border hover:bg-secondary/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: cat.color || "#3B82F6" }}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {cat.name}
                      </span>
                      {cat.isSystem ? (
                        <Badge variant="secondary" size="sm" className="text-[10px] flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          System
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm" className="text-[10px]">
                          Custom
                        </Badge>
                      )}
                    </div>

                    {!cat.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(cat)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${cat.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </Dialog>

      {/* Deactivate / Archive Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!accountToDeactivate}
        onClose={() => setAccountToDeactivate(null)}
        onConfirm={handleConfirmDeactivate}
        title="Archive Financial Account?"
        message={`Are you sure you want to archive "${accountToDeactivate?.name}"? Its balance will be removed from active totals, but recorded transactions will be preserved.`}
        confirmLabel="Archive Account"
      />

      {/* Delete Permanently Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!accountToDelete}
        onClose={() => setAccountToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Financial Account?"
        message={`Permanently delete "${accountToDelete?.name}"? If it has linked transactions, it will be safely archived instead to protect ledger integrity.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};
