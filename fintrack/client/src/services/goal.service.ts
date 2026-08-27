import { api } from "./api";
import {
  ISavingsGoal,
  GoalsListResponse,
  CreateGoalPayload,
  UpdateGoalPayload,
  AddContributionPayload,
  SavingsGoalStatus,
} from "../types/goal.types";

export class GoalService {
  public static async getGoals(params?: {
    status?: SavingsGoalStatus;
  }): Promise<GoalsListResponse> {
    const res = await api.get<{
      success: boolean;
      data: GoalsListResponse;
    }>("/goals", { params });
    return res.data.data;
  }

  public static async createGoal(payload: CreateGoalPayload): Promise<ISavingsGoal> {
    const res = await api.post<{
      success: boolean;
      data: ISavingsGoal;
    }>("/goals", payload);
    return res.data.data;
  }

  public static async getGoalById(id: string): Promise<ISavingsGoal> {
    const res = await api.get<{
      success: boolean;
      data: ISavingsGoal;
    }>(`/goals/${id}`);
    return res.data.data;
  }

  public static async updateGoal(id: string, payload: UpdateGoalPayload): Promise<ISavingsGoal> {
    const res = await api.patch<{
      success: boolean;
      data: ISavingsGoal;
    }>(`/goals/${id}`, payload);
    return res.data.data;
  }

  public static async addContribution(
    id: string,
    payload: AddContributionPayload
  ): Promise<ISavingsGoal> {
    const res = await api.post<{
      success: boolean;
      data: ISavingsGoal;
    }>(`/goals/${id}/contribute`, payload);
    return res.data.data;
  }

  public static async pauseGoal(id: string): Promise<ISavingsGoal> {
    const res = await api.post<{
      success: boolean;
      data: ISavingsGoal;
    }>(`/goals/${id}/pause`);
    return res.data.data;
  }

  public static async resumeGoal(id: string): Promise<ISavingsGoal> {
    const res = await api.post<{
      success: boolean;
      data: ISavingsGoal;
    }>(`/goals/${id}/resume`);
    return res.data.data;
  }

  public static async completeGoal(id: string): Promise<ISavingsGoal> {
    const res = await api.post<{
      success: boolean;
      data: ISavingsGoal;
    }>(`/goals/${id}/complete`);
    return res.data.data;
  }

  public static async deleteGoal(id: string): Promise<void> {
    await api.delete(`/goals/${id}`);
  }
}
