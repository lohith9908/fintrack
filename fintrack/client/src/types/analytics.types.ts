export type AnalyticsPeriod =
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "3m"
  | "6m"
  | "12m"
  | "year_to_date"
  | "all"
  | "custom";

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

export interface AnalyticsPaymentMethodItem {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface AnalyticsAccountItem {
  accountId: string;
  name: string;
  type: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface AnalyticsVelocityStats {
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

export interface FinancialInsightItem {
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

export interface AnalyticsOverviewResponse {
  summary: AnalyticsSummary;
  monthlyTrends: AnalyticsMonthlyTrendItem[];
  categoryBreakdown: AnalyticsCategoryItem[];
  paymentMethods: AnalyticsPaymentMethodItem[];
  accountBreakdown: AnalyticsAccountItem[];
  velocityStats: AnalyticsVelocityStats;
  insights: FinancialInsightItem[];
}

export interface AnalyticsFilterParams {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  type?: "INCOME" | "EXPENSE";
  paymentMethod?: string;
}
