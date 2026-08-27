import { api } from "./api";
import {
  ITransaction,
  TransactionSummary,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  TransactionType,
} from "../types/transaction.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class TransactionService {
  /**
   * Get all transactions for the user with calculated financial summary
   */
  public static async getTransactions(params?: {
    type?: TransactionType;
    account?: string;
    category?: string;
  }): Promise<{ transactions: ITransaction[]; summary: TransactionSummary }> {
    const res = await api.get<
      ApiResponse<{ transactions: ITransaction[]; summary: TransactionSummary }>
    >("/transactions", { params });
    return res.data.data;
  }

  /**
   * Create a new transaction
   */
  public static async createTransaction(
    payload: CreateTransactionPayload
  ): Promise<ITransaction> {
    const res = await api.post<ApiResponse<{ transaction: ITransaction }>>(
      "/transactions",
      payload
    );
    return res.data.data.transaction;
  }

  /**
   * Get single transaction details
   */
  public static async getTransactionById(id: string): Promise<ITransaction> {
    const res = await api.get<ApiResponse<{ transaction: ITransaction }>>(
      `/transactions/${id}`
    );
    return res.data.data.transaction;
  }

  /**
   * Update an existing transaction
   */
  public static async updateTransaction(
    id: string,
    payload: UpdateTransactionPayload
  ): Promise<ITransaction> {
    const res = await api.patch<ApiResponse<{ transaction: ITransaction }>>(
      `/transactions/${id}`,
      payload
    );
    return res.data.data.transaction;
  }

  /**
   * Delete a transaction
   */
  public static async deleteTransaction(id: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<null>>(`/transactions/${id}`);
    return { message: res.data.message };
  }
}
