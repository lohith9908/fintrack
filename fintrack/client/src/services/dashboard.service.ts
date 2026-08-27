import { api } from "./api";
import {
  DashboardOverviewData,
  DashboardQueryParams,
} from "../types/dashboard.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class DashboardService {
  /**
   * Fetch consolidated dashboard overview payload
   */
  public static async getOverview(
    params?: DashboardQueryParams
  ): Promise<DashboardOverviewData> {
    const res = await api.get<ApiResponse<DashboardOverviewData>>(
      "/dashboard/overview",
      { params }
    );
    return res.data.data;
  }
}
