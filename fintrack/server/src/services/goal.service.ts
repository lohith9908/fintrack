import mongoose from "mongoose";
import { SavingsGoal, Notification, Account } from "../models";
import { ISavingsGoal, SavingsGoalStatus } from "../types/database.types";
import {
  CreateGoalInput,
  UpdateGoalInput,
  AddContributionInput,
  GetGoalsQueryInput,
} from "../validators/goal.validator";
import { NotFoundError, BadRequestError } from "../utils/apiError";
import { AccountService } from "./account.service";

export interface GoalSummary {
  totalTargetAmount: number;
  totalCurrentAmount: number;
  overallPercentage: number;
  activeCount: number;
  completedCount: number;
  pausedCount: number;
}

export interface GoalsListResponse {
  goals: Array<ISavingsGoal & { percentage: number; remainingAmount: number }>;
  summary: GoalSummary;
}

export class GoalService {
  /**
   * Helper to compute goal metrics
   */
  public static enrichGoal(goal: ISavingsGoal): ISavingsGoal & { percentage: number; remainingAmount: number } {
    const percentage =
      goal.targetAmount > 0
        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100 * 10) / 10)
        : 0;
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

    const goalObj = goal.toJSON ? goal.toJSON() : (goal as unknown as Record<string, unknown>);
    return {
      ...goalObj,
      percentage,
      remainingAmount,
    } as unknown as ISavingsGoal & { percentage: number; remainingAmount: number };
  }

  /**
   * Create a new savings goal
   */
  public static async createGoal(
    userId: string,
    input: CreateGoalInput
  ): Promise<ISavingsGoal & { percentage: number; remainingAmount: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const targetDate = input.targetDate ? new Date(input.targetDate) : undefined;
    const currentAmount = input.currentAmount || 0;
    const isCompleted = currentAmount >= input.targetAmount;

    const goal = await SavingsGoal.create({
      user: userObjectId,
      name: input.name.trim(),
      targetAmount: input.targetAmount,
      currentAmount,
      targetDate,
      category: input.category?.trim() || "General Savings",
      description: input.description?.trim(),
      status: isCompleted ? "COMPLETED" : "ACTIVE",
      contributions:
        currentAmount > 0
          ? [
              {
                amount: currentAmount,
                date: new Date(),
                note: "Initial contribution",
              },
            ]
          : [],
    });

    return this.enrichGoal(goal);
  }

  /**
   * Get all goals with summary metrics
   */
  public static async getGoals(
    userId: string,
    query: GetGoalsQueryInput = {}
  ): Promise<GoalsListResponse> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const match: Record<string, unknown> = { user: userObjectId };

    if (query.status) match.status = query.status;

    const goals = await SavingsGoal.find(match)
      .populate("contributions.account", "name type currency")
      .sort({ createdAt: -1 });

    const allGoals = await SavingsGoal.find({ user: userObjectId });
    const totalTargetAmount = allGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentAmount = allGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallPercentage =
      totalTargetAmount > 0
        ? Math.min(100, Math.round((totalCurrentAmount / totalTargetAmount) * 100 * 10) / 10)
        : 0;

    const activeCount = allGoals.filter((g) => g.status === "ACTIVE").length;
    const completedCount = allGoals.filter((g) => g.status === "COMPLETED").length;
    const pausedCount = allGoals.filter((g) => g.status === "PAUSED").length;

    return {
      goals: goals.map((g) => this.enrichGoal(g)),
      summary: {
        totalTargetAmount,
        totalCurrentAmount,
        overallPercentage,
        activeCount,
        completedCount,
        pausedCount,
      },
    };
  }

  /**
   * Get single goal by ID
   */
  public static async getGoalById(
    userId: string,
    id: string
  ): Promise<ISavingsGoal & { percentage: number; remainingAmount: number }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    const goal = await SavingsGoal.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    }).populate("contributions.account", "name type currency");

    if (!goal) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    return this.enrichGoal(goal);
  }

  /**
   * Update savings goal details
   */
  public static async updateGoal(
    userId: string,
    id: string,
    input: UpdateGoalInput
  ): Promise<ISavingsGoal & { percentage: number; remainingAmount: number }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    const goal = await SavingsGoal.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!goal) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    if (input.name) goal.name = input.name.trim();
    if (input.targetAmount !== undefined) goal.targetAmount = input.targetAmount;
    if (input.currentAmount !== undefined) goal.currentAmount = input.currentAmount;
    if (input.targetDate !== undefined) {
      goal.targetDate = input.targetDate ? new Date(input.targetDate) : undefined;
    }
    if (input.category !== undefined) goal.category = input.category.trim();
    if (input.description !== undefined) goal.description = input.description.trim();
    if (input.status) goal.status = input.status;

    // Check completion condition
    if (goal.currentAmount >= goal.targetAmount && goal.status === "ACTIVE") {
      goal.status = "COMPLETED";
    }

    await goal.save();
    return this.enrichGoal(goal);
  }

  /**
   * Add contribution to a savings goal with account balance check and milestone deduplication
   */
  public static async addContribution(
    userId: string,
    id: string,
    input: AddContributionInput
  ): Promise<ISavingsGoal & { percentage: number; remainingAmount: number }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const goal = await SavingsGoal.findOne({
      _id: new mongoose.Types.ObjectId(id),
      user: userObjectId,
    });

    if (!goal) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    if (goal.status === "COMPLETED") {
      throw new BadRequestError("This savings goal is already completed.");
    }
    if (goal.status === "CANCELLED") {
      throw new BadRequestError("Cannot contribute to a cancelled savings goal.");
    }

    let accountObjectId: mongoose.Types.ObjectId | undefined;
    if (input.account) {
      if (!mongoose.Types.ObjectId.isValid(input.account)) {
        throw new BadRequestError("Invalid account ID format.");
      }
      accountObjectId = new mongoose.Types.ObjectId(input.account);
      const account = await Account.findOne({
        _id: accountObjectId,
        user: userObjectId,
      });

      if (!account) {
        throw new NotFoundError("Associated account not found or access denied.");
      }

      // Check sufficient balance in the account
      const availableBalance = await AccountService.calculateAccountBalance(userId, account);
      if (availableBalance < input.amount) {
        throw new BadRequestError(
          `Insufficient balance in account "${account.name}". Available balance: ₹${availableBalance.toLocaleString("en-IN")}.`
        );
      }
    }

    const contributionDate = input.date ? new Date(input.date) : new Date();

    if (!goal.contributions) goal.contributions = [];
    goal.contributions.push({
      amount: input.amount,
      date: contributionDate,
      account: accountObjectId,
      note: input.note?.trim(),
    });

    const previousAmount = goal.currentAmount;
    goal.currentAmount += input.amount;

    const previousPercentage = (previousAmount / goal.targetAmount) * 100;
    const newPercentage = (goal.currentAmount / goal.targetAmount) * 100;

    // Check if goal reached 100%
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = "COMPLETED";

      // Milestone deduplication: check if completion notification was already issued
      const existingCompletionNotif = await Notification.findOne({
        user: goal.user,
        type: "GOAL_MILESTONE",
        "metadata.goalId": goal._id.toString(),
        "metadata.milestone": 100,
      });

      if (!existingCompletionNotif) {
        await Notification.create({
          user: goal.user,
          type: "GOAL_MILESTONE",
          title: "🎯 Savings Goal Achieved!",
          message: `Congratulations! You successfully reached your target of ₹${goal.targetAmount.toLocaleString("en-IN")} for "${goal.name}".`,
          severity: "SUCCESS",
          read: false,
          metadata: {
            goalId: goal._id.toString(),
            milestone: 100,
            targetAmount: goal.targetAmount,
            currentAmount: goal.currentAmount,
          },
        });
      }
    } else if (previousPercentage < 50 && newPercentage >= 50) {
      // 50% Milestone deduplication
      const existing50Notif = await Notification.findOne({
        user: goal.user,
        type: "GOAL_MILESTONE",
        "metadata.goalId": goal._id.toString(),
        "metadata.milestone": 50,
      });

      if (!existing50Notif) {
        await Notification.create({
          user: goal.user,
          type: "GOAL_MILESTONE",
          title: "🌟 Halfway There!",
          message: `You've reached 50% of your savings goal "${goal.name}" (₹${goal.currentAmount.toLocaleString("en-IN")} / ₹${goal.targetAmount.toLocaleString("en-IN")}).`,
          severity: "SUCCESS",
          read: false,
          metadata: {
            goalId: goal._id.toString(),
            milestone: 50,
          },
        });
      }
    }

    await goal.save();

    const populated = await SavingsGoal.findById(goal._id).populate(
      "contributions.account",
      "name type currency"
    );
    return this.enrichGoal(populated!);
  }

  /**
   * Update goal status (pause, resume, complete)
   */
  public static async updateStatus(
    userId: string,
    id: string,
    status: SavingsGoalStatus
  ): Promise<ISavingsGoal & { percentage: number; remainingAmount: number }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), user: new mongoose.Types.ObjectId(userId) },
      { status },
      { new: true }
    );

    if (!goal) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    return this.enrichGoal(goal);
  }

  /**
   * Delete savings goal
   */
  public static async deleteGoal(
    userId: string,
    id: string
  ): Promise<{ message: string }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    const goal = await SavingsGoal.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!goal) {
      throw new NotFoundError("Savings goal not found or access denied.");
    }

    return { message: "Savings goal deleted successfully." };
  }
}
