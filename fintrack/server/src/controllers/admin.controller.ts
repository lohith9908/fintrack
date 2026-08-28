import { Request, Response, NextFunction } from "express";
import { AdminService } from "../services/admin.service";
import { AuditService } from "../services/audit.service";
import {
  adminUserQuerySchema,
  adminUpdateUserStatusSchema,
  adminUpdateUserRoleSchema,
  adminCreateCategorySchema,
  adminUpdateCategorySchema,
  adminAuditLogQuerySchema,
  adminUpdateSettingSchema,
  adminUpdateSettingsBatchSchema,
} from "../validators/admin.validator";
import { ApiResponse } from "../utils/apiResponse";

export class AdminController {
  /**
   * GET /api/admin/overview
   * Platform statistics and operational telemetry
   */
  public static async getOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await AdminService.getPlatformOverview();
      ApiResponse.success(res, "Platform overview retrieved successfully", overview);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/users
   * Paginated user list with search and filters
   */
  public static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = adminUserQuerySchema.parse(req.query);
      const result = await AdminService.getUsers(parsedQuery);
      ApiResponse.success(res, "Users retrieved successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/users/:id
   * Safe user details and associated entity summary
   */
  public static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getUserById(req.params.id);
      ApiResponse.success(res, "User details retrieved successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/users/:id/status
   * Activate, deactivate, or suspend a user
   */
  public static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user?.id || req.user?._id?.toString() || "";
      const validatedData = adminUpdateUserStatusSchema.parse(req.body);
      const result = await AdminService.updateUserStatus(actingAdminId, req.params.id, validatedData);
      ApiResponse.success(res, "User status updated successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/users/:id/role
   * Promote or demote user role (USER, ADMIN)
   */
  public static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user?.id || req.user?._id?.toString() || "";
      const validatedData = adminUpdateUserRoleSchema.parse(req.body);
      const result = await AdminService.updateUserRole(actingAdminId, req.params.id, validatedData);
      ApiResponse.success(res, "User role updated successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/categories
   * List all global system categories with usage count
   */
  public static async getSystemCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await AdminService.getSystemCategories();
      ApiResponse.success(res, "System categories retrieved successfully", { categories });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/categories
   * Create new system category
   */
  public static async createSystemCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user?.id || req.user?._id?.toString() || "";
      const validatedData = adminCreateCategorySchema.parse(req.body);
      const category = await AdminService.createSystemCategory(actingAdminId, validatedData);
      ApiResponse.created(res, "System category created successfully", { category });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/categories/:id
   * Update system category details
   */
  public static async updateSystemCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user?.id || req.user?._id?.toString() || "";
      const validatedData = adminUpdateCategorySchema.parse(req.body);
      const category = await AdminService.updateSystemCategory(actingAdminId, req.params.id, validatedData);
      ApiResponse.success(res, "System category updated successfully", { category });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/admin/categories/:id
   * Soft-disable (if referenced by records) or permanently delete system category
   */
  public static async deleteOrDisableCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user?.id || req.user?._id?.toString() || "";
      const result = await AdminService.deleteOrDisableCategory(actingAdminId, req.params.id);
      ApiResponse.success(res, result.message, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/audit-logs
   * List paginated audit trail logs
   */
  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = adminAuditLogQuerySchema.parse(req.query);
      const result = await AuditService.getAuditLogs(parsedQuery);
      ApiResponse.success(res, "Audit logs retrieved successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/audit-logs/filters
   * Filter dropdown options for audit logs
   */
  public static async getAuditFilterOptions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuditService.getAuditFilterOptions();
      ApiResponse.success(res, "Audit filter options retrieved successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/settings
   * Retrieve platform settings
   */
  public static async getSystemSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getSystemSettings();
      ApiResponse.success(res, "System settings retrieved successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/settings/:key
   * Update a specific system parameter
   */
  public static async updateSystemSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user?.id || req.user?._id?.toString() || "";
      const validatedData = adminUpdateSettingSchema.parse(req.body);
      const result = await AdminService.updateSystemSetting(
        actingAdminId,
        req.params.key,
        validatedData.value,
        validatedData.description
      );
      ApiResponse.success(res, `System setting ${req.params.key} updated successfully`, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/admin/settings
   * Batch update system settings
   */
  public static async updateSystemSettingsBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user?.id || req.user?._id?.toString() || "";
      const validatedData = adminUpdateSettingsBatchSchema.parse(req.body);
      const result = await AdminService.updateSystemSettingsBatch(actingAdminId, validatedData.settings);
      ApiResponse.success(res, "System settings updated successfully", result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/admin/settings/reset
   * Reset system settings to defaults
   */
  public static async resetSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actingAdminId = req.user?.id || req.user?._id?.toString() || "";
      const result = await AdminService.resetSystemSettings(actingAdminId);
      ApiResponse.success(res, "System settings reset to defaults successfully", result);
    } catch (err) {
      next(err);
    }
  }
}
