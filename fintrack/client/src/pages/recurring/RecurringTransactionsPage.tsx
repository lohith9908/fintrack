import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  RefreshCw,
  Zap,
  Info,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { RecurringService } from "../../services/recurring.service";
import { CategoryService } from "../../services/category.service";
import { AccountService } from "../../services/account.service";
import {
  IRecurringTransaction,
  RecurringSummary,
  RecurringFrequency,
  CreateRecurringPayload,
  UpdateRecurringPayload,
} from "../../types/recurring.types";
import { ICategory } from "../../types/category.types";
import { IAccount } from "../../types/account.types";
import { PaymentMethod, TransactionType } from "../../types/transaction.types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Dialog,
  ConfirmDialog,
  Select,
  Input,
  CurrencyInput,
  Textarea,
  Tabs,
  Skeleton,
  ErrorState,
  EmptyState,
  Dropdown,
} from "../../components/ui";
import { formatCurrency, formatDate } from "../../utils/formatters";

export const RecurringTransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency || "INR";

  const [recurringRules, setRecurringRules] = useState<IRecurringTransaction[]>([]);
  const [summary, setSummary] = useState<RecurringSummary | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilterTab, setActiveFilterTab] = useState<string>("ALL");
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<IRecurringTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formName, setFormName] = useState<string>("");
  const [formAmount, setFormAmount] = useState<number>(1000);
  const [formType, setFormType] = useState<TransactionType>("EXPENSE");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formAccount, setFormAccount] = useState<string>("");
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>("UPI");
  const [formFrequency, setFormFrequency] = useState<RecurringFrequency>("MONTHLY");
  const [formStartDate, setFormStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [formEndDate, setFormEndDate] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");

  // Delete Dialog state
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Categories and Accounts
  const loadDependencies = useCallback(async () => {
    try {
      const [cats, accs] = await Promise.all([
        CategoryService.getCategories(),
        AccountService.getAccounts(),
      ]);
      setCategories(cats);
      setAccounts(accs.accounts);
    } catch {
      // Handled gracefully
    }
  }, []);

  // Fetch recurring rules
  const loadRecurringRules = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await RecurringService.getRecurringRules();
      setRecurringRules(res.recurringTransactions);
      setSummary(res.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load recurring transactions";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  useEffect(() => {
    loadRecurringRules();
  }, [loadRecurringRules]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormName("");
    setFormAmount(1000);
    setFormType("EXPENSE");
    const expCat = categories.find((c) => c.type === "EXPENSE");
    setFormCategory(expCat?._id || categories[0]?._id || "");
    setFormAccount(accounts[0]?._id || "");
    setFormPaymentMethod("UPI");
    setFormFrequency("MONTHLY");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate("");
    setFormNotes("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rule: IRecurringTransaction) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormAmount(rule.amount);
    setFormType(rule.type);
    setFormCategory(rule.category._id);
    setFormAccount(rule.account._id);
    setFormPaymentMethod(rule.paymentMethod);
    setFormFrequency(rule.frequency);
    setFormStartDate(new Date(rule.startDate).toISOString().split("T")[0]);
    setFormEndDate(rule.endDate ? new Date(rule.endDate).toISOString().split("T")[0] : "");
    setFormNotes(rule.notes || "");
    setIsModalOpen(true);
  };

  // Run Scheduler / Process Due Payments
  const handleProcessDue = async () => {
    try {
      setIsProcessing(true);
      const res = await RecurringService.processDueTransactions();
      toast({
        type: "success",
        title: "Scheduler Execution Completed",
        message: `Processed ${res.processedCount} due recurring transactions.`,
      });
      loadRecurringRules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process due recurring items";
      toast({
        type: "error",
        title: "Scheduler Error",
        message: msg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Pause / Resume
  const handleToggleActive = async (rule: IRecurringTransaction) => {
    try {
      if (rule.isActive) {
        await RecurringService.pauseRecurringRule(rule._id);
        toast({
          type: "info",
          title: "Schedule Paused",
          message: `Recurring rule "${rule.name}" has been paused.`,
        });
      } else {
        await RecurringService.resumeRecurringRule(rule._id);
        toast({
          type: "success",
          title: "Schedule Resumed",
          message: `Recurring rule "${rule.name}" is now active.`,
        });
      }
      loadRecurringRules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast({
        type: "error",
        title: "Action Failed",
        message: msg,
      });
    }
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Rule name is required.",
      });
      return;
    }

    if (!formAmount || formAmount <= 0) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Amount must be greater than zero.",
      });
      return;
    }

    if (!formCategory) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Please select a category.",
      });
      return;
    }

    if (!formAccount) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Please select an account.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingRule) {
        const payload: UpdateRecurringPayload = {
          name: formName.trim(),
          amount: formAmount,
          type: formType,
          category: formCategory,
          account: formAccount,
          paymentMethod: formPaymentMethod,
          frequency: formFrequency,
          startDate: formStartDate,
          endDate: formEndDate || undefined,
          notes: formNotes || undefined,
        };
        await RecurringService.updateRecurringRule(editingRule._id, payload);
        toast({
          type: "success",
          title: "Recurring Rule Updated",
          message: "Recurring schedule was updated successfully.",
        });
      } else {
        const payload: CreateRecurringPayload = {
          name: formName.trim(),
          amount: formAmount,
          type: formType,
          category: formCategory,
          account: formAccount,
          paymentMethod: formPaymentMethod,
          frequency: formFrequency,
          startDate: formStartDate,
          endDate: formEndDate || undefined,
          notes: formNotes || undefined,
        };
        await RecurringService.createRecurringRule(payload);
        toast({
          type: "success",
          title: "Recurring Rule Created",
          message: "New recurring schedule was established successfully.",
        });
      }

      setIsModalOpen(false);
      loadRecurringRules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save recurring rule";
      toast({
        type: "error",
        title: "Operation Failed",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleDeleteRule = async () => {
    if (!deletingRuleId) return;
    try {
      setIsDeleting(true);
      await RecurringService.deleteRecurringRule(deletingRuleId);
      toast({
        type: "success",
        title: "Rule Deleted",
        message: "Recurring schedule removed successfully.",
      });
      setDeletingRuleId(null);
      loadRecurringRules();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete recurring rule";
      toast({
        type: "error",
        title: "Deletion Failed",
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter rules based on active tab
  const filteredRules = useMemo(() => {
    if (activeFilterTab === "ALL") return recurringRules;
    if (activeFilterTab === "EXPENSE")
      return recurringRules.filter((r) => r.type === "EXPENSE");
    if (activeFilterTab === "INCOME")
      return recurringRules.filter((r) => r.type === "INCOME");
    if (activeFilterTab === "ACTIVE")
      return recurringRules.filter((r) => r.isActive);
    if (activeFilterTab === "PAUSED")
      return recurringRules.filter((r) => !r.isActive);
    return recurringRules;
  }, [recurringRules, activeFilterTab]);

  const availableCategories = useMemo(() => {
    return categories.filter((c) => c.type === formType);
  }, [categories, formType]);

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1440px] mx-auto pb-10">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Recurring Transactions & Scheduler
            </h1>
            <Badge variant="primary" size="sm">
              Phase 14
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Automated recurring bills, subscriptions, salary credits, and deterministic scheduler.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={loadRecurringRules}
            className="h-9 w-9 p-0"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<Zap className="h-4 w-4 text-amber-500" />}
            onClick={handleProcessDue}
            isLoading={isProcessing}
          >
            Process Due Now
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleOpenCreateModal}
          >
            New Recurring Rule
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton variant="rectangular" className="h-28 w-full" />
            <Skeleton variant="rectangular" className="h-28 w-full" />
            <Skeleton variant="rectangular" className="h-28 w-full" />
            <Skeleton variant="rectangular" className="h-28 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton variant="rectangular" className="h-52 w-full" />
            <Skeleton variant="rectangular" className="h-52 w-full" />
            <Skeleton variant="rectangular" className="h-52 w-full" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load recurring transactions"
          message={error}
          onRetry={loadRecurringRules}
        />
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Active Rules */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">
                  Active Schedules
                </CardDescription>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Repeat className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {summary?.activeCount || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summary?.pausedCount || 0} paused rules
                </div>
              </CardContent>
            </Card>

            {/* Monthly Recurring Expenses */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-rose-500 uppercase tracking-wider">
                  Monthly Expenses
                </CardDescription>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-rose-500 tracking-tight">
                  {formatCurrency(summary?.totalMonthlyExpenses || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Subscriptions & regular bills
                </div>
              </CardContent>
            </Card>

            {/* Monthly Recurring Income */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-emerald-500 uppercase tracking-wider">
                  Monthly Income
                </CardDescription>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-emerald-500 tracking-tight">
                  {formatCurrency(summary?.totalMonthlyIncome || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Salary & regular deposits
                </div>
              </CardContent>
            </Card>

            {/* Next Upcoming Due */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-warning uppercase tracking-wider">
                  Next Due
                </CardDescription>
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <Calendar className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {summary?.nextUpcoming ? (
                  <>
                    <div className="text-base font-extrabold text-foreground truncate">
                      {summary.nextUpcoming.name}
                    </div>
                    <div className="text-xs font-semibold text-warning">
                      {formatDate(summary.nextUpcoming.nextOccurrence)} (
                      {formatCurrency(summary.nextUpcoming.amount, currency)})
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-bold text-muted-foreground">None scheduled</div>
                    <div className="text-xs text-muted-foreground">All schedules up to date</div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Tabs
              activeTab={activeFilterTab}
              onTabChange={setActiveFilterTab}
              variant="pill"
              tabs={[
                { id: "ALL", label: `All (${recurringRules.length})` },
                {
                  id: "EXPENSE",
                  label: `Expenses (${recurringRules.filter((r) => r.type === "EXPENSE").length})`,
                },
                {
                  id: "INCOME",
                  label: `Income (${recurringRules.filter((r) => r.type === "INCOME").length})`,
                },
                {
                  id: "ACTIVE",
                  label: `Active (${summary?.activeCount || 0})`,
                },
                {
                  id: "PAUSED",
                  label: `Paused (${summary?.pausedCount || 0})`,
                },
              ]}
            />
          </div>

          {/* Recurring Rules Grid */}
          {filteredRules.length === 0 ? (
            <EmptyState
              title="No Recurring Schedules Found"
              description="Automate repetitive expenses and income entries with scheduled execution."
              actionLabel="+ Create Recurring Schedule"
              onAction={handleOpenCreateModal}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRules.map((rule) => {
                const isIncome = rule.type === "INCOME";

                return (
                  <Card
                    key={rule._id}
                    hover
                    className="border border-border/80 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: rule.category.color || "#3B82F6" }}
                          />
                          <div>
                            <CardTitle className="text-base font-bold text-foreground">
                              {rule.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {rule.category.name} • {rule.account.name}
                            </CardDescription>
                          </div>
                        </div>

                        <Dropdown
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                          items={[
                            {
                              id: "toggle",
                              label: rule.isActive ? "Pause Schedule" : "Resume Schedule",
                              icon: rule.isActive ? (
                                <Pause className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <Play className="h-3.5 w-3.5 text-emerald-500" />
                              ),
                              onClick: () => handleToggleActive(rule),
                            },
                            {
                              id: "edit",
                              label: "Edit Rule",
                              icon: <Edit2 className="h-3.5 w-3.5" />,
                              onClick: () => handleOpenEditModal(rule),
                            },
                            {
                              id: "delete",
                              label: "Delete Rule",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              destructive: true,
                              onClick: () => setDeletingRuleId(rule._id),
                            },
                          ]}
                        />
                      </CardHeader>

                      {/* Card Content */}
                      <CardContent className="p-5 space-y-4">
                        {/* Amount & Frequency */}
                        <div className="flex items-baseline justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                              Amount
                            </span>
                            <div
                              className={`text-xl font-extrabold ${
                                isIncome ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {isIncome ? "+" : "-"}
                              {formatCurrency(rule.amount, currency)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" size="sm">
                              {rule.frequency}
                            </Badge>
                            <Badge variant={rule.isActive ? "success" : "secondary"} size="sm">
                              {rule.isActive ? "Active" : "Paused"}
                            </Badge>
                          </div>
                        </div>

                        {/* Next Due & Payment Method */}
                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/40">
                          <div>
                            <span className="text-muted-foreground block font-medium">Next Due</span>
                            <span className="font-bold text-foreground">
                              {formatDate(rule.nextOccurrence)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block font-medium">Method</span>
                            <span className="font-bold text-foreground">
                              {rule.paymentMethod.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {rule.notes && (
                          <div className="p-2.5 rounded-lg bg-secondary/30 text-xs text-muted-foreground flex items-start gap-2">
                            <Info className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                            <span className="line-clamp-2 leading-relaxed">{rule.notes}</span>
                          </div>
                        )}
                      </CardContent>
                    </div>

                    {/* Footer Quick Action */}
                    <div className="p-4 pt-0 border-t border-border/40 mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Started: {formatDate(rule.startDate)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(rule)}
                        className="text-xs h-7 px-2"
                      >
                        {rule.isActive ? "Pause" : "Resume"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Recurring Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? `Edit Recurring Schedule` : "Create Recurring Schedule"}
        description="Define an automated recurring financial rule with automatic next-occurrence generation."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Schedule Name"
            placeholder="e.g. Netflix Subscription, House Rent"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="Amount"
              value={formAmount}
              onChangeValue={setFormAmount}
              currencySymbol={currency === "INR" ? "₹" : currency}
              required
            />
            <Select
              label="Transaction Type"
              value={formType}
              onChange={(e) => {
                const nextType = e.target.value as TransactionType;
                setFormType(nextType);
                const nextCats = categories.filter((c) => c.type === nextType);
                setFormCategory(nextCats[0]?._id || "");
              }}
              options={[
                { value: "EXPENSE", label: "Expense" },
                { value: "INCOME", label: "Income" },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              options={availableCategories.map((c) => ({
                value: c._id,
                label: c.name,
              }))}
              required
            />
            <Select
              label="Account / Wallet"
              value={formAccount}
              onChange={(e) => setFormAccount(e.target.value)}
              options={accounts.map((a) => ({
                value: a._id,
                label: `${a.name} (${formatCurrency(a.currentBalance, currency)})`,
              }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Frequency"
              value={formFrequency}
              onChange={(e) => setFormFrequency(e.target.value as RecurringFrequency)}
              options={[
                { value: "DAILY", label: "Daily" },
                { value: "WEEKLY", label: "Weekly" },
                { value: "MONTHLY", label: "Monthly" },
                { value: "YEARLY", label: "Yearly" },
              ]}
              required
            />
            <Select
              label="Payment Method"
              value={formPaymentMethod}
              onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
              options={[
                { value: "UPI", label: "UPI" },
                { value: "CREDIT_CARD", label: "Credit Card" },
                { value: "DEBIT_CARD", label: "Debit Card" },
                { value: "BANK_TRANSFER", label: "Net Banking" },
                { value: "CASH", label: "Cash" },
                { value: "OTHER", label: "Other" },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={formEndDate}
              onChange={(e) => setFormEndDate(e.target.value)}
              helperText="Leave empty for indefinite schedule"
            />
          </div>

          <Textarea
            label="Notes (Optional)"
            placeholder="e.g. Account number, billing reference"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            rows={2}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingRule ? "Update Schedule" : "Save Schedule"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingRuleId !== null}
        onClose={() => setDeletingRuleId(null)}
        onConfirm={handleDeleteRule}
        title="Delete Recurring Schedule"
        message="Are you sure you want to delete this recurring schedule? Previously created historical transactions will remain in your ledger."
        confirmLabel="Delete Rule"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
