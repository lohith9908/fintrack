import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { BudgetService } from "../../services/budget.service";
import { CategoryService } from "../../services/category.service";
import {
  IBudget,
  BudgetSummary,
  BudgetStatus,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "../../types/budget.types";
import { ICategory } from "../../types/category.types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Progress,
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
import { formatCurrency, formatPercent } from "../../utils/formatters";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const BudgetsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency || "INR";

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilterTab, setActiveFilterTab] = useState<string>("ALL");

  // Modal Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<IBudget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState<string>("");
  const [formLimit, setFormLimit] = useState<number>(5000);
  const [formNotes, setFormNotes] = useState<string>("");
  const [formWarningThreshold, setFormWarningThreshold] = useState<number>(75);
  const [formCriticalThreshold, setFormCriticalThreshold] = useState<number>(90);

  // Delete Dialog state
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch expense categories
  const loadCategories = useCallback(async () => {
    try {
      const cats = await CategoryService.getCategories("EXPENSE");
      setCategories(cats);
    } catch {
      // Ignored
    }
  }, []);

  // Fetch budgets for currently selected month and year
  const loadBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await BudgetService.getBudgets({
        month: selectedMonth,
        year: selectedYear,
      });
      setBudgets(res.budgets);
      setSummary(res.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load budgets";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingBudget(null);
    setFormCategory(categories[0]?._id || "");
    setFormLimit(5000);
    setFormNotes("");
    setFormWarningThreshold(75);
    setFormCriticalThreshold(90);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (b: IBudget) => {
    setEditingBudget(b);
    setFormCategory(b.category._id);
    setFormLimit(b.limitAmount);
    setFormNotes(b.notes || "");
    setFormWarningThreshold(b.alertThresholds?.warning || 75);
    setFormCriticalThreshold(b.alertThresholds?.critical || 90);
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLimit || formLimit <= 0) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Budget limit amount must be greater than zero.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingBudget) {
        const payload: UpdateBudgetPayload = {
          limitAmount: formLimit,
          alertThresholds: {
            informational: 50,
            warning: formWarningThreshold,
            critical: formCriticalThreshold,
            exceeded: 100,
          },
          notes: formNotes || undefined,
        };
        await BudgetService.updateBudget(editingBudget._id, payload);
        toast({
          type: "success",
          title: "Budget Updated",
          message: "Category budget was updated successfully.",
        });
      } else {
        if (!formCategory) {
          toast({
            type: "error",
            title: "Validation Error",
            message: "Please select an expense category.",
          });
          return;
        }

        const payload: CreateBudgetPayload = {
          category: formCategory,
          month: selectedMonth,
          year: selectedYear,
          limitAmount: formLimit,
          alertThresholds: {
            informational: 50,
            warning: formWarningThreshold,
            critical: formCriticalThreshold,
            exceeded: 100,
          },
          notes: formNotes || undefined,
        };
        await BudgetService.createBudget(payload);
        toast({
          type: "success",
          title: "Budget Created",
          message: "Monthly category budget created successfully.",
        });
      }

      setIsModalOpen(false);
      loadBudgets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save budget";
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
  const handleDeleteBudget = async () => {
    if (!deletingBudgetId) return;
    try {
      setIsDeleting(true);
      await BudgetService.deleteBudget(deletingBudgetId);
      toast({
        type: "success",
        title: "Budget Deleted",
        message: "Category budget deleted successfully.",
      });
      setDeletingBudgetId(null);
      loadBudgets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete budget";
      toast({
        type: "error",
        title: "Deletion Failed",
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter budgets based on status tab
  const filteredBudgets = useMemo(() => {
    if (activeFilterTab === "ALL") return budgets;
    if (activeFilterTab === "HEALTHY")
      return budgets.filter((b) => b.status === "HEALTHY");
    if (activeFilterTab === "WARNING")
      return budgets.filter(
        (b) => b.status === "WARNING" || b.status === "CRITICAL"
      );
    if (activeFilterTab === "EXCEEDED")
      return budgets.filter((b) => b.status === "EXCEEDED");
    return budgets;
  }, [budgets, activeFilterTab]);

  const getStatusBadge = (status: BudgetStatus, percentage: number) => {
    switch (status) {
      case "EXCEEDED":
        return (
          <Badge variant="danger" size="sm" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Exceeded ({percentage}%)</span>
          </Badge>
        );
      case "CRITICAL":
        return (
          <Badge variant="danger" size="sm" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Critical ({percentage}%)</span>
          </Badge>
        );
      case "WARNING":
        return (
          <Badge variant="warning" size="sm" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Warning ({percentage}%)</span>
          </Badge>
        );
      case "HEALTHY":
      default:
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Healthy ({percentage}%)</span>
          </Badge>
        );
    }
  };

  const getProgressVariant = (status: BudgetStatus) => {
    switch (status) {
      case "EXCEEDED":
      case "CRITICAL":
        return "danger";
      case "WARNING":
        return "warning";
      case "HEALTHY":
      default:
        return "success";
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1440px] mx-auto pb-10">
      {/* Top Header & Month Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Monthly Budgets & Alerts
            </h1>
            <Badge variant="primary" size="sm">
              Phase 13
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Category spending allowances, threshold alerts, and deterministic monitoring.
          </p>
        </div>

        {/* Month Navigator & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePrevMonth}
              className="h-8 w-8 p-0"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-xs sm:text-sm font-bold text-foreground px-3 min-w-[120px] text-center">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleNextMonth}
              className="h-8 w-8 p-0"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCurrentMonth}
            className="text-xs"
          >
            This Month
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={loadBudgets}
            className="h-9 w-9 p-0"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleOpenCreateModal}
          >
            Set Up Budget
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
          title="Could not load monthly budgets"
          message={error}
          onRetry={loadBudgets}
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Budgeted */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">
                  Total Budgeted
                </CardDescription>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Target className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {formatCurrency(summary?.totalBudgeted || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Across {summary?.budgetCount || 0} active categories
                </div>
              </CardContent>
            </Card>

            {/* Total Spent */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-rose-500 uppercase tracking-wider">
                  Total Spent
                </CardDescription>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-rose-500 tracking-tight">
                  {formatCurrency(summary?.totalSpent || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Actual expenses recorded
                </div>
              </CardContent>
            </Card>

            {/* Remaining Budget */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-emerald-500 uppercase tracking-wider">
                  Remaining Budget
                </CardDescription>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-emerald-500 tracking-tight">
                  {formatCurrency(summary?.totalRemaining || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Unspent allowance surplus
                </div>
              </CardContent>
            </Card>

            {/* Overall Utilization */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-warning uppercase tracking-wider">
                  Budget Utilization
                </CardDescription>
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {formatPercent(summary?.overallPercentage || 0)}
                  </span>
                  {summary && summary.exceededCount > 0 ? (
                    <span className="text-xs font-bold text-rose-500">
                      {summary.exceededCount} Exceeded
                    </span>
                  ) : summary && summary.warningCount > 0 ? (
                    <span className="text-xs font-semibold text-amber-500">
                      {summary.warningCount} in Warning
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-500">
                      All Healthy
                    </span>
                  )}
                </div>
                <Progress
                  value={Math.min(100, summary?.overallPercentage || 0)}
                  variant={
                    (summary?.overallPercentage || 0) >= 100
                      ? "danger"
                      : (summary?.overallPercentage || 0) >= 75
                      ? "warning"
                      : "primary"
                  }
                  size="sm"
                />
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
                { id: "ALL", label: `All (${budgets.length})` },
                {
                  id: "HEALTHY",
                  label: `Healthy (${summary?.healthyCount || 0})`,
                },
                {
                  id: "WARNING",
                  label: `Warning / Critical (${summary?.warningCount || 0})`,
                },
                {
                  id: "EXCEEDED",
                  label: `Exceeded (${summary?.exceededCount || 0})`,
                },
              ]}
            />
          </div>

          {/* Budget Cards Grid */}
          {filteredBudgets.length === 0 ? (
            <EmptyState
              title={`No Budgets Found for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
              description={
                activeFilterTab !== "ALL"
                  ? "No category budgets match the selected status filter."
                  : "Establish category spending thresholds to keep track of monthly living expenses."
              }
              actionLabel={activeFilterTab === "ALL" ? "+ Set Up First Budget" : undefined}
              onAction={activeFilterTab === "ALL" ? handleOpenCreateModal : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBudgets.map((budget) => {
                const isOver = budget.spent > budget.limitAmount;
                const progressVariant = getProgressVariant(budget.status);

                return (
                  <Card
                    key={budget._id}
                    hover
                    className="border border-border/80 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: budget.category.color || "#3B82F6" }}
                          />
                          <div>
                            <CardTitle className="text-base font-bold text-foreground">
                              {budget.category.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {MONTH_NAMES[budget.month - 1]} {budget.year}
                            </CardDescription>
                          </div>
                        </div>

                        <Dropdown
                          trigger={
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              aria-label="Budget actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                          items={[
                            {
                              id: "edit",
                              label: "Edit Budget",
                              icon: <Edit2 className="h-3.5 w-3.5" />,
                              onClick: () => handleOpenEditModal(budget),
                            },
                            {
                              id: "delete",
                              label: "Delete Budget",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              destructive: true,
                              onClick: () => setDeletingBudgetId(budget._id),
                            },
                          ]}
                        />
                      </CardHeader>

                      {/* Card Body */}
                      <CardContent className="p-5 space-y-4">
                        {/* Spent vs Limit Amount */}
                        <div className="flex items-baseline justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                              Spent / Limit
                            </span>
                            <div className="text-xl font-extrabold text-foreground">
                              {formatCurrency(budget.spent, currency)}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                / {formatCurrency(budget.limitAmount, currency)}
                              </span>
                            </div>
                          </div>
                          <div>{getStatusBadge(budget.status, budget.percentage)}</div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <Progress
                            value={Math.min(100, budget.percentage)}
                            variant={progressVariant}
                            size="md"
                          />
                          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>
                              {isOver ? (
                                <strong className="text-rose-500 font-bold">
                                  {formatCurrency(budget.spent - budget.limitAmount, currency)} Over Limit
                                </strong>
                              ) : (
                                <span>
                                  <strong>{formatCurrency(budget.remaining, currency)}</strong> remaining
                                </span>
                              )}
                            </span>
                            <span>{budget.percentage}% Used</span>
                          </div>
                        </div>

                        {/* Notes if available */}
                        {budget.notes && (
                          <div className="p-2.5 rounded-lg bg-secondary/30 text-xs text-muted-foreground flex items-start gap-2">
                            <Info className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                            <span className="line-clamp-2 leading-relaxed">
                              {budget.notes}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </div>

                    {/* Card Footer: Link to Category Transactions */}
                    <div className="p-4 pt-0 border-t border-border/40 mt-2">
                      <Link
                        to={`/transactions?category=${budget.category._id}`}
                        className="text-xs font-semibold text-primary hover:underline flex items-center justify-between py-1"
                      >
                        <span>View Category Transactions</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal Dialog */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? `Edit ${editingBudget.category.name} Budget` : "Create Monthly Budget"}
        description="Allocate a category spending ceiling and define automated warning thresholds."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingBudget ? (
            <Select
              label="Expense Category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              options={categories.map((c) => ({
                value: c._id,
                label: c.name,
              }))}
              required
            />
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Category</label>
              <div className="p-2.5 rounded-xl border border-border bg-secondary/40 text-xs font-bold text-foreground">
                {editingBudget.category.name} ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Month</label>
              <div className="p-2.5 rounded-xl border border-border bg-secondary/40 text-xs font-semibold text-foreground">
                {MONTH_NAMES[selectedMonth - 1]}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Year</label>
              <div className="p-2.5 rounded-xl border border-border bg-secondary/40 text-xs font-semibold text-foreground">
                {selectedYear}
              </div>
            </div>
          </div>

          <CurrencyInput
            label="Monthly Limit Amount"
            value={formLimit}
            onChangeValue={setFormLimit}
            currencySymbol={currency === "INR" ? "₹" : currency}
            required
          />

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
            <Input
              label="Warning Threshold (%)"
              type="number"
              min={1}
              max={100}
              value={formWarningThreshold}
              onChange={(e) => setFormWarningThreshold(parseInt(e.target.value, 10) || 75)}
              helperText="Alert triggered when reaching this %"
            />
            <Input
              label="Critical Threshold (%)"
              type="number"
              min={1}
              max={100}
              value={formCriticalThreshold}
              onChange={(e) => setFormCriticalThreshold(parseInt(e.target.value, 10) || 90)}
              helperText="Urgent alert before limit"
            />
          </div>

          <Textarea
            label="Budget Notes (Optional)"
            placeholder="e.g. Include groceries and weekly lunches"
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
              {editingBudget ? "Update Budget" : "Save Budget"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingBudgetId !== null}
        onClose={() => setDeletingBudgetId(null)}
        onConfirm={handleDeleteBudget}
        title="Delete Monthly Budget"
        message="Are you sure you want to remove this category budget? Existing recorded transactions will not be deleted."
        confirmLabel="Delete Budget"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
