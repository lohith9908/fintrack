import { ICategory } from "./category.types";
import { IAccount } from "./account.types";
import { PaymentMethod, TransactionType } from "./transaction.types";

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface IRecurringTransaction {
  _id: string;
  user: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: ICategory;
  account: IAccount;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  startDate: string;
  nextOccurrence: string;
  endDate?: string;
  isActive: boolean;
  lastProcessedOccurrence?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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
    nextOccurrence: string;
  };
}

export interface RecurringListResponse {
  recurringTransactions: IRecurringTransaction[];
  summary: RecurringSummary;
}

export interface CreateRecurringPayload {
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  account: string;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateRecurringPayload {
  name?: string;
  amount?: number;
  type?: TransactionType;
  category?: string;
  account?: string;
  paymentMethod?: PaymentMethod;
  frequency?: RecurringFrequency;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  notes?: string;
}
