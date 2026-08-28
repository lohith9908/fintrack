import mongoose from "mongoose";
import { RecurringTransaction, Category, Account, Transaction, Notification } from "../models";
import { IRecurringTransaction, ITransaction, RecurringFrequency } from "../types/database.types";
import {
  CreateRecurringInput,
  UpdateRecurringInput,
  GetRecurringQueryInput,
} from "../validators/recurring.validator";
import { NotFoundError, BadRequestError } from "../utils/apiError";
import { BudgetService } from "./budget.service";
import { NotificationService } from "./notification.service";

export interface RecurringSummary {
  activeCount: number;
  pausedCount: number;
  totalMonthlyExpenses: number;
  totalMonthlyIncome: number;
  nextUpcoming?: {
    _id: string;
    name: string;
    amount: number;
    type: string;
    nextOccurrence: Date;
  };
}

export interface RecurringListResponse {
  recurringTransactions: IRecurringTransaction[];
  summary: RecurringSummary;
}

export class RecurringService {
  /**
   * Helper to advance a date by recurring frequency
   */
  public static advanceOccurrence(currentDate: Date, frequency: RecurringFrequency): Date {
    const next = new Date(currentDate);
    switch (frequency) {
      case "DAILY":
        next.setDate(next.getDate() + 1);
        break;
      case "WEEKLY":
        next.setDate(next.getDate() + 7);
        break;
      case "MONTHLY":
        next.setMonth(next.getMonth() + 1);
        break;
      case "YEARLY":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  /**
   * Calculate monthly equivalent amount for recurring frequency
   */
  public static calculateMonthlyEquivalent(amount: number, frequency: RecurringFrequency): number {
    switch (frequency) {
      case "DAILY":
        return amount * 30;
      case "WEEKLY":
        return Math.round((amount * 52) / 12);
      case "MONTHLY":
        return amount;
      case "YEARLY":
        return Math.round(amount / 12);
      default:
        return amount;
    }
  }

  /**
   * Create a new recurring rule
   */
  public static async createRecurringRule(
    userId: string,
    input: CreateRecurringInput
  ): Promise<IRecurringTransaction> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const categoryObjectId = new mongoose.Types.ObjectId(input.category);
    const accountObjectId = new mongoose.Types.ObjectId(input.account);

    // 1. Verify account
    const account = await Account.findOne({ _id: accountObjectId, user: userObjectId });
    if (!account) {
      throw new NotFoundError("Associated account not found or access denied.");
    }

    // 2. Verify category
    const category = await Category.findOne({
      _id: categoryObjectId,
      $or: [{ isSystem: true }, { user: userObjectId }],
    });
    if (!category) {
      throw new NotFoundError("Associated category not found.");
    }

    if (category.type !== input.type) {
      throw new BadRequestError(
        `Category "${category.name}" is configured for ${category.type.toLowerCase()}s, but recurring rule type is ${input.type.toLowerCase()}.`
      );
    }

    const startDate = new Date(input.startDate);
    const endDate = input.endDate ? new Date(input.endDate) : undefined;

    if (endDate && endDate <= startDate) {
      throw new BadRequestError("End date must be strictly after the start date.");
    }

    // Initial next occurrence defaults to startDate
    const nextOccurrence = startDate;

    const rule = await RecurringTransaction.create({
      user: userObjectId,
      name: input.name.trim(),
      amount: input.amount,
      type: input.type,
      category: categoryObjectId,
      account: accountObjectId,
      paymentMethod: input.paymentMethod,
      frequency: input.frequency,
      startDate,
      nextOccurrence,
      endDate,
      isActive: true,
      notes: input.notes?.trim(),
    });

    const populated = await RecurringTransaction.findById(rule._id)
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    return populated!;
  }

  /**
   * Get user's recurring rules with summary metrics
   */
  public static async getRecurringRules(
    userId: string,
    query: GetRecurringQueryInput = {}
  ): Promise<RecurringListResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const match: Record<string, unknown> = { user: userObjectId };

    if (query.type) match.type = query.type;
    if (query.isActive !== undefined) match.isActive = query.isActive;
    if (query.frequency) match.frequency = query.frequency;

    const rules = await RecurringTransaction.find(match)
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency")
      .sort({ nextOccurrence: 1 });

    // Compute summary
    const allUserRules = await RecurringTransaction.find({ user: userObjectId });
    const activeRules = allUserRules.filter((r) => r.isActive);
    const pausedCount = allUserRules.filter((r) => !r.isActive).length;

    let totalMonthlyExpenses = 0;
    let totalMonthlyIncome = 0;

    activeRules.forEach((r) => {
      const monthlyAmount = this.calculateMonthlyEquivalent(r.amount, r.frequency);
      if (r.type === "EXPENSE") {
        totalMonthlyExpenses += monthlyAmount;
      } else {
        totalMonthlyIncome += monthlyAmount;
      }
    });

    const nextUpcomingRule = activeRules
      .filter((r) => new Date(r.nextOccurrence) >= new Date())
      .sort((a, b) => new Date(a.nextOccurrence).getTime() - new Date(b.nextOccurrence).getTime())[0];

    const nextUpcoming = nextUpcomingRule
      ? {
          _id: nextUpcomingRule._id.toString(),
          name: nextUpcomingRule.name,
          amount: nextUpcomingRule.amount,
          type: nextUpcomingRule.type,
          nextOccurrence: nextUpcomingRule.nextOccurrence,
        }
      : undefined;

    return {
      recurringTransactions: rules,
      summary: {
        activeCount: activeRules.length,
        pausedCount,
        totalMonthlyExpenses,
        totalMonthlyIncome,
        nextUpcoming,
      },
    };
  }

  /**
   * Get single recurring rule by ID
   */
  public static async getRecurringRuleById(
    userId: string,
    id: string
  ): Promise<IRecurringTransaction> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Recurring rule not found or access denied.");
    }

    const rule = await RecurringTransaction.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    })
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    if (!rule) {
      throw new NotFoundError("Recurring rule not found or access denied.");
    }

    return rule;
  }

  /**
   * Update recurring rule
   */
  public static async updateRecurringRule(
    userId: string,
    id: string,
    input: UpdateRecurringInput
  ): Promise<IRecurringTransaction> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Recurring rule not found or access denied.");
    }

    const rule = await RecurringTransaction.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!rule) {
      throw new NotFoundError("Recurring rule not found or access denied.");
    }

    const newType = input.type || rule.type;

    if (input.account) {
      const account = await Account.findOne({
        _id: new mongoose.Types.ObjectId(input.account),
        user: new mongoose.Types.ObjectId(userId),
      });
      if (!account) throw new NotFoundError("Associated account not found.");
      rule.account = account._id;
    }

    if (input.category || input.type) {
      const catId = input.category || rule.category;
      const category = await Category.findOne({
        _id: new mongoose.Types.ObjectId(catId.toString()),
        $or: [{ isSystem: true }, { user: new mongoose.Types.ObjectId(userId) }],
      });
      if (!category) throw new NotFoundError("Associated category not found.");
      if (category.type !== newType) {
        throw new BadRequestError(
          `Category "${category.name}" is configured for ${category.type.toLowerCase()}s, but recurring rule type is ${newType.toLowerCase()}.`
        );
      }
      rule.category = category._id;
    }

    if (input.name) rule.name = input.name.trim();
    if (input.amount !== undefined) rule.amount = input.amount;
    if (input.type) rule.type = input.type;
    if (input.paymentMethod) rule.paymentMethod = input.paymentMethod;
    if (input.frequency) rule.frequency = input.frequency;
    if (input.startDate) rule.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) {
      rule.endDate = input.endDate ? new Date(input.endDate) : undefined;
    }
    if (input.isActive !== undefined) rule.isActive = input.isActive;
    if (input.notes !== undefined) rule.notes = input.notes.trim();

    await rule.save();

    const populated = await RecurringTransaction.findById(rule._id)
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    return populated!;
  }

  /**
   * Toggle active state (pause / resume)
   */
  public static async toggleActive(
    userId: string,
    id: string,
    isActive: boolean
  ): Promise<IRecurringTransaction> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Recurring rule not found or access denied.");
    }

    const rule = await RecurringTransaction.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), user: new mongoose.Types.ObjectId(userId) },
      { isActive },
      { new: true }
    )
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    if (!rule) {
      throw new NotFoundError("Recurring rule not found or access denied.");
    }

    return rule;
  }

  /**
   * Delete recurring rule
   */
  public static async deleteRecurringRule(
    userId: string,
    id: string
  ): Promise<{ message: string }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Recurring rule not found or access denied.");
    }

    const rule = await RecurringTransaction.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!rule) {
      throw new NotFoundError("Recurring rule not found or access denied.");
    }

    return { message: "Recurring rule deleted successfully." };
  }

  /**
   * Scheduler processor: Process all due recurring transactions with strict idempotency and notification deduplication
   */
  public static async processDueTransactions(
    userId?: string
  ): Promise<{ processedCount: number; createdTransactions: ITransaction[] }> {
    const now = new Date();
    const query: Record<string, unknown> = {
      isActive: true,
      nextOccurrence: { $lte: now },
    };
    if (userId) {
      query.user = new mongoose.Types.ObjectId(userId);
    }

    const dueRules = await RecurringTransaction.find(query).populate("category");
    const createdTransactions: ITransaction[] = [];

    for (const rule of dueRules) {
      const occurrenceDate = new Date(rule.nextOccurrence);

      // Guard 1: Check if rule's lastProcessedOccurrence is already equal to or past occurrenceDate
      if (
        rule.lastProcessedOccurrence &&
        new Date(rule.lastProcessedOccurrence).getTime() >= occurrenceDate.getTime()
      ) {
        // Advance nextOccurrence to prevent getting stuck
        const nextDate = this.advanceOccurrence(occurrenceDate, rule.frequency);
        if (rule.endDate && nextDate > new Date(rule.endDate)) {
          rule.isActive = false;
        } else {
          rule.nextOccurrence = nextDate;
        }
        await rule.save();
        continue;
      }

      // Guard 2: Idempotency check against Transaction collection
      const catId = (rule.category as unknown as { _id?: mongoose.Types.ObjectId })._id || rule.category;
      const existingTx = await Transaction.findOne({
        user: rule.user,
        category: catId,
        account: rule.account,
        amount: rule.amount,
        type: rule.type,
        date: occurrenceDate,
        description: `[Recurring] ${rule.name}`,
      });

      let tx: ITransaction | null = existingTx;

      if (!existingTx) {
        // Create transaction
        tx = await Transaction.create({
          user: rule.user,
          amount: rule.amount,
          type: rule.type,
          category: catId,
          account: rule.account,
          paymentMethod: rule.paymentMethod,
          description: `[Recurring] ${rule.name}`,
          date: occurrenceDate,
          notes: rule.notes || `Automatically processed by FinTrack recurring scheduler`,
        });

        createdTransactions.push(tx);

        // Budget alerts if expense
        if (rule.type === "EXPENSE") {
          BudgetService.checkAndTriggerAlerts(rule.user, catId, occurrenceDate).catch((err) => {
            console.error("Budget alert error in recurring scheduler:", err);
          });
        }

        // Create RECURRING_PAYMENT Notification with deduplication guard
        const existingNotif = await Notification.findOne({
          user: rule.user,
          type: "RECURRING_PAYMENT",
          "metadata.recurringId": rule._id.toString(),
          "metadata.occurrenceDate": occurrenceDate.toISOString(),
        });

        if (!existingNotif) {
          await NotificationService.createNotification(rule.user, {
            type: "RECURRING_PAYMENT",
            title: "Recurring Payment Processed",
            message: `Processed scheduled ${rule.type.toLowerCase()} "${rule.name}" for ₹${rule.amount.toLocaleString("en-IN")}.`,
            severity: "INFO",
            metadata: {
              recurringId: rule._id.toString(),
              occurrenceDate: occurrenceDate.toISOString(),
              transactionId: tx._id.toString(),
              amount: rule.amount,
              frequency: rule.frequency,
            },
          });
        }
      }

      // Advance nextOccurrence
      const nextDate = this.advanceOccurrence(occurrenceDate, rule.frequency);
      rule.lastProcessedOccurrence = occurrenceDate;

      // Check if end date reached
      if (rule.endDate && (nextDate > new Date(rule.endDate) || occurrenceDate >= new Date(rule.endDate))) {
        rule.isActive = false;
      } else {
        rule.nextOccurrence = nextDate;
      }

      await rule.save();
    }

    return {
      processedCount: createdTransactions.length,
      createdTransactions,
    };
  }
}
