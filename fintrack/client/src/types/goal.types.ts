import { IAccount } from "./account.types";

export type SavingsGoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";

export interface IGoalContribution {
  _id?: string;
  amount: number;
  date: string;
  account?: IAccount | string;
  note?: string;
}

export interface ISavingsGoal {
  _id: string;
  user: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  category?: string;
  description?: string;
  status: SavingsGoalStatus;
  percentage: number;
  remainingAmount: number;
  contributions?: IGoalContribution[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalSummary {
  totalTargetAmount: number;
  totalCurrentAmount: number;
  overallPercentage: number;
  activeCount: number;
  completedCount: number;
  pausedCount: number;
}

export interface GoalsListResponse {
  goals: ISavingsGoal[];
  summary: GoalSummary;
}

export interface CreateGoalPayload {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  category?: string;
  description?: string;
}

export interface UpdateGoalPayload {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  category?: string;
  description?: string;
  status?: SavingsGoalStatus;
}

export interface AddContributionPayload {
  amount: number;
  date?: string;
  account?: string;
  note?: string;
}
