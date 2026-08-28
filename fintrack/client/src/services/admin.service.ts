import { api } from "./api";
import {
  AdminPlatformOverview,
  AdminUserItem,
  AdminUserDetails,
  AdminCategoryItem,
  AdminAuditLogItem,
  AdminAuditFilterOptions,
  AdminSystemSettingsResponse,
  AdminUserFilterParams,
  AdminAuditFilterParams,
} from "../types/admin.types";

export class AdminService {
  /**
   * GET /api/admin/overview
   */
  public static async getOverview(): Promise<AdminPlatformOverview> {
    const res = await api.get<{ success: boolean; message: string; data: AdminPlatformOverview }>(
      "/admin/overview"
    );
    return res.data.data;
  }

  /**
   * GET /api/admin/users
   */
  public static async getUsers(params: AdminUserFilterParams = {}) {
    const res = await api.get<{
      success: boolean;
      message: string;
      data: {
        users: AdminUserItem[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    }>("/admin/users", { params });
    return res.data.data;
  }

  /**
   * GET /api/admin/users/:id
   */
  public static async getUserById(userId: string): Promise<AdminUserDetails> {
    const res = await api.get<{ success: boolean; message: string; data: AdminUserDetails }>(
      `/admin/users/${userId}`
    );
    return res.data.data;
  }

  /**
   * PATCH /api/admin/users/:id/status
   */
  public static async updateUserStatus(
    userId: string,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
    reason?: string
  ) {
    const res = await api.patch<{ success: boolean; message: string; data: Partial<AdminUserItem> }>(
      `/admin/users/${userId}/status`,
      { status, reason }
    );
    return res.data.data;
  }

  /**
   * PATCH /api/admin/users/:id/role
   */
  public static async updateUserRole(userId: string, role: "USER" | "ADMIN", reason?: string) {
    const res = await api.patch<{ success: boolean; message: string; data: Partial<AdminUserItem> }>(
      `/admin/users/${userId}/role`,
      { role, reason }
    );
    return res.data.data;
  }

  /**
   * GET /api/admin/categories
   */
  public static async getSystemCategories(): Promise<AdminCategoryItem[]> {
    const res = await api.get<{
      success: boolean;
      message: string;
      data: { categories: AdminCategoryItem[] };
    }>("/admin/categories");
    return res.data.data.categories;
  }

  /**
   * POST /api/admin/categories
   */
  public static async createSystemCategory(data: {
    name: string;
    type: "INCOME" | "EXPENSE";
    icon?: string;
    color?: string;
  }): Promise<AdminCategoryItem> {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: { category: AdminCategoryItem };
    }>("/admin/categories", data);
    return res.data.data.category;
  }

  /**
   * PATCH /api/admin/categories/:id
   */
  public static async updateSystemCategory(
    categoryId: string,
    data: { name?: string; icon?: string; color?: string; isActive?: boolean }
  ): Promise<AdminCategoryItem> {
    const res = await api.patch<{
      success: boolean;
      message: string;
      data: { category: AdminCategoryItem };
    }>(`/admin/categories/${categoryId}`, data);
    return res.data.data.category;
  }

  /**
   * DELETE /api/admin/categories/:id
   */
  public static async deleteOrDisableCategory(categoryId: string) {
    const res = await api.delete<{
      success: boolean;
      message: string;
      data: { action: "DELETED" | "DISABLED"; message: string; category?: Partial<AdminCategoryItem> };
    }>(`/admin/categories/${categoryId}`);
    return res.data.data;
  }

  /**
   * GET /api/admin/audit-logs
   */
  public static async getAuditLogs(params: AdminAuditFilterParams = {}) {
    const res = await api.get<{
      success: boolean;
      message: string;
      data: {
        logs: AdminAuditLogItem[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      };
    }>("/admin/audit-logs", { params });
    return res.data.data;
  }

  /**
   * GET /api/admin/audit-logs/filters
   */
  public static async getAuditFilterOptions(): Promise<AdminAuditFilterOptions> {
    const res = await api.get<{
      success: boolean;
      message: string;
      data: AdminAuditFilterOptions;
    }>("/admin/audit-logs/filters");
    return res.data.data;
  }

  /**
   * GET /api/admin/settings
   */
  public static async getSystemSettings(): Promise<AdminSystemSettingsResponse> {
    const res = await api.get<{
      success: boolean;
      message: string;
      data: AdminSystemSettingsResponse;
    }>("/admin/settings");
    return res.data.data;
  }

  /**
   * PATCH /api/admin/settings/:key
   */
  public static async updateSystemSetting(key: string, value: unknown, description?: string) {
    const res = await api.patch<{
      success: boolean;
      message: string;
      data: { key: string; value: unknown; description?: string };
    }>(`/admin/settings/${key}`, { value, description });
    return res.data.data;
  }

  /**
   * PUT /api/admin/settings
   */
  public static async updateSystemSettingsBatch(settings: Record<string, unknown>) {
    const res = await api.put<{
      success: boolean;
      message: string;
      data: AdminSystemSettingsResponse;
    }>("/admin/settings", { settings });
    return res.data.data;
  }

  /**
   * POST /api/admin/settings/reset
   */
  public static async resetSystemSettings(): Promise<AdminSystemSettingsResponse> {
    const res = await api.post<{
      success: boolean;
      message: string;
      data: AdminSystemSettingsResponse;
    }>("/admin/settings/reset");
    return res.data.data;
  }
}
