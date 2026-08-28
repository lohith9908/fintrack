import mongoose from "mongoose";
import { Transaction, Category, Account } from "../models";
import { AnalyticsQueryInput } from "../validators/analytics.validator";
import { InsightService, DeterministicInsight } from "./insight.service";

export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  transactionCount: number;
  averageTransaction: number;
  periodLabel: string;
  comparison?: {
    prevIncome: number;
    prevExpenses: number;
    prevSavings: number;
    prevSavingsRate: number;
    incomeChangePct: number;
    expenseChangePct: number;
    savingsChangePct: number;
  };
}

export interface AnalyticsMonthlyTrendItem {
  month: string;
  label: string;
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}

export interface AnalyticsCategoryItem {
  categoryId: string;
  name: string;
  type: string;
  color: string;
  icon?: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface PaymentMethodItem {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface AccountSpendingItem {
  accountId: string;
  name: string;
  type: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface SpendingVelocityStats {
  averageDailySpending: number;
  highestSpendingDay?: {
    date: string;
    amount: number;
  };
  highestTransaction?: {
    description: string;
    amount: number;
    categoryName?: string;
    date: string;
  };
  activeDaysCount: number;
}

export interface AnalyticsOverviewResponse {
  summary: AnalyticsSummary;
  monthlyTrends: AnalyticsMonthlyTrendItem[];
  categoryBreakdown: AnalyticsCategoryItem[];
  paymentMethods: PaymentMethodItem[];
  accountBreakdown: AccountSpendingItem[];
  velocityStats: SpendingVelocityStats;
  insights: DeterministicInsight[];
}

export class AnalyticsService {
  /**
   * Resolve date ranges for current and previous period comparison
   */
  public static resolvePeriodRange(options: Partial<AnalyticsQueryInput>): {
    startDate?: Date;
    endDate?: Date;
    prevStartDate?: Date;
    prevEndDate?: Date;
    periodLabel: string;
  } {
    if (options.startDate || options.endDate) {
      const start = options.startDate ? new Date(options.startDate) : undefined;
      const end = options.endDate ? new Date(options.endDate) : undefined;
      if (end && options.endDate && options.endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      return {
        startDate: start,
        endDate: end,
        periodLabel: "Custom Range",
      };
    }

    const now = new Date();
    const period = options.period || "30d";

    if (period === "7d") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const prevEnd = start;
      return {
        startDate: start,
        endDate: now,
        prevStartDate: prevStart,
        prevEndDate: prevEnd,
        periodLabel: "Last 7 Days",
      };
    }

    if (period === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        prevStartDate: prevStart,
        prevEndDate: prevEnd,
        periodLabel: "This Month",
      };
    }

    if (period === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        prevStartDate: prevStart,
        prevEndDate: prevEnd,
        periodLabel: "Last Month",
      };
    }

    if (period === "3m") {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const prevEnd = start;
      return {
        startDate: start,
        endDate: now,
        prevStartDate: prevStart,
        prevEndDate: prevEnd,
        periodLabel: "Last 3 Months",
      };
    }

    if (period === "6m") {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const prevEnd = start;
      return {
        startDate: start,
        endDate: now,
        prevStartDate: prevStart,
        prevEndDate: prevEnd,
        periodLabel: "Last 6 Months",
      };
    }

    if (period === "12m") {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      return {
        startDate: start,
        endDate: now,
        periodLabel: "Last 12 Months",
      };
    }

    if (period === "year_to_date") {
      const start = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: start,
        endDate: now,
        periodLabel: "Year to Date",
      };
    }

    if (period === "all") {
      return {
        periodLabel: "All Time",
      };
    }

    // Default: 30 days
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const prevEnd = start;
    return {
      startDate: start,
      endDate: now,
      prevStartDate: prevStart,
      prevEndDate: prevEnd,
      periodLabel: "Last 30 Days",
    };
  }

  /**
   * Build base match query for transaction filtering
   */
  private static buildMatchQuery(
    userId: string,
    options: Partial<AnalyticsQueryInput>,
    dateRange?: { startDate?: Date; endDate?: Date }
  ): Record<string, unknown> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const match: Record<string, unknown> = { user: userObjectId };

    if (dateRange?.startDate || dateRange?.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (dateRange.startDate) dateFilter.$gte = dateRange.startDate;
      if (dateRange.endDate) dateFilter.$lte = dateRange.endDate;
      match.date = dateFilter;
    }

    if (options.accountId) {
      match.account = new mongoose.Types.ObjectId(options.accountId);
    }

    if (options.categoryId) {
      match.category = new mongoose.Types.ObjectId(options.categoryId);
    }

    if (options.type) {
      match.type = options.type;
    }

    if (options.paymentMethod) {
      match.paymentMethod = options.paymentMethod;
    }

    return match;
  }

  /**
   * 1. Financial Summary & Period Comparisons
   */
  public static async getFinancialSummary(
    userId: string,
    options: Partial<AnalyticsQueryInput> = {}
  ): Promise<AnalyticsSummary> {
    const { startDate, endDate, prevStartDate, prevEndDate, periodLabel } =
      this.resolvePeriodRange(options);

    const currentMatch = this.buildMatchQuery(userId, options, { startDate, endDate });

    const currentAgg = await Transaction.aggregate<{
      _id: null;
      totalIncome: number;
      totalExpenses: number;
      count: number;
    }>([
      { $match: currentMatch },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] },
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = currentAgg[0]?.totalIncome || 0;
    const totalExpenses = currentAgg[0]?.totalExpenses || 0;
    const netSavings = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 1000) / 10 : 0;
    const transactionCount = currentAgg[0]?.count || 0;
    const averageTransaction =
      transactionCount > 0 ? Math.round((totalIncome + totalExpenses) / transactionCount) : 0;

    let comparison: AnalyticsSummary["comparison"] = undefined;

    if (prevStartDate && prevEndDate) {
      const prevMatch = this.buildMatchQuery(userId, options, {
        startDate: prevStartDate,
        endDate: prevEndDate,
      });

      const prevAgg = await Transaction.aggregate<{
        _id: null;
        totalIncome: number;
        totalExpenses: number;
      }>([
        { $match: prevMatch },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] },
            },
            totalExpenses: {
              $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] },
            },
          },
        },
      ]);

      const prevIncome = prevAgg[0]?.totalIncome || 0;
      const prevExpenses = prevAgg[0]?.totalExpenses || 0;
      const prevSavings = prevIncome - prevExpenses;
      const prevSavingsRate =
        prevIncome > 0 ? Math.round(((prevIncome - prevExpenses) / prevIncome) * 1000) / 10 : 0;

      const calcChangePct = (cur: number, prev: number) => {
        if (prev === 0) return cur > 0 ? 100 : 0;
        return Math.round(((cur - prev) / prev) * 1000) / 10;
      };

      comparison = {
        prevIncome,
        prevExpenses,
        prevSavings,
        prevSavingsRate,
        incomeChangePct: calcChangePct(totalIncome, prevIncome),
        expenseChangePct: calcChangePct(totalExpenses, prevExpenses),
        savingsChangePct: calcChangePct(netSavings, prevSavings),
      };
    }

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      transactionCount,
      averageTransaction,
      periodLabel,
      comparison,
    };
  }

  /**
   * 2. Monthly Trends (Income vs Expenses vs Savings over time)
   */
  public static async getMonthlyTrends(
    userId: string,
    options: Partial<AnalyticsQueryInput> = {}
  ): Promise<AnalyticsMonthlyTrendItem[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startDate = options.startDate
      ? new Date(options.startDate)
      : new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const endDate = options.endDate ? new Date(options.endDate) : now;

    const match: Record<string, unknown> = {
      user: userObjectId,
      date: { $gte: startDate, $lte: endDate },
    };

    if (options.accountId) {
      match.account = new mongoose.Types.ObjectId(options.accountId);
    }
    if (options.categoryId) {
      match.category = new mongoose.Types.ObjectId(options.categoryId);
    }
    if (options.paymentMethod) {
      match.paymentMethod = options.paymentMethod;
    }

    const trendsAgg = await Transaction.aggregate<{
      _id: { year: number; month: number };
      income: number;
      expense: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          income: {
            $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] },
          },
          expense: {
            $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const result: AnalyticsMonthlyTrendItem[] = [];
    const aggMap = new Map<string, { income: number; expense: number }>();
    trendsAgg.forEach((t) => {
      const key = `${t._id.year}-${String(t._id.month).padStart(2, "0")}`;
      aggMap.set(key, { income: t.income, expense: t.expense });
    });

    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (cur <= end) {
      const year = cur.getFullYear();
      const month = cur.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const data = aggMap.get(key) || { income: 0, expense: 0 };
      const savings = data.income - data.expense;
      const savingsRate =
        data.income > 0 ? Math.round((savings / data.income) * 100) : 0;

      result.push({
        month: key,
        label: `${monthNames[month - 1]} ${year}`,
        income: data.income,
        expense: data.expense,
        savings,
        savingsRate,
      });

      cur.setMonth(cur.getMonth() + 1);
    }

    return result;
  }

  /**
   * 3. Expense (and Income) by Category Breakdown
   */
  public static async getExpenseByCategory(
    userId: string,
    options: Partial<AnalyticsQueryInput> = {}
  ): Promise<AnalyticsCategoryItem[]> {
    const { startDate, endDate } = this.resolvePeriodRange(options);
    const match = this.buildMatchQuery(userId, options, { startDate, endDate });

    if (!options.type) {
      match.type = "EXPENSE";
    }

    const catAgg = await Transaction.aggregate<{
      _id: mongoose.Types.ObjectId | null;
      amount: number;
      count: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const totalSpend = catAgg.reduce((acc, c) => acc + c.amount, 0);

    const categoryIds = catAgg.map((c) => c._id).filter((id): id is mongoose.Types.ObjectId => Boolean(id));
    const categories = await Category.find({ _id: { $in: categoryIds } });
    const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));

    return catAgg.map((item) => {
      const cat = item._id ? categoryMap.get(item._id.toString()) : undefined;
      const amount = item.amount || 0;
      const percentage = totalSpend > 0 ? Math.round((amount / totalSpend) * 1000) / 10 : 0;

      return {
        categoryId: cat?._id?.toString() || item._id?.toString() || "uncategorized",
        name: cat?.name || "Uncategorized",
        type: cat?.type || (options.type || "EXPENSE"),
        color: cat?.color || "#6B7280",
        icon: cat?.icon || "tag",
        amount,
        percentage,
        count: item.count,
      };
    });
  }

  /**
   * 4. Payment Method Spending Breakdown
   */
  public static async getPaymentMethodBreakdown(
    userId: string,
    options: Partial<AnalyticsQueryInput> = {}
  ): Promise<PaymentMethodItem[]> {
    const { startDate, endDate } = this.resolvePeriodRange(options);
    const match = this.buildMatchQuery(userId, options, { startDate, endDate });

    const agg = await Transaction.aggregate<{
      _id: string;
      amount: number;
      count: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const total = agg.reduce((acc, i) => acc + i.amount, 0);

    return agg.map((i) => ({
      method: i._id || "OTHER",
      amount: i.amount,
      count: i.count,
      percentage: total > 0 ? Math.round((i.amount / total) * 1000) / 10 : 0,
    }));
  }

  /**
   * 5. Account Breakdown
   */
  public static async getAccountBreakdown(
    userId: string,
    options: Partial<AnalyticsQueryInput> = {}
  ): Promise<AccountSpendingItem[]> {
    const { startDate, endDate } = this.resolvePeriodRange(options);
    const match = this.buildMatchQuery(userId, options, { startDate, endDate });

    const agg = await Transaction.aggregate<{
      _id: mongoose.Types.ObjectId | null;
      amount: number;
      count: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: "$account",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const total = agg.reduce((acc, i) => acc + i.amount, 0);

    const accountIds = agg.map((a) => a._id).filter((id): id is mongoose.Types.ObjectId => Boolean(id));
    const accounts = await Account.find({ _id: { $in: accountIds } });
    const accountMap = new Map(accounts.map((a) => [a._id.toString(), a]));

    return agg.map((item) => {
      const acc = item._id ? accountMap.get(item._id.toString()) : undefined;
      const amount = item.amount || 0;
      const percentage = total > 0 ? Math.round((amount / total) * 1000) / 10 : 0;

      return {
        accountId: acc?._id?.toString() || item._id?.toString() || "unknown",
        name: acc?.name || "Account",
        type: acc?.type || "OTHER",
        amount,
        count: item.count,
        percentage,
      };
    });
  }

  /**
   * 6. Spending Velocity & High Point Stats
   */
  public static async getSpendingVelocityStats(
    userId: string,
    options: Partial<AnalyticsQueryInput> = {}
  ): Promise<SpendingVelocityStats> {
    const { startDate, endDate } = this.resolvePeriodRange(options);
    const match = this.buildMatchQuery(userId, options, { startDate, endDate });
    match.type = "EXPENSE";

    const dailyAgg = await Transaction.aggregate<{
      _id: string;
      amount: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const activeDaysCount = dailyAgg.length;
    const totalExpenses = dailyAgg.reduce((acc, d) => acc + d.amount, 0);
    const averageDailySpending =
      activeDaysCount > 0 ? Math.round(totalExpenses / activeDaysCount) : 0;

    const highestSpendingDay = dailyAgg[0]
      ? { date: dailyAgg[0]._id, amount: dailyAgg[0].amount }
      : undefined;

    const highestTx = await Transaction.findOne(match)
      .sort({ amount: -1 })
      .populate("category", "name");

    const highestTransaction = highestTx
      ? {
          description: highestTx.description,
          amount: highestTx.amount,
          categoryName: (highestTx.category as unknown as { name?: string })?.name,
          date: highestTx.date.toISOString(),
        }
      : undefined;

    return {
      averageDailySpending,
      highestSpendingDay,
      highestTransaction,
      activeDaysCount,
    };
  }

  /**
   * 7. Consolidated Overview Endpoint
   */
  public static async getAnalyticsOverview(
    userId: string,
    options: Partial<AnalyticsQueryInput> = {}
  ): Promise<AnalyticsOverviewResponse> {
    const [
      summary,
      monthlyTrends,
      categoryBreakdown,
      paymentMethods,
      accountBreakdown,
      velocityStats,
      insights,
    ] = await Promise.all([
      this.getFinancialSummary(userId, options),
      this.getMonthlyTrends(userId, options),
      this.getExpenseByCategory(userId, options),
      this.getPaymentMethodBreakdown(userId, options),
      this.getAccountBreakdown(userId, options),
      this.getSpendingVelocityStats(userId, options),
      InsightService.evaluateInsights(userId, options),
    ]);

    return {
      summary,
      monthlyTrends,
      categoryBreakdown,
      paymentMethods,
      accountBreakdown,
      velocityStats,
      insights,
    };
  }
}
