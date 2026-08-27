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

export interface IReceiptMetadata {
  fileId?: string;
  url?: string;
  storageKey?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
}

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
  receipt?: IReceiptMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface TransactionFilterParams {
  search?: string;
  type?: TransactionType;
  category?: string;
  account?: string;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactionsResponse {
  transactions: ITransaction[];
  pagination: PaginationMeta;
  summary: TransactionSummary;
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
