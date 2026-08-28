import mongoose from "mongoose";
import {
  Transaction,
  Budget,
  SavingsGoal,
  RecurringTransaction,
  Notification,
} from "../models";
import { AccountService } from "./account.service";
import { DashboardQueryInput } from "../validators/dashboard.validator";

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  savingsRate: number;
  totalNetWorth: number;
  activeAccountsCount: number;
  totalTransactionsCount: number;
  currency: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  type: string;
  color: string;
  icon?: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month: string;
  label: string;
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}

export interface PaymentMethodBreakdownItem {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface AccountDashboardItem {
  _id: string;
  name: string;
  type: string;
  currency: string;
  currentBalance: number;
  periodExpense: number;
}

export interface BudgetStatusItem {
  _id: string;
  categoryName: string;
  categoryColor?: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
}

export interface GoalStatusItem {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  targetDate?: string;
}

export interface RecurringPaymentItem {
  _id: string;
  description: string;
  amount: number;
  type: string;
  frequency: string;
  nextDueDate: string;
  accountName?: string;
}

export interface FinancialInsight {
  id: string;
  type: "SUCCESS" | "WARNING" | "INFO" | "TIP";
  title: string;
  message: string;
}

export interface DashboardOverviewResponse {
  summary: DashboardSummary;
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyTrends: MonthlyTrendItem[];
  paymentMethods: PaymentMethodBreakdownItem[];
  accounts: AccountDashboardItem[];
  recentTransactions: unknown[];
  budgetStatus: BudgetStatusItem[];
  goalsProgress: GoalStatusItem[];
  upcomingRecurring: RecurringPaymentItem[];
  unreadNotificationsCount: number;
  insights: FinancialInsight[];
}

export class DashboardService {
  /**
   * Calculate date range from period query
   */
  private static getDateRange(options: Partial<DashboardQueryInput>): {
    startDate?: Date;
    endDate?: Date;
  } {
    if (options.startDate || options.endDate) {
      const start = options.startDate ? new Date(options.startDate) : undefined;
      const end = options.endDate ? new Date(options.endDate) : undefined;
      if (end && options.endDate && options.endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      return { startDate: start, endDate: end };
    }

    const now = new Date();
    const period = options.period || "30d";

    if (period === "current_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }

    if (period === "6m") {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return { startDate: start, endDate: now };
    }

    if (period === "12m") {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      return { startDate: start, endDate: now };
    }

    if (period === "all") {
      return {};
    }

    // Default: 30 days
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now };
  }

  /**
   * Consolidated Dashboard Overview Aggregation
   */
  public static async getOverview(
    userId: string,
    queryInput: Partial<DashboardQueryInput> = {}
  ): Promise<DashboardOverviewResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { startDate, endDate } = this.getDateRange(queryInput);

    // Build matching filter for period transactions
    const periodMatch: Record<string, unknown> = { user: userObjectId };
    if (startDate || endDate) {
      const dateRangeFilter: Record<string, Date> = {};
      if (startDate) dateRangeFilter.$gte = startDate;
      if (endDate) dateRangeFilter.$lte = endDate;
      periodMatch.date = dateRangeFilter;
    }

    // 1. Fetch Accounts Summary & Net Worth (parity with AccountService)
    const accountsData = await AccountService.getAccounts(userId);
    const activeAccounts = accountsData.accounts.filter((a) => a.status !== "ARCHIVED");
    const totalNetWorth = accountsData.summary.totalNetWorth;
    const activeAccountsCount = accountsData.summary.activeAccountsCount;

    // 2. Aggregate Period Summary (Income, Expenses, Counts)
    const summaryAgg = await Transaction.aggregate<{
      _id: null;
      totalIncome: number;
      totalExpenses: number;
      count: number;
    }>([
      { $match: periodMatch },
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

    const totalIncome = summaryAgg[0]?.totalIncome || 0;
    const totalExpenses = summaryAgg[0]?.totalExpenses || 0;
    const remainingBalance = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100 * 10) / 10
        : 0;
    const totalTransactionsCount = summaryAgg[0]?.count || 0;

    // 3. Aggregate Expenses by Category
    const categoryAgg = await Transaction.aggregate<{
      _id: mongoose.Types.ObjectId;
      amount: number;
    }>([
      { $match: { ...periodMatch, type: "EXPENSE" } },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // Populate category metadata for category aggregation
    const categoryIds = categoryAgg.map((c) => c._id);
    const CategoryModel = mongoose.model("Category");
    const categoryDocs = await CategoryModel.find({ _id: { $in: categoryIds } });
    const categoryMap = new Map(categoryDocs.map((c) => [c._id.toString(), c]));

    const categoryBreakdown: CategoryBreakdownItem[] = categoryAgg.map((item) => {
      const catDoc = categoryMap.get(item._id.toString());
      const amount = item.amount;
      const percentage =
        totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100 * 10) / 10 : 0;

      return {
        categoryId: item._id.toString(),
        name: catDoc?.name || "Uncategorized",
        type: catDoc?.type || "EXPENSE",
        color: catDoc?.color || "#3B82F6",
        icon: catDoc?.icon || "Tag",
        amount,
        percentage,
      };
    });

    // 4. Aggregate Monthly Historical Trends (Past 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrendsAgg = await Transaction.aggregate<{
      _id: { year: number; month: number };
      income: number;
      expense: number;
    }>([
      {
        $match: {
          user: userObjectId,
          date: { $gte: sixMonthsAgo },
        },
      },
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

    // Format all 6 continuous months
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyTrends: MonthlyTrendItem[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const monthStr = `${year}-${String(monthNum).padStart(2, "0")}`;
      const label = `${monthNames[monthNum - 1]} ${year}`;

      const matched = monthlyTrendsAgg.find(
        (m) => m._id.year === year && m._id.month === monthNum
      );
      const inc = matched?.income || 0;
      const exp = matched?.expense || 0;
      const sav = inc - exp;
      const savRate = inc > 0 ? Math.round(((inc - exp) / inc) * 100 * 10) / 10 : 0;

      monthlyTrends.push({
        month: monthStr,
        label,
        income: inc,
        expense: exp,
        savings: sav,
        savingsRate: savRate,
      });
    }

    // 5. Aggregate Payment Methods Breakdown
    const paymentMethodsAgg = await Transaction.aggregate<{
      _id: string;
      amount: number;
      count: number;
    }>([
      { $match: periodMatch },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const totalPeriodVolume = paymentMethodsAgg.reduce((acc, curr) => acc + curr.amount, 0);
    const paymentMethods: PaymentMethodBreakdownItem[] = paymentMethodsAgg.map((pm) => ({
      method: pm._id,
      amount: pm.amount,
      count: pm.count,
      percentage:
        totalPeriodVolume > 0
          ? Math.round((pm.amount / totalPeriodVolume) * 100 * 10) / 10
          : 0,
    }));

    // 6. Aggregate Account Spending for the Period
    const accountSpendingAgg = await Transaction.aggregate<{
      _id: mongoose.Types.ObjectId;
      spent: number;
    }>([
      { $match: { ...periodMatch, type: "EXPENSE" } },
      {
        $group: {
          _id: "$account",
          spent: { $sum: "$amount" },
        },
      },
    ]);
    const accountSpendingMap = new Map(
      accountSpendingAgg.map((a) => [a._id.toString(), a.spent])
    );

    const accounts: AccountDashboardItem[] = activeAccounts.map((acc) => ({
      _id: acc._id.toString(),
      name: acc.name,
      type: acc.type,
      currency: acc.currency || "INR",
      currentBalance: acc.currentBalance,
      periodExpense: accountSpendingMap.get(acc._id.toString()) || 0,
    }));

    // 7. Recent Transactions (Top 5)
    const recentTransactions = await Transaction.find({ user: userObjectId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .populate("category", "name type icon color")
      .populate("account", "name type currency");

    // 8. Active Budgets Status
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;

    const activeBudgets = await Budget.find({
      user: userObjectId,
      year: currentYear,
      month: currentMonthNum,
    }).populate("category", "name color");

    // Compute spent amount for each budget category in current month
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    const endOfMonth = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgetStatus: BudgetStatusItem[] = [];
    for (const b of activeBudgets) {
      const catSpent = await Transaction.aggregate<{ total: number }>([
        {
          $match: {
            user: userObjectId,
            type: "EXPENSE",
            category: b.category?._id || b.category,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const spent = catSpent[0]?.total || 0;
      const pct = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100 * 10) / 10 : 0;
      const cat = b.category as unknown as { name?: string; color?: string };

      budgetStatus.push({
        _id: b._id.toString(),
        categoryName: cat?.name || "Budget Category",
        categoryColor: cat?.color || "#3B82F6",
        amount: b.limitAmount,
        spent,
        remaining: Math.max(0, b.limitAmount - spent),
        percentage: pct,
        isExceeded: spent > b.limitAmount,
      });
    }

    // 9. Savings Goals Progress
    const activeGoals = await SavingsGoal.find({
      user: userObjectId,
      status: "ACTIVE",
    }).limit(4);

    const goalsProgress: GoalStatusItem[] = activeGoals.map((g) => {
      const pct =
        g.targetAmount > 0
          ? Math.round((g.currentAmount / g.targetAmount) * 100 * 10) / 10
          : 0;
      return {
        _id: g._id.toString(),
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        percentage: Math.min(100, pct),
        targetDate: g.targetDate ? g.targetDate.toISOString() : undefined,
      };
    });

    // 10. Upcoming Recurring Payments
    const recurringDocs = await RecurringTransaction.find({
      user: userObjectId,
      isActive: true,
    })
      .sort({ nextOccurrence: 1 })
      .limit(4)
      .populate("account", "name");

    const upcomingRecurring: RecurringPaymentItem[] = recurringDocs.map((r) => {
      const acc = r.account as unknown as { name?: string };
      return {
        _id: r._id.toString(),
        description: r.name,
        amount: r.amount,
        type: r.type,
        frequency: r.frequency,
        nextDueDate: r.nextOccurrence ? r.nextOccurrence.toISOString() : new Date().toISOString(),
        accountName: acc?.name,
      };
    });

    // 11. Unread Notifications Count
    const unreadNotificationsCount = await Notification.countDocuments({
      user: userObjectId,
      read: false,
    });

    // 12. Deterministic Rule-Based Financial Insights
    const insights: FinancialInsight[] = [];

    const formatAmt = (val: number) => `₹${val.toLocaleString("en-IN")}`;

    if (totalIncome > 0 && savingsRate >= 25) {
      insights.push({
        id: "insight-healthy-savings",
        type: "SUCCESS",
        title: "Strong Savings Rate",
        message: `You have saved ${savingsRate}% of your income during this period. Keep up the disciplined wealth accumulation!`,
      });
    } else if (totalIncome > 0 && savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        id: "insight-low-savings",
        type: "WARNING",
        title: "Savings Rate Below Target",
        message: `Your savings rate is currently at ${savingsRate}%. Review non-essential expenses to boost your monthly savings buffer.`,
      });
    } else if (totalExpenses > totalIncome && totalIncome > 0) {
      insights.push({
        id: "insight-deficit",
        type: "WARNING",
        title: "Negative Cash Flow",
        message: `Your total outflows exceed income by ${formatAmt(Math.abs(remainingBalance))}. Consider reducing discretionary spending.`,
      });
    }

    if (categoryBreakdown.length > 0) {
      const topCat = categoryBreakdown[0];
      if (topCat.percentage >= 30) {
        insights.push({
          id: "insight-top-category",
          type: "INFO",
          title: `High Concentration in ${topCat.name}`,
          message: `${topCat.name} accounts for ${topCat.percentage}% of your total expenses (${formatAmt(topCat.amount)}).`,
        });
      }
    }

    if (budgetStatus.some((b) => b.isExceeded)) {
      insights.push({
        id: "insight-budget-overrun",
        type: "WARNING",
        title: "Budget Limit Exceeded",
        message: `One or more category budgets have exceeded their monthly allocated threshold.`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: "insight-default-tip",
        type: "TIP",
        title: "Consistent Tracking",
        message: "Regularly logging transactions and categorizing receipts gives you a crystal-clear picture of your cash flow.",
      });
    }

    return {
      summary: {
        totalIncome,
        totalExpenses,
        remainingBalance,
        savingsRate,
        totalNetWorth,
        activeAccountsCount,
        totalTransactionsCount,
        currency: "INR",
      },
      categoryBreakdown,
      monthlyTrends,
      paymentMethods,
      accounts,
      recentTransactions,
      budgetStatus,
      goalsProgress,
      upcomingRecurring,
      unreadNotificationsCount,
      insights,
    };
  }
}
