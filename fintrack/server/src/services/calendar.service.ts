import mongoose from "mongoose";
import { RecurringTransaction, SavingsGoal, Budget, Transaction, Category } from "../models";
import { CalendarQueryParams } from "../validators/calendar.validator";

export interface CalendarEvent {
  id: string;
  type: "RECURRING_PAYMENT" | "GOAL_DEADLINE" | "BUDGET_PERIOD" | "TRANSACTION";
  title: string;
  date: string; // YYYY-MM-DD
  amount?: number;
  currency?: string;
  status?: string;
  severity?: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  categoryName?: string;
  accountName?: string;
  metadata?: Record<string, unknown>;
  actionUrl: string;
  actionLabel: string;
}

export interface CalendarDaySummary {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  totalInflow: number;
  totalOutflow: number;
  eventsCount: number;
  events: CalendarEvent[];
}

export interface CalendarMonthResponse {
  month: number;
  year: number;
  monthLabel: string;
  events: CalendarEvent[];
  days: CalendarDaySummary[];
  summary: {
    totalProjectedBills: number;
    totalProjectedIncome: number;
    goalDeadlinesCount: number;
    activeBudgetsCount: number;
    recordedTransactionsCount: number;
  };
}

export class CalendarService {
  /**
   * Get all aggregated financial events and daily densities for a calendar month
   */
  public static async getMonthEvents(
    userId: string,
    params: CalendarQueryParams
  ): Promise<CalendarMonthResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const now = new Date();
    const targetYear = params.year || now.getFullYear();
    const targetMonth = params.month || now.getMonth() + 1; // 1-12

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const filterType = params.type || "ALL";

    const events: CalendarEvent[] = [];

    // Preload categories for mapping
    const categories = await Category.find({});
    const categoryMap = new Map<string, string>();
    categories.forEach((cat) => {
      categoryMap.set(cat._id.toString(), cat.name);
    });

    // 1. Fetch Recurring Transactions and Project Occurrences in Month
    if (filterType === "ALL" || filterType === "RECURRING_PAYMENT") {
      const recurringRules = await RecurringTransaction.find({
        user: userObjectId,
        isActive: true,
      }).populate("account", "name");

      for (const rule of recurringRules) {
        const ruleOccurrences = this.calculateOccurrencesInMonth(rule, targetYear, targetMonth);
        const catName = rule.category ? categoryMap.get(rule.category.toString()) || "General" : "General";
        const accName = (rule.account as unknown as { name?: string })?.name || "Account";

        for (const occDate of ruleOccurrences) {
          const dateStr = occDate.toISOString().split("T")[0];
          const isExpense = rule.type === "EXPENSE";

          events.push({
            id: `rec-${rule._id.toString()}-${dateStr}`,
            type: "RECURRING_PAYMENT",
            title: rule.name || `${isExpense ? "Bill" : "Income"}: ${catName}`,
            date: dateStr,
            amount: rule.amount,
            status: rule.isActive ? "ACTIVE" : "PAUSED",
            severity: isExpense ? "WARNING" : "SUCCESS",
            categoryName: catName,
            accountName: accName,
            metadata: {
              ruleId: rule._id.toString(),
              frequency: rule.frequency,
              type: rule.type,
              nextOccurrence: rule.nextOccurrence,
            },
            actionUrl: "/recurring",
            actionLabel: "View Recurring Rule",
          });
        }
      }
    }

    // 2. Fetch Savings Goals Deadlines
    if (filterType === "ALL" || filterType === "GOAL_DEADLINE") {
      const goals = await SavingsGoal.find({
        user: userObjectId,
        targetDate: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $ne: "CANCELLED" },
      });

      for (const goal of goals) {
        if (!goal.targetDate) continue;
        const dateStr = goal.targetDate.toISOString().split("T")[0];
        const progressPct = goal.targetAmount > 0 ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0;
        const shortfall = Math.max(0, goal.targetAmount - goal.currentAmount);

        events.push({
          id: `goal-${goal._id.toString()}`,
          type: "GOAL_DEADLINE",
          title: `Goal Deadline: ${goal.name}`,
          date: dateStr,
          amount: goal.targetAmount,
          status: goal.status,
          severity: goal.status === "COMPLETED" ? "SUCCESS" : shortfall > 0 ? "INFO" : "SUCCESS",
          metadata: {
            goalId: goal._id.toString(),
            currentAmount: goal.currentAmount,
            progressPct,
            shortfall,
          },
          actionUrl: "/goals",
          actionLabel: "View Savings Goal",
        });
      }
    }

    // 3. Fetch Monthly Budget Periods
    if (filterType === "ALL" || filterType === "BUDGET_PERIOD") {
      const budgets = await Budget.find({
        user: userObjectId,
        month: targetMonth,
        year: targetYear,
      });

      for (const budget of budgets) {
        const catName = budget.category ? categoryMap.get(budget.category.toString()) || "Category" : "Overall";
        const dateStr = startOfMonth.toISOString().split("T")[0];

        events.push({
          id: `budget-${budget._id.toString()}`,
          type: "BUDGET_PERIOD",
          title: `Budget Limit: ${catName}`,
          date: dateStr,
          amount: budget.limitAmount,
          status: "ACTIVE",
          severity: "INFO",
          categoryName: catName,
          metadata: {
            budgetId: budget._id.toString(),
            limitAmount: budget.limitAmount,
            month: budget.month,
            year: budget.year,
          },
          actionUrl: "/budgets",
          actionLabel: "View Monthly Budget",
        });
      }
    }

    // 4. Fetch Actual Transactions recorded on each date
    let recordedTxnCount = 0;
    if (filterType === "ALL" || filterType === "TRANSACTION") {
      const transactions = await Transaction.find({
        user: userObjectId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }).populate("account", "name");

      recordedTxnCount = transactions.length;

      for (const txn of transactions) {
        const dateStr = txn.date.toISOString().split("T")[0];
        const catName = txn.category ? categoryMap.get(txn.category.toString()) || "Uncategorized" : "Uncategorized";
        const accName = (txn.account as unknown as { name?: string })?.name || "Account";

        events.push({
          id: `txn-${txn._id.toString()}`,
          type: "TRANSACTION",
          title: txn.description || `${txn.type}: ${catName}`,
          date: dateStr,
          amount: txn.amount,
          status: "COMPLETED",
          severity: txn.type === "INCOME" ? "SUCCESS" : "INFO",
          categoryName: catName,
          accountName: accName,
          metadata: {
            transactionId: txn._id.toString(),
            type: txn.type,
            paymentMethod: txn.paymentMethod,
          },
          actionUrl: "/transactions",
          actionLabel: "View Transaction",
        });
      }
    }

    // Sort events by date ascending
    events.sort((a, b) => a.date.localeCompare(b.date));

    // Build Daily Density summaries for all days of the target month
    const totalDaysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const days: CalendarDaySummary[] = [];

    const eventByDateMap = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const list = eventByDateMap.get(evt.date) || [];
      list.push(evt);
      eventByDateMap.set(evt.date, list);
    }

    let totalProjectedBills = 0;
    let totalProjectedIncome = 0;
    let goalDeadlinesCount = 0;
    let activeBudgetsCount = 0;

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = eventByDateMap.get(dayStr) || [];

      let totalInflow = 0;
      let totalOutflow = 0;

      for (const evt of dayEvents) {
        if (evt.type === "RECURRING_PAYMENT") {
          const recType = (evt.metadata as { type?: string })?.type;
          if (recType === "EXPENSE") {
            totalProjectedBills += evt.amount || 0;
            totalOutflow += evt.amount || 0;
          } else if (recType === "INCOME") {
            totalProjectedIncome += evt.amount || 0;
            totalInflow += evt.amount || 0;
          }
        } else if (evt.type === "TRANSACTION") {
          const txnType = (evt.metadata as { type?: string })?.type;
          if (txnType === "EXPENSE") {
            totalOutflow += evt.amount || 0;
          } else if (txnType === "INCOME") {
            totalInflow += evt.amount || 0;
          }
        } else if (evt.type === "GOAL_DEADLINE") {
          goalDeadlinesCount++;
        } else if (evt.type === "BUDGET_PERIOD") {
          activeBudgetsCount++;
        }
      }

      days.push({
        date: dayStr,
        dayNumber: d,
        isCurrentMonth: true,
        totalInflow,
        totalOutflow,
        eventsCount: dayEvents.length,
        events: dayEvents,
      });
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return {
      month: targetMonth,
      year: targetYear,
      monthLabel: `${monthNames[targetMonth - 1]} ${targetYear}`,
      events,
      days,
      summary: {
        totalProjectedBills,
        totalProjectedIncome,
        goalDeadlinesCount,
        activeBudgetsCount,
        recordedTransactionsCount: recordedTxnCount,
      },
    };
  }

  /**
   * Helper: Calculate dates an active recurring rule will trigger within a given month
   */
  private static calculateOccurrencesInMonth(
    rule: {
      frequency: string;
      startDate: Date;
      endDate?: Date;
      nextOccurrence?: Date;
      customIntervalDays?: number;
    },
    targetYear: number,
    targetMonth: number
  ): Date[] {
    const occurrences: Date[] = [];
    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const ruleStart = new Date(rule.startDate);
    const ruleEnd = rule.endDate ? new Date(rule.endDate) : null;

    // Rule ended before this month or starts after this month
    if (ruleEnd && ruleEnd < startOfMonth) return [];
    if (ruleStart > endOfMonth) return [];

    let current = new Date(ruleStart);

    // Fast-forward current to near start of month
    while (current < startOfMonth) {
      current = this.getNextOccurrenceDate(current, rule.frequency, rule.customIntervalDays);
    }

    // Collect occurrences within this month
    while (current <= endOfMonth) {
      if (!ruleEnd || current <= ruleEnd) {
        occurrences.push(new Date(current));
      }
      current = this.getNextOccurrenceDate(current, rule.frequency, rule.customIntervalDays);
    }

    return occurrences;
  }

  private static getNextOccurrenceDate(base: Date, frequency: string, customInterval = 1): Date {
    const next = new Date(base);
    switch (frequency) {
      case "DAILY":
        next.setUTCDate(next.getUTCDate() + 1);
        break;
      case "WEEKLY":
        next.setUTCDate(next.getUTCDate() + 7);
        break;
      case "MONTHLY":
        next.setUTCMonth(next.getUTCMonth() + 1);
        break;
      case "YEARLY":
        next.setUTCFullYear(next.getUTCFullYear() + 1);
        break;
      case "CUSTOM":
        next.setUTCDate(next.getUTCDate() + (customInterval || 1));
        break;
      default:
        next.setUTCMonth(next.getUTCMonth() + 1);
    }
    return next;
  }
}
