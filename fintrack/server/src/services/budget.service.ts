import mongoose from "mongoose";
import { Budget, Category, Transaction, Notification } from "../models";
import { IBudget } from "../types/database.types";
import {
  CreateBudgetInput,
  UpdateBudgetInput,
  GetBudgetsQueryInput,
} from "../validators/budget.validator";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../utils/apiError";

export type BudgetStatus = "HEALTHY" | "WARNING" | "CRITICAL" | "EXCEEDED";

export interface EnrichedBudget {
  _id: string;
  user: string;
  category: {
    _id: string;
    name: string;
    type: string;
    color: string;
    icon?: string;
  };
  month: number;
  year: number;
  limitAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  alertThresholds: {
    informational: number;
    warning: number;
    critical: number;
    exceeded: number;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  budgetCount: number;
  exceededCount: number;
  warningCount: number;
  healthyCount: number;
  month: number;
  year: number;
}

export interface BudgetsListResponse {
  budgets: EnrichedBudget[];
  summary: BudgetSummary;
}

export class BudgetService {
  /**
   * Calculate spent amount for a category in a specific month/year
   */
  public static async calculateCategorySpent(
    userId: string | mongoose.Types.ObjectId,
    categoryId: string | mongoose.Types.ObjectId,
    year: number,
    month: number
  ): Promise<number> {
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const agg = await Transaction.aggregate<{ total: number }>([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          category: new mongoose.Types.ObjectId(categoryId),
          type: "EXPENSE",
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return agg[0]?.total || 0;
  }

  /**
   * Determine budget status based on thresholds
   */
  public static determineStatus(
    percentage: number,
    thresholds?: { warning?: number; critical?: number; exceeded?: number }
  ): BudgetStatus {
    const warningLimit = thresholds?.warning ?? 75;
    const criticalLimit = thresholds?.critical ?? 90;
    const exceededLimit = thresholds?.exceeded ?? 100;

    if (percentage >= exceededLimit) {
      return "EXCEEDED";
    }
    if (percentage >= criticalLimit) {
      return "CRITICAL";
    }
    if (percentage >= warningLimit) {
      return "WARNING";
    }
    return "HEALTHY";
  }

  /**
   * Helper to enrich a raw budget document with real-time spend calculations
   */
  public static async enrichBudget(
    budgetDoc: IBudget & { _id: mongoose.Types.ObjectId }
  ): Promise<EnrichedBudget> {
    const spent = await this.calculateCategorySpent(
      budgetDoc.user.toString(),
      (budgetDoc.category as unknown as { _id?: mongoose.Types.ObjectId })._id?.toString() ||
        budgetDoc.category.toString(),
      budgetDoc.year,
      budgetDoc.month
    );

    const limitAmount = budgetDoc.limitAmount;
    const remaining = Math.max(0, limitAmount - spent);
    const percentage =
      limitAmount > 0 ? Math.round((spent / limitAmount) * 100 * 10) / 10 : 0;

    const status = this.determineStatus(
      percentage,
      budgetDoc.alertThresholds
    );

    const cat = budgetDoc.category as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      type: string;
      color: string;
      icon?: string;
    };

    return {
      _id: budgetDoc._id.toString(),
      user: budgetDoc.user.toString(),
      category: {
        _id: cat._id?.toString() || budgetDoc.category.toString(),
        name: cat.name || "Category",
        type: cat.type || "EXPENSE",
        color: cat.color || "#3B82F6",
        icon: cat.icon || "Tag",
      },
      month: budgetDoc.month,
      year: budgetDoc.year,
      limitAmount,
      spent,
      remaining,
      percentage,
      status,
      alertThresholds: {
        informational: budgetDoc.alertThresholds?.informational ?? 50,
        warning: budgetDoc.alertThresholds?.warning ?? 75,
        critical: budgetDoc.alertThresholds?.critical ?? 90,
        exceeded: budgetDoc.alertThresholds?.exceeded ?? 100,
      },
      notes: budgetDoc.notes,
      createdAt: (budgetDoc as unknown as { createdAt: Date }).createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: (budgetDoc as unknown as { updatedAt: Date }).updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Create a new category budget
   */
  public static async createBudget(
    userId: string,
    input: CreateBudgetInput
  ): Promise<EnrichedBudget> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const categoryObjectId = new mongoose.Types.ObjectId(input.category);

    // 1. Verify category exists and is an EXPENSE category
    const category = await Category.findOne({
      _id: categoryObjectId,
      $or: [{ isSystem: true }, { user: userObjectId }],
    });

    if (!category) {
      throw new NotFoundError("Category not found or access denied.");
    }

    if (category.type !== "EXPENSE") {
      throw new BadRequestError("Budgets can only be assigned to expense categories.");
    }

    // 2. Check for duplicate budget in same month and year
    const existing = await Budget.findOne({
      user: userObjectId,
      category: categoryObjectId,
      year: input.year,
      month: input.month,
    });

    if (existing) {
      throw new ConflictError(
        `A budget for category "${category.name}" already exists for ${input.month}/${input.year}.`
      );
    }

    // 3. Create budget document
    const budget = await Budget.create({
      user: userObjectId,
      category: categoryObjectId,
      month: input.month,
      year: input.year,
      limitAmount: input.limitAmount,
      alertThresholds: {
        informational: input.alertThresholds?.informational ?? 50,
        warning: input.alertThresholds?.warning ?? 75,
        critical: input.alertThresholds?.critical ?? 90,
        exceeded: input.alertThresholds?.exceeded ?? 100,
      },
      notes: input.notes,
    });

    const populated = await Budget.findById(budget._id).populate("category");
    return this.enrichBudget(populated as unknown as IBudget & { _id: mongoose.Types.ObjectId });
  }

  /**
   * Get all budgets for a given month/year with summary statistics
   */
  public static async getBudgets(
    userId: string,
    query: GetBudgetsQueryInput
  ): Promise<BudgetsListResponse> {
    const now = new Date();
    const targetMonth = query.month ?? now.getMonth() + 1;
    const targetYear = query.year ?? now.getFullYear();

    const budgets = await Budget.find({
      user: new mongoose.Types.ObjectId(userId),
      month: targetMonth,
      year: targetYear,
    })
      .populate("category")
      .sort({ createdAt: -1 });

    const enrichedBudgets: EnrichedBudget[] = await Promise.all(
      budgets.map((b) => this.enrichBudget(b as unknown as IBudget & { _id: mongoose.Types.ObjectId }))
    );

    // Aggregate summary statistics
    const totalBudgeted = enrichedBudgets.reduce((acc, b) => acc + b.limitAmount, 0);
    const totalSpent = enrichedBudgets.reduce((acc, b) => acc + b.spent, 0);
    const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
    const overallPercentage =
      totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100 * 10) / 10 : 0;

    const exceededCount = enrichedBudgets.filter((b) => b.status === "EXCEEDED").length;
    const warningCount = enrichedBudgets.filter(
      (b) => b.status === "WARNING" || b.status === "CRITICAL"
    ).length;
    const healthyCount = enrichedBudgets.filter((b) => b.status === "HEALTHY").length;

    return {
      budgets: enrichedBudgets,
      summary: {
        totalBudgeted,
        totalSpent,
        totalRemaining,
        overallPercentage,
        budgetCount: enrichedBudgets.length,
        exceededCount,
        warningCount,
        healthyCount,
        month: targetMonth,
        year: targetYear,
      },
    };
  }

  /**
   * Get single budget by ID
   */
  public static async getBudgetById(
    userId: string,
    budgetId: string
  ): Promise<EnrichedBudget> {
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      throw new NotFoundError("Budget not found or access denied.");
    }

    const budget = await Budget.findOne({
      _id: new mongoose.Types.ObjectId(budgetId),
      user: new mongoose.Types.ObjectId(userId),
    }).populate("category");

    if (!budget) {
      throw new NotFoundError("Budget not found or access denied.");
    }

    return this.enrichBudget(budget as unknown as IBudget & { _id: mongoose.Types.ObjectId });
  }

  /**
   * Update budget
   */
  public static async updateBudget(
    userId: string,
    budgetId: string,
    input: UpdateBudgetInput
  ): Promise<EnrichedBudget> {
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      throw new NotFoundError("Budget not found or access denied.");
    }

    const budget = await Budget.findOne({
      _id: new mongoose.Types.ObjectId(budgetId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!budget) {
      throw new NotFoundError("Budget not found or access denied.");
    }

    if (input.limitAmount !== undefined) budget.limitAmount = input.limitAmount;
    if (input.alertThresholds !== undefined) {
      budget.alertThresholds = {
        informational: input.alertThresholds.informational ?? budget.alertThresholds?.informational ?? 50,
        warning: input.alertThresholds.warning ?? budget.alertThresholds?.warning ?? 75,
        critical: input.alertThresholds.critical ?? budget.alertThresholds?.critical ?? 90,
        exceeded: input.alertThresholds.exceeded ?? budget.alertThresholds?.exceeded ?? 100,
      };
    }
    if (input.notes !== undefined) budget.notes = input.notes;

    await budget.save();

    const populated = await Budget.findById(budget._id).populate("category");
    return this.enrichBudget(populated as unknown as IBudget & { _id: mongoose.Types.ObjectId });
  }

  /**
   * Delete budget
   */
  public static async deleteBudget(
    userId: string,
    budgetId: string
  ): Promise<{ message: string }> {
    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      throw new NotFoundError("Budget not found or access denied.");
    }

    const budget = await Budget.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(budgetId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!budget) {
      throw new NotFoundError("Budget not found or access denied.");
    }

    return { message: "Budget deleted successfully." };
  }

  /**
   * Check budget thresholds and trigger automated notifications
   */
  public static async checkAndTriggerAlerts(
    userId: string | mongoose.Types.ObjectId,
    categoryId: string | mongoose.Types.ObjectId,
    transactionDate: Date | string
  ): Promise<void> {
    const d = new Date(transactionDate);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    const budget = await Budget.findOne({
      user: new mongoose.Types.ObjectId(userId),
      category: new mongoose.Types.ObjectId(categoryId),
      year,
      month,
    }).populate("category");

    if (!budget) return;

    const spent = await this.calculateCategorySpent(userId, categoryId, year, month);
    const limitAmount = budget.limitAmount;
    const percentage = limitAmount > 0 ? (spent / limitAmount) * 100 : 0;
    const cat = budget.category as unknown as { name?: string };
    const categoryName = cat?.name || "Category";

    let thresholdLevel: "EXCEEDED" | "CRITICAL" | "WARNING" | null = null;
    let notifType: "BUDGET_EXCEEDED" | "BUDGET_ALERT" = "BUDGET_ALERT";
    let severity: "CRITICAL" | "WARNING" = "WARNING";
    let title = "";
    let message = "";

    const exceededThreshold = budget.alertThresholds?.exceeded ?? 100;
    const criticalThreshold = budget.alertThresholds?.critical ?? 90;
    const warningThreshold = budget.alertThresholds?.warning ?? 75;

    if (percentage >= exceededThreshold) {
      thresholdLevel = "EXCEEDED";
      notifType = "BUDGET_EXCEEDED";
      severity = "CRITICAL";
      title = "Budget Limit Exceeded";
      message = `Your monthly budget for "${categoryName}" has exceeded 100% (Spent: ₹${spent.toLocaleString("en-IN")} / Limit: ₹${limitAmount.toLocaleString("en-IN")}).`;
    } else if (percentage >= criticalThreshold) {
      thresholdLevel = "CRITICAL";
      notifType = "BUDGET_ALERT";
      severity = "CRITICAL";
      title = "Critical Budget Alert";
      message = `Your spendings in "${categoryName}" reached ${Math.round(percentage)}% of your monthly limit of ₹${limitAmount.toLocaleString("en-IN")}.`;
    } else if (percentage >= warningThreshold) {
      thresholdLevel = "WARNING";
      notifType = "BUDGET_ALERT";
      severity = "WARNING";
      title = "Budget Warning Alert";
      message = `You have utilized ${Math.round(percentage)}% of your "${categoryName}" budget for ${month}/${year}.`;
    }

    if (thresholdLevel) {
      // Check if alert for this exact threshold was already created for this budget and month
      const existingAlert = await Notification.findOne({
        user: new mongoose.Types.ObjectId(userId),
        type: notifType,
        "metadata.budgetId": budget._id.toString(),
        "metadata.thresholdLevel": thresholdLevel,
        "metadata.month": month,
        "metadata.year": year,
      });

      if (!existingAlert) {
        await Notification.create({
          user: new mongoose.Types.ObjectId(userId),
          type: notifType,
          title,
          message,
          severity,
          read: false,
          metadata: {
            budgetId: budget._id.toString(),
            categoryId: categoryId.toString(),
            thresholdLevel,
            month,
            year,
            percentage: Math.round(percentage * 10) / 10,
            spent,
            limitAmount,
          },
        });
      }
    }
  }
}
