import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  RotateCcw,
  Plus,
} from "lucide-react";
import { AnalyticsService } from "../../services/analytics.service";
import { AccountService } from "../../services/account.service";
import { CategoryService } from "../../services/category.service";
import {
  AnalyticsOverviewResponse,
  AnalyticsFilterParams,
} from "../../types/analytics.types";
import { formatCurrency } from "../../utils/formatters";
import { getErrorMessage } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { AnalyticsFilterBar } from "../../components/analytics/AnalyticsFilterBar";
import { SpendingTrendChart } from "../../components/analytics/SpendingTrendChart";
import { SavingsTrendChart } from "../../components/analytics/SavingsTrendChart";
import { PaymentMethodChart } from "../../components/analytics/PaymentMethodChart";
import { AccountSpendingChart } from "../../components/analytics/AccountSpendingChart";
import { InsightsPanel } from "../../components/analytics/InsightsPanel";
import { CategoryPieChart } from "../../components/dashboard/CategoryPieChart";

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilterParams>({ period: "30d" });
  const [accounts, setAccounts] = useState<Array<{ _id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; type: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load filter dependencies (Accounts and Categories)
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [accRes, catRes] = await Promise.all([
          AccountService.getAccounts(),
          CategoryService.getCategories(),
        ]);
        setAccounts(accRes.accounts.map((a) => ({ _id: a._id, name: a.name })));
        setCategories(catRes.map((c) => ({ _id: c._id, name: c.name, type: c.type })));
      } catch {
        // Non-blocking
      }
    };
    loadFilterData();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await AnalyticsService.getOverview(filters);
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleFilterChange = (updated: Partial<AnalyticsFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({ period: "30d" });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <BarChart3 className="h-3 w-3" />
            <span>Phase 15 Financial Analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics & Trends</h1>
          <p className="text-xs text-muted-foreground">
            Multi-dimensional financial breakdown, trend velocity, and deterministic rule-based insights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics()}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh Analytics</span>
          </Button>

          <Link to="/transactions">
            <Button size="sm" className="text-xs font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Log Transaction</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        accounts={accounts}
        categories={categories}
        isLoading={isLoading}
      />

      {/* Main Viewport */}
      {isLoading ? (
        <div className="space-y-6">
          {/* Summary Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-20" />
              </Card>
            ))}
          </div>

          {/* Charts Skeletons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to generate analytics"
          message={error}
          onRetry={fetchAnalytics}
        />
      ) : !data || (data.summary.totalIncome === 0 && data.summary.totalExpenses === 0 && data.summary.transactionCount === 0) ? (
        <EmptyState
          title="No transaction records found"
          description="There are no transactions recorded within the selected filter criteria. Record income or expense transactions to view detailed analytics."
          icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
          actionLabel="Add First Transaction"
          onAction={() => navigate("/transactions")}
        />
      ) : (
        <div className="space-y-6">
          {/* 1. Top 4 Summary Cards with Period-over-Period Delta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income Card */}
            <Card className="p-4 sm:p-5 bg-card/80 border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Inflows</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold font-mono tracking-tight text-foreground">
                  {formatCurrency(data.summary.totalIncome)}
                </h3>
                {data.summary.comparison && (
                  <div className="flex items-center gap-1 text-[11px]">
                    {data.summary.comparison.incomeChangePct >= 0 ? (
                      <span className="text-emerald-500 font-bold flex items-center">
                        <ArrowUpRight className="h-3 w-3" />
                        +{data.summary.comparison.incomeChangePct}%
                      </span>
                    ) : (
                      <span className="text-rose-500 font-bold flex items-center">
                        <ArrowDownRight className="h-3 w-3" />
                        {data.summary.comparison.incomeChangePct}%
                      </span>
                    )}
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Total Expenses Card */}
            <Card className="p-4 sm:p-5 bg-card/80 border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Outflows</span>
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold font-mono tracking-tight text-foreground">
                  {formatCurrency(data.summary.totalExpenses)}
                </h3>
                {data.summary.comparison && (
                  <div className="flex items-center gap-1 text-[11px]">
                    {data.summary.comparison.expenseChangePct > 0 ? (
                      <span className="text-rose-500 font-bold flex items-center">
                        <ArrowUpRight className="h-3 w-3" />
                        +{data.summary.comparison.expenseChangePct}%
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-bold flex items-center">
                        <ArrowDownRight className="h-3 w-3" />
                        {data.summary.comparison.expenseChangePct}%
                      </span>
                    )}
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Net Savings Card */}
            <Card className="p-4 sm:p-5 bg-card/80 border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Net Savings</span>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-0.5">
                <h3
                  className={`text-xl font-bold font-mono tracking-tight ${
                    data.summary.netSavings >= 0 ? "text-foreground" : "text-rose-500"
                  }`}
                >
                  {formatCurrency(data.summary.netSavings)}
                </h3>
                {data.summary.comparison && (
                  <div className="flex items-center gap-1 text-[11px]">
                    {data.summary.comparison.savingsChangePct >= 0 ? (
                      <span className="text-emerald-500 font-bold flex items-center">
                        <ArrowUpRight className="h-3 w-3" />
                        +{data.summary.comparison.savingsChangePct}%
                      </span>
                    ) : (
                      <span className="text-rose-500 font-bold flex items-center">
                        <ArrowDownRight className="h-3 w-3" />
                        {data.summary.comparison.savingsChangePct}%
                      </span>
                    )}
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Savings Rate Card */}
            <Card className="p-4 sm:p-5 bg-card/80 border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Savings Rate</span>
                <Badge
                  variant={data.summary.savingsRate >= 20 ? "success" : data.summary.savingsRate > 0 ? "secondary" : "danger"}
                  size="sm"
                >
                  {data.summary.savingsRate >= 20 ? "Healthy" : data.summary.savingsRate > 0 ? "Moderate" : "Deficit"}
                </Badge>
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl font-bold font-mono tracking-tight text-foreground">
                  {data.summary.savingsRate}%
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {data.summary.transactionCount} transactions recorded
                </p>
              </div>
            </Card>
          </div>

          {/* 2. Deterministic Insights Panel */}
          <InsightsPanel insights={data.insights} />

          {/* 3. Trend Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SpendingTrendChart data={data.monthlyTrends} />
            <SavingsTrendChart data={data.monthlyTrends} />
          </div>

          {/* 4. Detailed Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Category Breakdown (Donut + Progress List) */}
            <div className="lg:col-span-1 space-y-4">
              <CategoryPieChart categories={data.categoryBreakdown} />
            </div>

            {/* Payment Method Distribution */}
            <div className="lg:col-span-1 space-y-4">
              <PaymentMethodChart data={data.paymentMethods} />
            </div>

            {/* Account Outflow Activity */}
            <div className="lg:col-span-1 space-y-4">
              <AccountSpendingChart data={data.accountBreakdown} />
            </div>
          </div>

          {/* 5. Spending Velocity & High Point Stats */}
          {data.velocityStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 space-y-1 bg-card/60 border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground">Daily Average Spend</span>
                <p className="text-base font-bold font-mono text-foreground">
                  {formatCurrency(data.velocityStats.averageDailySpending)}
                </p>
                <p className="text-[10px] text-muted-foreground">Across {data.velocityStats.activeDaysCount} active spending days</p>
              </Card>

              <Card className="p-4 space-y-1 bg-card/60 border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground">Peak Spending Day</span>
                <p className="text-base font-bold font-mono text-foreground">
                  {data.velocityStats.highestSpendingDay
                    ? formatCurrency(data.velocityStats.highestSpendingDay.amount)
                    : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {data.velocityStats.highestSpendingDay?.date || "No single peak day recorded"}
                </p>
              </Card>

              <Card className="p-4 space-y-1 bg-card/60 border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground">Largest Transaction</span>
                <p className="text-base font-bold font-mono text-foreground">
                  {data.velocityStats.highestTransaction
                    ? formatCurrency(data.velocityStats.highestTransaction.amount)
                    : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {data.velocityStats.highestTransaction
                    ? `${data.velocityStats.highestTransaction.description} (${data.velocityStats.highestTransaction.categoryName || "Category"})`
                    : "No transactions recorded"}
                </p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
