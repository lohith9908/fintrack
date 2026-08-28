export interface MonthlyReportCategoryItem {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyReportPaymentMethodItem {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyReportAccountItem {
  accountId: string;
  name: string;
  type: string;
  amount: number;
  percentage: number;
}

export interface MonthlyReportTransactionItem {
  id: string;
  date: string;
  description: string;
  category: string;
  account: string;
  amount: number;
  type: string;
  paymentMethod: string;
}

export interface MonthlyReportData {
  title: string;
  month: number;
  year: number;
  monthLabel: string;
  currency: string;
  generatedAt: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
    avgDailyExpense: number;
  };
  categories: MonthlyReportCategoryItem[];
  paymentMethods: MonthlyReportPaymentMethodItem[];
  accounts: MonthlyReportAccountItem[];
  topTransactions: MonthlyReportTransactionItem[];
}

export interface ReportFilterParams {
  month?: number;
  year?: number;
}

export interface ExportTransactionsFilterParams {
  startDate?: string;
  endDate?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  accountId?: string;
  categoryId?: string;
  format?: "csv" | "json";
}

export interface UserDataExport {
  exportMetadata: {
    version: string;
    exportedAt: string;
    userId: string;
    entityCounts: Record<string, number>;
  };
  user: Record<string, unknown>;
  accounts: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  budgets: Array<Record<string, unknown>>;
  recurringTransactions: Array<Record<string, unknown>>;
  savingsGoals: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
}
