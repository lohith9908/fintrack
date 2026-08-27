import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  CreditCard,
  Plus,
  ArrowRight,
  Wallet,
  Building2,
  Smartphone,
  Layers,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { DashboardService } from "../../services/dashboard.service";
import {
  DashboardOverviewData,
  DashboardQueryParams,
} from "../../types/dashboard.types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  ErrorState,
  EmptyState,
  Tabs,
} from "../../components/ui";
import {
  IncomeExpenseChart,
  CategoryPieChart,
  SavingsTrendChart,
  BudgetWidget,
  SavingsGoalsWidget,
  UpcomingPaymentsWidget,
  InsightsWidget,
} from "../../components/dashboard";
import { formatCurrency, formatPercent, formatDate } from "../../utils/formatters";

const ACCOUNT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  BANK_ACCOUNT: Building2,
  CASH: Wallet,
  MOBILE_WALLET: Smartphone,
  CREDIT_CARD: CreditCard,
  INVESTMENT: TrendingUp,
  OTHER: Layers,
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "30d" | "current_month" | "6m" | "12m" | "all"
  >("30d");

  const [activeSideTab, setActiveSideTab] = useState<"budgets" | "goals">("budgets");

  const loadDashboardData = useCallback(async (period = selectedPeriod) => {
    try {
      setIsLoading(true);
      setError(null);
      const params: DashboardQueryParams = { period };
      const res = await DashboardService.getOverview(params);
      setData(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load dashboard overview";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadDashboardData(selectedPeriod);
  }, [selectedPeriod, loadDashboardData]);

  const summary = data?.summary;
  const currency = user?.currency || summary?.currency || "INR";

  return (
    <div className="space-y-8 animate-fadeIn max-w-[1440px] mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome back, {user?.name || "User"}
            </h1>
            <Badge variant="success" size="sm" dot>
              Active
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete financial overview, cash flow analytics, and budgeting health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            activeTab={selectedPeriod}
            onTabChange={(tab) =>
              setSelectedPeriod(
                tab as "30d" | "current_month" | "6m" | "12m" | "all"
              )
            }
            variant="pill"
            tabs={[
              { id: "30d", label: "30 Days" },
              { id: "current_month", label: "This Month" },
              { id: "6m", label: "6 Months" },
              { id: "12m", label: "1 Year" },
              { id: "all", label: "All Time" },
            ]}
          />

          <Button
            size="sm"
            variant="outline"
            onClick={() => loadDashboardData(selectedPeriod)}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Link to="/transactions">
            <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Add Transaction
            </Button>
          </Link>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton variant="rectangular" className="h-72 lg:col-span-2 w-full" />
            <Skeleton variant="rectangular" className="h-72 w-full" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load financial overview"
          message={error}
          onRetry={() => loadDashboardData(selectedPeriod)}
        />
      ) : !data ? (
        <EmptyState
          title="No Financial Records Found"
          description="Begin by adding an account and recording your initial transactions to generate live calculations."
          actionLabel="Add Account"
          onAction={() => {}}
        />
      ) : (
        <>
          {/* Row 1: Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-emerald-500 uppercase tracking-wider">
                  Total Income
                </CardDescription>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-emerald-500 tracking-tight">
                  +{formatCurrency(summary?.totalIncome || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Recorded income in period
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-rose-500 uppercase tracking-wider">
                  Total Expenses
                </CardDescription>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-extrabold text-rose-500 tracking-tight">
                  -{formatCurrency(summary?.totalExpenses || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Recorded spendings in period
                </div>
              </CardContent>
            </Card>

            {/* Remaining Balance */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Remaining Balance
                </CardDescription>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div
                  className={`text-2xl font-extrabold tracking-tight ${
                    (summary?.remainingBalance || 0) >= 0
                      ? "text-foreground"
                      : "text-rose-500"
                  }`}
                >
                  {(summary?.remainingBalance || 0) >= 0 ? "+" : ""}
                  {formatCurrency(summary?.remainingBalance || 0, currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Net period cash flow surplus
                </div>
              </CardContent>
            </Card>

            {/* Savings Rate */}
            <Card hover className="bg-gradient-to-br from-card to-card/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription className="font-semibold text-xs text-warning uppercase tracking-wider">
                  Savings Rate
                </CardDescription>
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <PieChartIcon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-foreground tracking-tight">
                    {formatPercent(summary?.savingsRate || 0)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-500">
                    Net Worth: {formatCurrency(summary?.totalNetWorth || 0, currency)}
                  </span>
                </div>
                <Progress
                  value={Math.max(0, Math.min(100, summary?.savingsRate || 0))}
                  variant="success"
                  size="sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Charts Comparison & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IncomeExpenseChart
                data={data.monthlyTrends}
                currency={currency}
              />
            </div>
            <div>
              <CategoryPieChart
                categories={data.categoryBreakdown}
                currency={currency}
              />
            </div>
          </div>

          {/* Row 3: Trends & Goals/Budgets Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SavingsTrendChart
                data={data.monthlyTrends}
                currency={currency}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <Tabs
                  activeTab={activeSideTab}
                  onTabChange={(t) => setActiveSideTab(t as "budgets" | "goals")}
                  variant="pill"
                  tabs={[
                    { id: "budgets", label: "Budgets" },
                    { id: "goals", label: "Savings Goals" },
                  ]}
                />
              </div>

              {activeSideTab === "budgets" ? (
                <BudgetWidget budgets={data.budgetStatus} currency={currency} />
              ) : (
                <SavingsGoalsWidget goals={data.goalsProgress} currency={currency} />
              )}
            </div>
          </div>

          {/* Row 4: Deterministic Financial Insights */}
          <InsightsWidget insights={data.insights} />

          {/* Row 5: Recent Transactions & Connected Wallets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions Table */}
            <Card className="lg:col-span-2 overflow-hidden border border-border">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Latest financial activity recorded in your accounts
                  </CardDescription>
                </div>
                <Link
                  to="/transactions"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>View Ledger</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {data.recentTransactions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No transactions recorded yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTransactions.map((tx) => {
                        const isIncome = tx.type === "INCOME";
                        return (
                          <TableRow
                            key={tx._id}
                            className="hover:bg-secondary/40 transition-colors"
                          >
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 opacity-70" />
                                <span>{formatDate(tx.date)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-foreground text-xs">
                              {tx.description}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{
                                    backgroundColor: tx.category?.color || "#3B82F6",
                                  }}
                                />
                                <span className="text-xs font-medium text-foreground">
                                  {tx.category?.name || "General"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {tx.account?.name || "Account"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold text-xs whitespace-nowrap ${
                                isIncome ? "text-emerald-500" : "text-rose-500"
                              }`}
                            >
                              {isIncome ? "+" : "-"}
                              {formatCurrency(
                                tx.amount,
                                tx.account?.currency || currency
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Connected Wallets & Upcoming Payments */}
            <div className="space-y-6">
              {/* Connected Accounts */}
              <Card className="border border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle>Connected Wallets</CardTitle>
                    <CardDescription>Real-time account balances</CardDescription>
                  </div>
                  <Link
                    to="/accounts"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Manage
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  {data.accounts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No connected accounts.
                    </p>
                  ) : (
                    data.accounts.map((acc) => {
                      const IconComponent = ACCOUNT_ICONS[acc.type] || Wallet;
                      return (
                        <div
                          key={acc._id}
                          className="p-3 rounded-xl border border-border bg-secondary/30 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{acc.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {acc.type.replace("_", " ")}
                              </p>
                            </div>
                          </div>
                          <span className="font-extrabold text-foreground">
                            {formatCurrency(acc.currentBalance, acc.currency)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Payments Widget */}
              <UpcomingPaymentsWidget
                payments={data.upcomingRecurring}
                currency={currency}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
