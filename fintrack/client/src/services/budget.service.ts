import { api } from "./api";
import {
  IBudget,
  BudgetsListResponse,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  BudgetQueryParams,
} from "../types/budget.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class BudgetService {
  /**
   * Fetch budgets and summary for a specific month and year
   */
  public static async getBudgets(
    params: BudgetQueryParams = {}
  ): Promise<BudgetsListResponse> {
    const res = await api.get<ApiResponse<BudgetsListResponse>>("/budgets", {
      params,
    });
    return res.data.data;
  }

  /**
   * Create a new category budget
   */
  public static async createBudget(
    payload: CreateBudgetPayload
  ): Promise<IBudget> {
    const res = await api.post<ApiResponse<IBudget>>("/budgets", payload);
    return res.data.data;
  }

  /**
   * Get single budget by ID
   */
  public static async getBudgetById(id: string): Promise<IBudget> {
    const res = await api.get<ApiResponse<IBudget>>(`/budgets/${id}`);
    return res.data.data;
  }

  /**
   * Update budget limit, thresholds, or notes
   */
  public static async updateBudget(
    id: string,
    payload: UpdateBudgetPayload
  ): Promise<IBudget> {
    const res = await api.patch<ApiResponse<IBudget>>(`/budgets/${id}`, payload);
    return res.data.data;
  }

  /**
   * Delete a budget
   */
  public static async deleteBudget(id: string): Promise<string> {
    const res = await api.delete<ApiResponse<null>>(`/budgets/${id}`);
    return res.data.message;
  }
}
