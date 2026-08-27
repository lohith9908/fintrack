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

export interface DashboardOverviewData {
  summary: DashboardSummary;
  categoryBreakdown: CategoryBreakdownItem[];
  monthlyTrends: MonthlyTrendItem[];
  paymentMethods: PaymentMethodBreakdownItem[];
  accounts: AccountDashboardItem[];
  recentTransactions: Array<{
    _id: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    category: {
      name: string;
      color?: string;
      icon?: string;
    };
    description: string;
    date: string;
    paymentMethod: string;
    account: {
      name: string;
      currency?: string;
    };
  }>;
  budgetStatus: BudgetStatusItem[];
  goalsProgress: GoalStatusItem[];
  upcomingRecurring: RecurringPaymentItem[];
  unreadNotificationsCount: number;
  insights: FinancialInsight[];
}

export interface DashboardQueryParams {
  period?: "30d" | "current_month" | "6m" | "12m" | "all";
  startDate?: string;
  endDate?: string;
}
