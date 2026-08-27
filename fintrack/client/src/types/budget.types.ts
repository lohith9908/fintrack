export type BudgetStatus = "HEALTHY" | "WARNING" | "CRITICAL" | "EXCEEDED";

export interface BudgetAlertThresholds {
  informational: number;
  warning: number;
  critical: number;
  exceeded: number;
}

export interface BudgetCategory {
  _id: string;
  name: string;
  type: string;
  color: string;
  icon?: string;
}

export interface IBudget {
  _id: string;
  user: string;
  category: BudgetCategory;
  month: number;
  year: number;
  limitAmount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  alertThresholds: BudgetAlertThresholds;
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
  budgets: IBudget[];
  summary: BudgetSummary;
}

export interface CreateBudgetPayload {
  category: string;
  month: number;
  year: number;
  limitAmount: number;
  alertThresholds?: Partial<BudgetAlertThresholds>;
  notes?: string;
}

export interface UpdateBudgetPayload {
  limitAmount?: number;
  alertThresholds?: Partial<BudgetAlertThresholds>;
  notes?: string;
}

export interface BudgetQueryParams {
  month?: number;
  year?: number;
}
