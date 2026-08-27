import { api } from "./api";
import {
  ITransaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  TransactionFilterParams,
  PaginatedTransactionsResponse,
} from "../types/transaction.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class TransactionService {
  /**
   * Get all transactions with search, filters, and pagination
   */
  public static async getTransactions(
    params?: TransactionFilterParams
  ): Promise<PaginatedTransactionsResponse> {
    const res = await api.get<ApiResponse<PaginatedTransactionsResponse>>(
      "/transactions",
      { params }
    );
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

  /**
   * Upload receipt attachment for a transaction
   */
  public static async uploadReceipt(
    transactionId: string,
    file: File
  ): Promise<ITransaction> {
    const formData = new FormData();
    formData.append("receipt", file);

    const res = await api.post<ApiResponse<{ transaction: ITransaction }>>(
      `/transactions/${transactionId}/receipt`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data.data.transaction;
  }

  /**
   * Download / View authenticated receipt blob
   */
  public static async getReceiptBlob(
    transactionId: string
  ): Promise<{ blob: Blob; url: string }> {
    const res = await api.get(`/transactions/${transactionId}/receipt`, {
      responseType: "blob",
    });
    const contentType = typeof res.headers["content-type"] === "string" ? res.headers["content-type"] : "application/octet-stream";
    const blob = new Blob([res.data], {
      type: contentType,
    });
    const url = URL.createObjectURL(blob);
    return { blob, url };
  }

  /**
   * Delete receipt attachment from transaction
   */
  public static async deleteReceipt(
    transactionId: string
  ): Promise<ITransaction> {
    const res = await api.delete<ApiResponse<{ transaction: ITransaction }>>(
      `/transactions/${transactionId}/receipt`
    );
    return res.data.data.transaction;
  }
}
