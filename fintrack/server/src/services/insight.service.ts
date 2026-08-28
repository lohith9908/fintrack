import mongoose from "mongoose";
import { Transaction, Budget, SavingsGoal, RecurringTransaction } from "../models";

export interface DeterministicInsight {
  id: string;
  rule: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "TIP";
  severity: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  message: string;
  category?: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
}

export interface InsightContext {
  userId: string;
  startDate?: Date | string;
  endDate?: Date | string;
  period?: string;
  accountId?: string;
  categoryId?: string;
  paymentMethod?: string;
}

export class InsightService {
  /**
   * Format currency for Indian context / default INR
   */
  private static formatCurrency(amount: number): string {
    return `₹${Math.round(amount).toLocaleString("en-IN")}`;
  }

  /**
   * Evaluate all deterministic insight rules for a user
   * Zero external AI APIs, zero external keys, 100% deterministic internal calculations
   */
  public static async evaluateInsights(
    userId: string,
    _context: Partial<InsightContext> = {}
  ): Promise<DeterministicInsight[]> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const insights: DeterministicInsight[] = [];

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Fetch current month and previous month financial data
    const [currentMonthTotals, prevMonthTotals] = await Promise.all([
      Transaction.aggregate<{
        _id: null;
        income: number;
        expense: number;
      }>([
        {
          $match: {
            user: userObjectId,
            date: { $gte: currentMonthStart, $lte: currentMonthEnd },
          },
        },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } },
          },
        },
      ]),
      Transaction.aggregate<{
        _id: null;
        income: number;
        expense: number;
      }>([
        {
          $match: {
            user: userObjectId,
            date: { $gte: prevMonthStart, $lte: prevMonthEnd },
          },
        },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] } },
            expense: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } },
          },
        },
      ]),
    ]);

    const curIncome = currentMonthTotals[0]?.income || 0;
    const curExpense = currentMonthTotals[0]?.expense || 0;
    const curSavings = curIncome - curExpense;
    const curSavingsRate = curIncome > 0 ? Math.round((curSavings / curIncome) * 100) : 0;

    const prevIncome = prevMonthTotals[0]?.income || 0;
    const prevExpense = prevMonthTotals[0]?.expense || 0;
    const prevSavings = prevIncome - prevExpense;

    // -------------------------------------------------------------------
    // Rule 1: MONTH_OVER_MONTH_EXPENSE_INCREASE
    // -------------------------------------------------------------------
    if (prevExpense > 0 && curExpense > prevExpense * 1.1) {
      const pctIncrease = Math.round(((curExpense - prevExpense) / prevExpense) * 100);
      insights.push({
        id: `insight-mom-expense-increase`,
        rule: "MONTH_OVER_MONTH_EXPENSE_INCREASE",
        type: "WARNING",
        severity: pctIncrease >= 25 ? "HIGH" : "MEDIUM",
        title: "Monthly Spending Surge",
        message: `Your total expenses increased by ${pctIncrease}% compared with last month (${this.formatCurrency(curExpense)} vs ${this.formatCurrency(prevExpense)}).`,
        metadata: {
          currentExpense: curExpense,
          previousExpense: prevExpense,
          percentageIncrease: pctIncrease,
        },
        actionUrl: "/transactions",
        actionLabel: "Review Transactions",
      });
    }

    // -------------------------------------------------------------------
    // Rule 2: SAVINGS_IMPROVEMENT & SAVINGS_RATE_STATUS
    // -------------------------------------------------------------------
    if (curSavings > prevSavings && curSavings > 0 && prevSavings >= 0) {
      const diff = curSavings - prevSavings;
      insights.push({
        id: `insight-savings-growth`,
        rule: "SAVINGS_IMPROVEMENT",
        type: "SUCCESS",
        severity: "LOW",
        title: "Savings Improvement",
        message: `You saved ${this.formatCurrency(diff)} more than last month. Great job sticking to your financial plan!`,
        metadata: {
          currentSavings: curSavings,
          previousSavings: prevSavings,
          difference: diff,
        },
        actionUrl: "/goals",
        actionLabel: "Allocate to Goals",
      });
    } else if (curIncome > 0 && curSavingsRate >= 25) {
      insights.push({
        id: `insight-strong-savings-rate`,
        rule: "STRONG_SAVINGS_RATE",
        type: "SUCCESS",
        severity: "LOW",
        title: "Strong Savings Rate",
        message: `Your current savings rate is ${curSavingsRate}%, exceeding the healthy 20% benchmark.`,
        metadata: { savingsRate: curSavingsRate },
      });
    } else if (curIncome > 0 && curExpense > curIncome) {
      const deficit = curExpense - curIncome;
      insights.push({
        id: `insight-cashflow-deficit`,
        rule: "CASH_FLOW_DEFICIT",
        type: "WARNING",
        severity: "HIGH",
        title: "Cash Flow Deficit",
        message: `Total spending exceeds your monthly income by ${this.formatCurrency(deficit)}. Consider dialing back non-essential expenses.`,
        metadata: { deficit, curExpense, curIncome },
        actionUrl: "/budgets",
        actionLabel: "Check Budgets",
      });
    }

    // -------------------------------------------------------------------
    // Rule 3: CATEGORY_EXPENSE_SPIKE & CATEGORY_CONCENTRATION
    // -------------------------------------------------------------------
    const [curCatAgg, prevCatAgg] = await Promise.all([
      Transaction.aggregate<{
        _id: mongoose.Types.ObjectId;
        amount: number;
      }>([
        {
          $match: {
            user: userObjectId,
            type: "EXPENSE",
            date: { $gte: currentMonthStart, $lte: currentMonthEnd },
          },
        },
        { $group: { _id: "$category", amount: { $sum: "$amount" } } },
        { $sort: { amount: -1 } },
      ]),
      Transaction.aggregate<{
        _id: mongoose.Types.ObjectId;
        amount: number;
      }>([
        {
          $match: {
            user: userObjectId,
            type: "EXPENSE",
            date: { $gte: prevMonthStart, $lte: prevMonthEnd },
          },
        },
        { $group: { _id: "$category", amount: { $sum: "$amount" } } },
      ]),
    ]);

    const prevCatMap = new Map<string, number>();
    prevCatAgg.forEach((c) => {
      if (c._id) prevCatMap.set(c._id.toString(), c.amount);
    });

    if (curCatAgg.length > 0) {
      // Check top category concentration (>= 30% of total expense)
      const topCat = curCatAgg[0];
      const topCatShare = curExpense > 0 ? Math.round((topCat.amount / curExpense) * 100) : 0;

      // Populate top category name
      const populatedTopCat = await Transaction.findById(
        (await Transaction.findOne({ category: topCat._id }))?._id
      ).populate("category", "name");
      const catDoc = populatedTopCat?.category as unknown as { name?: string };
      const topCatName = catDoc?.name || "Top Category";

      if (topCatShare >= 30 && topCat.amount > 0) {
        insights.push({
          id: `insight-category-concentration-${topCat._id}`,
          rule: "CATEGORY_CONCENTRATION",
          type: "INFO",
          severity: "MEDIUM",
          title: `High Spending in ${topCatName}`,
          message: `${topCatName} accounts for ${topCatShare}% of your monthly expenses (${this.formatCurrency(topCat.amount)}).`,
          category: topCatName,
          metadata: {
            categoryId: topCat._id.toString(),
            categoryName: topCatName,
            amount: topCat.amount,
            percentage: topCatShare,
          },
          actionUrl: "/transactions",
          actionLabel: "View Category Spend",
        });
      }

      // Check category expense spike (> 18% increase compared to last month)
      for (const curCat of curCatAgg.slice(0, 3)) {
        if (!curCat._id) continue;
        const prevAmount = prevCatMap.get(curCat._id.toString()) || 0;
        if (prevAmount > 0 && curCat.amount > prevAmount * 1.18 && curCat.amount - prevAmount >= 500) {
          const pct = Math.round(((curCat.amount - prevAmount) / prevAmount) * 100);
          const sampleTx = await Transaction.findOne({ category: curCat._id }).populate(
            "category",
            "name"
          );
          const cName = (sampleTx?.category as unknown as { name?: string })?.name || "Category";

          insights.push({
            id: `insight-category-spike-${curCat._id}`,
            rule: "CATEGORY_EXPENSE_SPIKE",
            type: "WARNING",
            severity: "MEDIUM",
            title: `${cName} Spending Increased`,
            message: `Your ${cName} expenses increased by ${pct}% compared with last month (${this.formatCurrency(curCat.amount)} vs ${this.formatCurrency(prevAmount)}).`,
            category: cName,
            metadata: {
              categoryId: curCat._id.toString(),
              categoryName: cName,
              currentAmount: curCat.amount,
              previousAmount: prevAmount,
              percentageIncrease: pct,
            },
            actionUrl: "/transactions",
            actionLabel: "View Transactions",
          });
          break; // Keep to 1 category spike insight to avoid clutter
        }
      }
    }

    // -------------------------------------------------------------------
    // Rule 4: BUDGET_THRESHOLD_ALERTS
    // -------------------------------------------------------------------
    const activeBudgets = await Budget.find({
      user: userObjectId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }).populate("category", "name");

    for (const b of activeBudgets) {
      const catObj = b.category as unknown as { name?: string; _id: mongoose.Types.ObjectId };
      const catName = catObj?.name || "Budget";
      const spentAgg = await Transaction.aggregate<{ total: number }>([
        {
          $match: {
            user: userObjectId,
            category: catObj?._id || b.category,
            type: "EXPENSE",
            date: { $gte: currentMonthStart, $lte: currentMonthEnd },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const spent = spentAgg[0]?.total || 0;
      const pct = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;

      if (pct >= 100) {
        insights.push({
          id: `insight-budget-exceeded-${b._id}`,
          rule: "BUDGET_EXCEEDED",
          type: "WARNING",
          severity: "HIGH",
          title: `Budget Exceeded: ${catName}`,
          message: `You have spent ${this.formatCurrency(spent)} (${pct}%) of your ${this.formatCurrency(b.limitAmount)} budget for ${catName}.`,
          category: catName,
          metadata: { budgetId: b._id.toString(), spent, limit: b.limitAmount, percentage: pct },
          actionUrl: "/budgets",
          actionLabel: "Manage Budgets",
        });
        break;
      } else if (pct >= 85) {
        insights.push({
          id: `insight-budget-warning-${b._id}`,
          rule: "BUDGET_THRESHOLD_WARNING",
          type: "WARNING",
          severity: "MEDIUM",
          title: `Budget Alert: ${catName}`,
          message: `You have utilized ${pct}% of your allocated ${catName} budget with ${this.formatCurrency(b.limitAmount - spent)} remaining.`,
          category: catName,
          metadata: { budgetId: b._id.toString(), spent, limit: b.limitAmount, percentage: pct },
          actionUrl: "/budgets",
          actionLabel: "View Budget",
        });
        break;
      }
    }

    // -------------------------------------------------------------------
    // Rule 5: GOAL_MILESTONE_PROXIMITY
    // -------------------------------------------------------------------
    const nearGoals = await SavingsGoal.find({
      user: userObjectId,
      status: "ACTIVE",
      targetAmount: { $gt: 0 },
    });

    for (const g of nearGoals) {
      const progressPct = Math.round((g.currentAmount / g.targetAmount) * 100);
      const remainingAmt = g.targetAmount - g.currentAmount;

      if (progressPct >= 80 && remainingAmt > 0) {
        insights.push({
          id: `insight-goal-near-${g._id}`,
          rule: "GOAL_NEAR_COMPLETION",
          type: "SUCCESS",
          severity: "LOW",
          title: `Goal Almost Reached: ${g.name}`,
          message: `You are only ${this.formatCurrency(remainingAmt)} away from reaching your "${g.name}" goal (${progressPct}% completed).`,
          metadata: {
            goalId: g._id.toString(),
            name: g.name,
            currentAmount: g.currentAmount,
            targetAmount: g.targetAmount,
            progressPct,
          },
          actionUrl: "/goals",
          actionLabel: "Complete Goal",
        });
        break;
      }
    }

    // -------------------------------------------------------------------
    // Rule 6: UPCOMING_RECURRING_BILL (due in next 3-7 days)
    // -------------------------------------------------------------------
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const upcomingRecurring = await RecurringTransaction.find({
      user: userObjectId,
      isActive: true,
      nextOccurrence: { $gte: now, $lte: threeDaysFromNow },
    })
      .sort({ nextOccurrence: 1 })
      .limit(1);

    if (upcomingRecurring.length > 0) {
      const bill = upcomingRecurring[0];
      const dueDateStr = bill.nextOccurrence.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      insights.push({
        id: `insight-upcoming-bill-${bill._id}`,
        rule: "UPCOMING_RECURRING_PAYMENT",
        type: "INFO",
        severity: "MEDIUM",
        title: `Upcoming Payment: ${bill.name}`,
        message: `Payment of ${this.formatCurrency(bill.amount)} for "${bill.name}" is due on ${dueDateStr}.`,
        metadata: {
          recurringId: bill._id.toString(),
          name: bill.name,
          amount: bill.amount,
          nextOccurrence: bill.nextOccurrence.toISOString(),
        },
        actionUrl: "/recurring",
        actionLabel: "View Recurring",
      });
    }

    // Fallback baseline tip if no specific insight was triggered
    if (insights.length === 0) {
      insights.push({
        id: "insight-baseline-tracking",
        rule: "BASELINE_INSIGHT",
        type: "TIP",
        severity: "LOW",
        title: "Smart Financial Tracking",
        message: "Consistent transaction logging helps FinTrack identify spending patterns and uncover savings opportunities.",
        actionUrl: "/transactions",
        actionLabel: "Add Transaction",
      });
    }

    return insights;
  }
}
