import { z } from "zod";

export const adminUserQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "name", "email", "status", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const adminUpdateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"], {
    required_error: "Status is required",
  }),
  reason: z.string().trim().max(500).optional(),
});

export const adminUpdateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"], {
    required_error: "Role is required",
  }),
  reason: z.string().trim().max(500).optional(),
});

export const adminCreateCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  type: z.enum(["INCOME", "EXPENSE"], {
    required_error: "Type is required",
  }),
  icon: z.string().trim().optional().default("tag"),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code").optional().default("#6366F1"),
});

export const adminUpdateCategorySchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  icon: z.string().trim().optional(),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().optional(),
});

export const adminAuditLogQuerySchema = z.object({
  actor: z.string().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(30),
});

export const adminUpdateSettingSchema = z.object({
  value: z.any(),
  description: z.string().trim().max(500).optional(),
});

export const adminUpdateSettingsBatchSchema = z.object({
  settings: z.record(z.string(), z.any()),
});

export type AdminUserQueryParams = z.infer<typeof adminUserQuerySchema>;
export type AdminUpdateUserStatusInput = z.infer<typeof adminUpdateUserStatusSchema>;
export type AdminUpdateUserRoleInput = z.infer<typeof adminUpdateUserRoleSchema>;
export type AdminCreateCategoryInput = z.infer<typeof adminCreateCategorySchema>;
export type AdminUpdateCategoryInput = z.infer<typeof adminUpdateCategorySchema>;
export type AdminAuditLogQueryParams = z.infer<typeof adminAuditLogQuerySchema>;
export type AdminUpdateSettingInput = z.infer<typeof adminUpdateSettingSchema>;
export type AdminUpdateSettingsBatchInput = z.infer<typeof adminUpdateSettingsBatchSchema>;
