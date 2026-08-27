import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  CheckCircle2,
  Pause,
  Play,
  Trash2,
  Edit2,
  Calendar,
  History,
  MoreVertical,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { GoalService } from "../../services/goal.service";
import { AccountService } from "../../services/account.service";
import {
  ISavingsGoal,
  GoalSummary,
  SavingsGoalStatus,
  CreateGoalPayload,
  UpdateGoalPayload,
  AddContributionPayload,
} from "../../types/goal.types";
import { IAccount } from "../../types/account.types";
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
import { formatCurrency, formatDate, formatPercent } from "../../utils/formatters";

export const SavingsGoalsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = user?.currency || "INR";

  const [goals, setGoals] = useState<ISavingsGoal[]>([]);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilterTab, setActiveFilterTab] = useState<string>("ALL");

  // Modal Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ISavingsGoal | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Goal Form State
  const [formName, setFormName] = useState<string>("");
  const [formTargetAmount, setFormTargetAmount] = useState<number>(50000);
  const [formCurrentAmount, setFormCurrentAmount] = useState<number>(0);
  const [formTargetDate, setFormTargetDate] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("Emergency Fund");
  const [formDescription, setFormDescription] = useState<string>("");

  // Contribution Modal State
  const [contributingGoal, setContributingGoal] = useState<ISavingsGoal | null>(null);
  const [contribAmount, setContribAmount] = useState<number>(5000);
  const [contribAccount, setContribAccount] = useState<string>("");
  const [contribDate, setContribDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [contribNote, setContribNote] = useState<string>("");
  const [isContributing, setIsContributing] = useState(false);

  // History Dialog State
  const [historyGoal, setHistoryGoal] = useState<ISavingsGoal | null>(null);

  // Delete Dialog state
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Accounts for contribution
  const loadAccounts = useCallback(async () => {
    try {
      const accs = await AccountService.getAccounts();
      setAccounts(accs.accounts);
    } catch {
      // Ignored
    }
  }, []);

  // Fetch savings goals
  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await GoalService.getGoals();
      setGoals(res.goals);
      setSummary(res.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load savings goals";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Open Create Goal Modal
  const handleOpenCreateModal = () => {
    setEditingGoal(null);
    setFormName("");
    setFormTargetAmount(50000);
    setFormCurrentAmount(0);
    setFormTargetDate(
      new Date(Date.now() + 86400000 * 90).toISOString().split("T")[0]
    );
    setFormCategory("Emergency Fund");
    setFormDescription("");
    setIsModalOpen(true);
  };

  // Open Edit Goal Modal
  const handleOpenEditModal = (goal: ISavingsGoal) => {
    setEditingGoal(goal);
    setFormName(goal.name);
    setFormTargetAmount(goal.targetAmount);
    setFormCurrentAmount(goal.currentAmount);
    setFormTargetDate(
      goal.targetDate ? new Date(goal.targetDate).toISOString().split("T")[0] : ""
    );
    setFormCategory(goal.category || "General Savings");
    setFormDescription(goal.description || "");
    setIsModalOpen(true);
  };

  // Open Contribution Modal
  const handleOpenContributeModal = (goal: ISavingsGoal) => {
    setContributingGoal(goal);
    setContribAmount(Math.min(5000, goal.remainingAmount || 5000));
    setContribAccount(accounts[0]?._id || "");
    setContribDate(new Date().toISOString().split("T")[0]);
    setContribNote("");
  };

  // Submit Goal Create / Edit
  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Goal name is required.",
      });
      return;
    }

    if (!formTargetAmount || formTargetAmount <= 0) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Target amount must be greater than zero.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingGoal) {
        const payload: UpdateGoalPayload = {
          name: formName.trim(),
          targetAmount: formTargetAmount,
          currentAmount: formCurrentAmount,
          targetDate: formTargetDate || undefined,
          category: formCategory.trim() || undefined,
          description: formDescription.trim() || undefined,
        };
        await GoalService.updateGoal(editingGoal._id, payload);
        toast({
          type: "success",
          title: "Goal Updated",
          message: "Savings goal updated successfully.",
        });
      } else {
        const payload: CreateGoalPayload = {
          name: formName.trim(),
          targetAmount: formTargetAmount,
          currentAmount: formCurrentAmount,
          targetDate: formTargetDate || undefined,
          category: formCategory.trim() || undefined,
          description: formDescription.trim() || undefined,
        };
        await GoalService.createGoal(payload);
        toast({
          type: "success",
          title: "Savings Goal Created",
          message: "New financial savings goal created.",
        });
      }

      setIsModalOpen(false);
      loadGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save savings goal";
      toast({
        type: "error",
        title: "Operation Failed",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Contribution
  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;

    if (!contribAmount || contribAmount <= 0) {
      toast({
        type: "error",
        title: "Validation Error",
        message: "Contribution amount must be greater than zero.",
      });
      return;
    }

    try {
      setIsContributing(true);
      const payload: AddContributionPayload = {
        amount: contribAmount,
        date: contribDate,
        account: contribAccount || undefined,
        note: contribNote.trim() || undefined,
      };

      const updated = await GoalService.addContribution(contributingGoal._id, payload);
      if (updated.status === "COMPLETED") {
        toast({
          type: "success",
          title: "🎯 Goal Achieved!",
          message: `Congratulations! "${updated.name}" is 100% completed.`,
        });
      } else {
        toast({
          type: "success",
          title: "Contribution Added",
          message: `Added ${formatCurrency(contribAmount, currency)} to "${updated.name}". Progress: ${updated.percentage}%`,
        });
      }

      setContributingGoal(null);
      loadGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add contribution";
      toast({
        type: "error",
        title: "Contribution Failed",
        message: msg,
      });
    } finally {
      setIsContributing(false);
    }
  };

  // Toggle Goal Status (Pause / Resume / Complete)
  const handleToggleStatus = async (goal: ISavingsGoal, status: SavingsGoalStatus) => {
    try {
      if (status === "PAUSED") {
        await GoalService.pauseGoal(goal._id);
        toast({ type: "info", title: "Goal Paused", message: `"${goal.name}" has been paused.` });
      } else if (status === "ACTIVE") {
        await GoalService.resumeGoal(goal._id);
        toast({ type: "success", title: "Goal Resumed", message: `"${goal.name}" is now active.` });
      } else if (status === "COMPLETED") {
        await GoalService.completeGoal(goal._id);
        toast({
          type: "success",
          title: "Goal Marked Completed",
          message: `"${goal.name}" marked as completed.`,
        });
      }
      loadGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast({ type: "error", title: "Action Failed", message: msg });
    }
  };

  // Delete Goal
  const handleDeleteGoal = async () => {
    if (!deletingGoalId) return;
    try {
      setIsDeleting(true);
      await GoalService.deleteGoal(deletingGoalId);
      toast({
        type: "success",
        title: "Goal Deleted",
        message: "Savings goal deleted successfully.",
      });
      setDeletingGoalId(null);
      loadGoals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete goal";
      toast({ type: "error", title: "Deletion Failed", message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter goals
  const filteredGoals = useMemo(() => {
    if (activeFilterTab === "ALL") return goals;
    if (activeFilterTab === "ACTIVE") return goals.filter((g) => g.status === "ACTIVE");
    if (activeFilterTab === "COMPLETED") return goals.filter((g) => g.status === "COMPLETED");
    if (activeFilterTab === "PAUSED") return goals.filter((g) => g.status === "PAUSED");
    return goals;
  }, [goals, activeFilterTab]);

  const getStatusBadge = (status: SavingsGoalStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="success" size="sm" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case "PAUSED":
        return (
          <Badge variant="secondary" size="sm" className="flex items-center gap-1">
            <Pause className="h-3 w-3" />
            <span>Paused</span>
          </Badge>
        );
      case "ACTIVE":
      default:
        return (
          <Badge variant="primary" size="sm" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Active</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1440px] mx-auto pb-10">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Savings Goals & Planning
            </h1>
            <Badge variant="primary" size="sm">
              Phase 14
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Target tracking, milestone notifications, and incremental savings contributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={loadGoals}
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
            Set New Goal
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
          title="Could not load savings goals"
          message={error}
          onRetry={loadGoals}
        />
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Target */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-primary uppercase tracking-wider">
                  Total Target
                </CardDescription>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Target className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {formatCurrency(summary?.totalTargetAmount || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Across {goals.length} total savings goals
                </div>
              </CardContent>
            </Card>

            {/* Total Saved */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-emerald-500 uppercase tracking-wider">
                  Total Saved
                </CardDescription>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-emerald-500 tracking-tight">
                  {formatCurrency(summary?.totalCurrentAmount || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Accumulated savings balance
                </div>
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-indigo-500 uppercase tracking-wider">
                  Overall Progress
                </CardDescription>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Sparkles className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {formatPercent(summary?.overallPercentage || 0)}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatCurrency(
                      Math.max(
                        0,
                        (summary?.totalTargetAmount || 0) - (summary?.totalCurrentAmount || 0)
                      ),
                      currency
                    )}{" "}
                    left
                  </span>
                </div>
                <Progress
                  value={summary?.overallPercentage || 0}
                  variant="primary"
                  size="sm"
                />
              </CardContent>
            </Card>

            {/* Active vs Completed */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-amber-500 uppercase tracking-wider">
                  Goal Status
                </CardDescription>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  {summary?.completedCount || 0}{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    / {goals.length} Completed
                  </span>
                </div>
                <div className="text-xs text-emerald-500 font-semibold">
                  {summary?.activeCount || 0} active goals in progress
                </div>
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
                { id: "ALL", label: `All (${goals.length})` },
                {
                  id: "ACTIVE",
                  label: `Active (${summary?.activeCount || 0})`,
                },
                {
                  id: "COMPLETED",
                  label: `Completed (${summary?.completedCount || 0})`,
                },
                {
                  id: "PAUSED",
                  label: `Paused (${summary?.pausedCount || 0})`,
                },
              ]}
            />
          </div>

          {/* Goals Grid */}
          {filteredGoals.length === 0 ? (
            <EmptyState
              title="No Savings Goals Found"
              description="Establish savings targets with milestones to systematically fund future aspirations."
              actionLabel="+ Create First Savings Goal"
              onAction={handleOpenCreateModal}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => {
                const isComplete = goal.status === "COMPLETED" || goal.currentAmount >= goal.targetAmount;

                return (
                  <Card
                    key={goal._id}
                    hover
                    className="border border-border/80 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-bold text-foreground">
                              {goal.name}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" size="sm">
                              {goal.category || "General"}
                            </Badge>
                            {getStatusBadge(goal.status)}
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
                              id: "contribute",
                              label: "Add Contribution",
                              icon: <Plus className="h-3.5 w-3.5 text-primary" />,
                              disabled: isComplete,
                              onClick: () => handleOpenContributeModal(goal),
                            },
                            {
                              id: "history",
                              label: "Contribution History",
                              icon: <History className="h-3.5 w-3.5" />,
                              onClick: () => setHistoryGoal(goal),
                            },
                            {
                              id: "toggle",
                              label: goal.status === "ACTIVE" ? "Pause Goal" : "Resume Goal",
                              icon:
                                goal.status === "ACTIVE" ? (
                                  <Pause className="h-3.5 w-3.5 text-amber-500" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 text-emerald-500" />
                                ),
                              disabled: goal.status === "COMPLETED",
                              onClick: () =>
                                handleToggleStatus(
                                  goal,
                                  goal.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
                                ),
                            },
                            {
                              id: "complete",
                              label: "Mark Completed",
                              icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
                              disabled: goal.status === "COMPLETED",
                              onClick: () => handleToggleStatus(goal, "COMPLETED"),
                            },
                            {
                              id: "edit",
                              label: "Edit Goal",
                              icon: <Edit2 className="h-3.5 w-3.5" />,
                              onClick: () => handleOpenEditModal(goal),
                            },
                            {
                              id: "delete",
                              label: "Delete Goal",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              destructive: true,
                              onClick: () => setDeletingGoalId(goal._id),
                            },
                          ]}
                        />
                      </CardHeader>

                      {/* Card Content */}
                      <CardContent className="p-5 space-y-4">
                        {/* Current vs Target Amount */}
                        <div className="flex items-baseline justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                              Saved / Target
                            </span>
                            <div className="text-xl font-extrabold text-foreground">
                              {formatCurrency(goal.currentAmount, currency)}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                / {formatCurrency(goal.targetAmount, currency)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              isComplete ? "text-emerald-500" : "text-primary"
                            }`}
                          >
                            {goal.percentage}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <Progress
                            value={goal.percentage}
                            variant={isComplete ? "success" : "primary"}
                            size="md"
                          />
                          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>
                              {isComplete ? (
                                <strong className="text-emerald-500 font-bold">Goal Target Achieved!</strong>
                              ) : (
                                <span>
                                  <strong>{formatCurrency(goal.remainingAmount, currency)}</strong> to go
                                </span>
                              )}
                            </span>
                            {goal.targetDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(goal.targetDate)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {goal.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-secondary/30 p-2 rounded-lg">
                            {goal.description}
                          </p>
                        )}
                      </CardContent>
                    </div>

                    {/* Footer Quick Action */}
                    <div className="p-4 pt-0 border-t border-border/40 mt-2 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryGoal(goal)}
                        className="text-xs h-8 px-2 flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>{goal.contributions?.length || 0} Deposits</span>
                      </Button>

                      {!isComplete && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOpenContributeModal(goal)}
                          className="text-xs h-8"
                          leftIcon={<Plus className="h-3.5 w-3.5" />}
                        >
                          Contribute
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Goal Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? `Edit Savings Goal` : "Create Savings Goal"}
        description="Define a target amount and planned timeframe for your financial milestone."
      >
        <form onSubmit={handleSubmitGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. New Laptop, Emergency Fund, Bali Vacation"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <CurrencyInput
              label="Target Amount"
              value={formTargetAmount}
              onChangeValue={setFormTargetAmount}
              currencySymbol={currency === "INR" ? "₹" : currency}
              required
            />
            <CurrencyInput
              label="Initial Saved Amount"
              value={formCurrentAmount}
              onChangeValue={setFormCurrentAmount}
              currencySymbol={currency === "INR" ? "₹" : currency}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              options={[
                { value: "Emergency Fund", label: "Emergency Fund" },
                { value: "Gadgets & Tech", label: "Gadgets & Tech" },
                { value: "Travel & Vacation", label: "Travel & Vacation" },
                { value: "Vehicle", label: "Vehicle" },
                { value: "Education", label: "Education" },
                { value: "Investment", label: "Investment" },
                { value: "Home & Living", label: "Home & Living" },
                { value: "General Savings", label: "General Savings" },
              ]}
            />
            <Input
              label="Target Date (Optional)"
              type="date"
              value={formTargetDate}
              onChange={(e) => setFormTargetDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Description / Purpose (Optional)"
            placeholder="e.g. 3-month living expenses buffer in high-yield account"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
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
              {editingGoal ? "Update Goal" : "Save Goal"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Contribution Modal */}
      <Dialog
        isOpen={contributingGoal !== null}
        onClose={() => setContributingGoal(null)}
        title={`Contribute to "${contributingGoal?.name}"`}
        description="Deposit funds toward reaching this savings goal."
      >
        <form onSubmit={handleSubmitContribution} className="space-y-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs font-semibold text-foreground">
            <span>Currently Saved: {formatCurrency(contributingGoal?.currentAmount || 0, currency)}</span>
            <span>Target: {formatCurrency(contributingGoal?.targetAmount || 0, currency)}</span>
          </div>

          <CurrencyInput
            label="Contribution Amount"
            value={contribAmount}
            onChangeValue={setContribAmount}
            currencySymbol={currency === "INR" ? "₹" : currency}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Deduct from Account (Optional)"
              value={contribAccount}
              onChange={(e) => setContribAccount(e.target.value)}
              options={[
                { value: "", label: "No specific account" },
                ...accounts.map((a) => ({
                  value: a._id,
                  label: `${a.name} (${formatCurrency(a.currentBalance, currency)})`,
                })),
              ]}
            />
            <Input
              label="Contribution Date"
              type="date"
              value={contribDate}
              onChange={(e) => setContribDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Note (Optional)"
            placeholder="e.g. Monthly salary savings portion"
            value={contribNote}
            onChange={(e) => setContribNote(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setContributingGoal(null)}
              disabled={isContributing}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isContributing}>
              Add Contribution
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Contribution History Dialog */}
      <Dialog
        isOpen={historyGoal !== null}
        onClose={() => setHistoryGoal(null)}
        title={`Contribution History: ${historyGoal?.name}`}
        description="Chronological record of deposits toward this goal."
        size="lg"
      >
        <div className="space-y-4">
          {historyGoal?.contributions && historyGoal.contributions.length > 0 ? (
            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
              {historyGoal.contributions.map((c, idx) => (
                <div
                  key={c._id || idx}
                  className="p-3 rounded-xl border border-border bg-card/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground">
                      {formatCurrency(c.amount, currency)}
                    </div>
                    {c.note && <div className="text-muted-foreground">{c.note}</div>}
                  </div>
                  <div className="text-right text-muted-foreground">
                    <div>{formatDate(c.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No individual contribution records logged yet.
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setHistoryGoal(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingGoalId !== null}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={handleDeleteGoal}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? This will permanently remove its milestone history."
        confirmLabel="Delete Goal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
