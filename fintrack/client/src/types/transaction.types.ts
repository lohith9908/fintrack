import { ICategory } from "./category.types";
import { IAccount } from "./account.types";

export type TransactionType = "INCOME" | "EXPENSE";

export type PaymentMethod =
  | "CASH"
  | "UPI"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "OTHER";

export interface ITransaction {
  _id: string;
  user: string;
  amount: number;
  type: TransactionType;
  category: ICategory;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  account: IAccount;
  notes?: string;
  receipt?: {
    fileId?: string;
    url?: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface CreateTransactionPayload {
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  account: string;
  notes?: string;
}

export interface UpdateTransactionPayload {
  amount?: number;
  type?: TransactionType;
  category?: string;
  description?: string;
  date?: string;
  paymentMethod?: PaymentMethod;
  account?: string;
  notes?: string;
}
