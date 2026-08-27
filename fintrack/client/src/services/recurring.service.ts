import { api } from "./api";
import {
  IRecurringTransaction,
  RecurringListResponse,
  CreateRecurringPayload,
  UpdateRecurringPayload,
} from "../types/recurring.types";

export class RecurringService {
  public static async getRecurringRules(params?: {
    type?: string;
    isActive?: boolean;
    frequency?: string;
  }): Promise<RecurringListResponse> {
    const res = await api.get<{
      success: boolean;
      data: RecurringListResponse;
    }>("/recurring-transactions", { params });
    return res.data.data;
  }

  public static async createRecurringRule(
    payload: CreateRecurringPayload
  ): Promise<IRecurringTransaction> {
    const res = await api.post<{
      success: boolean;
      data: IRecurringTransaction;
    }>("/recurring-transactions", payload);
    return res.data.data;
  }

  public static async getRecurringRuleById(id: string): Promise<IRecurringTransaction> {
    const res = await api.get<{
      success: boolean;
      data: IRecurringTransaction;
    }>(`/recurring-transactions/${id}`);
    return res.data.data;
  }

  public static async updateRecurringRule(
    id: string,
    payload: UpdateRecurringPayload
  ): Promise<IRecurringTransaction> {
    const res = await api.patch<{
      success: boolean;
      data: IRecurringTransaction;
    }>(`/recurring-transactions/${id}`, payload);
    return res.data.data;
  }

  public static async pauseRecurringRule(id: string): Promise<IRecurringTransaction> {
    const res = await api.post<{
      success: boolean;
      data: IRecurringTransaction;
    }>(`/recurring-transactions/${id}/pause`);
    return res.data.data;
  }

  public static async resumeRecurringRule(id: string): Promise<IRecurringTransaction> {
    const res = await api.post<{
      success: boolean;
      data: IRecurringTransaction;
    }>(`/recurring-transactions/${id}/resume`);
    return res.data.data;
  }

  public static async deleteRecurringRule(id: string): Promise<void> {
    await api.delete(`/recurring-transactions/${id}`);
  }

  public static async processDueTransactions(): Promise<{
    processedCount: number;
  }> {
    const res = await api.post<{
      success: boolean;
      data: { processedCount: number };
    }>("/recurring-transactions/process-due");
    return res.data.data;
  }
}
