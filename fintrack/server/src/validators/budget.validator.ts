import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const alertThresholdsSchema = z.object({
  informational: z.number().min(1).max(100).default(50).optional(),
  warning: z.number().min(1).max(100).default(75).optional(),
  critical: z.number().min(1).max(100).default(90).optional(),
  exceeded: z.number().min(1).max(200).default(100).optional(),
});

export const createBudgetSchema = z.object({
  category: z
    .string({ required_error: "Category is required" })
    .regex(objectIdRegex, "Invalid category ID format"),
  month: z
    .number({ required_error: "Budget month is required" })
    .int("Month must be an integer")
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z
    .number({ required_error: "Budget year is required" })
    .int("Year must be an integer")
    .min(2000, "Year must be at least 2000")
    .max(2100, "Year must be below 2100"),
  limitAmount: z
    .number({ required_error: "Budget limit amount is required" })
    .positive("Budget limit must be greater than zero"),
  alertThresholds: alertThresholdsSchema.optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const updateBudgetSchema = z.object({
  limitAmount: z
    .number()
    .positive("Budget limit must be greater than zero")
    .optional(),
  alertThresholds: alertThresholdsSchema.optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const getBudgetsQuerySchema = z.object({
  month: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type GetBudgetsQueryInput = z.infer<typeof getBudgetsQuerySchema>;
