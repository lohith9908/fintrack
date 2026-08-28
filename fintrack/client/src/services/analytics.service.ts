import { api } from "./api";
import {
  AnalyticsOverviewResponse,
  AnalyticsSummary,
  AnalyticsMonthlyTrendItem,
  AnalyticsCategoryItem,
  AnalyticsPaymentMethodItem,
  AnalyticsAccountItem,
  FinancialInsightItem,
  AnalyticsFilterParams,
} from "../types/analytics.types";

export const AnalyticsService = {
  /**
   * Get consolidated analytics overview payload
   */
  async getOverview(params?: AnalyticsFilterParams): Promise<AnalyticsOverviewResponse> {
    const res = await api.get<{ success: boolean; data: AnalyticsOverviewResponse }>(
      "/analytics",
      { params }
    );
    return res.data.data;
  },

  /**
   * Get financial summary metrics and period-over-period delta
   */
  async getSummary(params?: AnalyticsFilterParams): Promise<AnalyticsSummary> {
    const res = await api.get<{ success: boolean; data: AnalyticsSummary }>("/analytics/summary", {
      params,
    });
    return res.data.data;
  },

  /**
   * Get historical monthly trends
   */
  async getTrends(params?: AnalyticsFilterParams): Promise<AnalyticsMonthlyTrendItem[]> {
    const res = await api.get<{ success: boolean; data: AnalyticsMonthlyTrendItem[] }>(
      "/analytics/trends",
      { params }
    );
    return res.data.data;
  },

  /**
   * Get spending by category breakdown
   */
  async getCategories(params?: AnalyticsFilterParams): Promise<AnalyticsCategoryItem[]> {
    const res = await api.get<{ success: boolean; data: AnalyticsCategoryItem[] }>(
      "/analytics/categories",
      { params }
    );
    return res.data.data;
  },

  /**
   * Get payment methods spending distribution
   */
  async getPaymentMethods(params?: AnalyticsFilterParams): Promise<AnalyticsPaymentMethodItem[]> {
    const res = await api.get<{ success: boolean; data: AnalyticsPaymentMethodItem[] }>(
      "/analytics/payment-methods",
      { params }
    );
    return res.data.data;
  },

  /**
   * Get account spending distribution
   */
  async getAccounts(params?: AnalyticsFilterParams): Promise<AnalyticsAccountItem[]> {
    const res = await api.get<{ success: boolean; data: AnalyticsAccountItem[] }>(
      "/analytics/accounts",
      { params }
    );
    return res.data.data;
  },

  /**
   * Get deterministic financial insights
   */
  async getInsights(params?: AnalyticsFilterParams): Promise<FinancialInsightItem[]> {
    const res = await api.get<{ success: boolean; data: FinancialInsightItem[] }>(
      "/analytics/insights",
      { params }
    );
    return res.data.data;
  },
};
