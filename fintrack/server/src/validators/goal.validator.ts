import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const savingsGoalStatusEnum = z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]);

export const createGoalSchema = z.object({
  name: z
    .string({ required_error: "Goal name is required" })
    .trim()
    .min(1, "Goal name cannot be empty")
    .max(100, "Goal name cannot exceed 100 characters"),
  targetAmount: z
    .number({ required_error: "Target amount is required" })
    .positive("Target amount must be greater than zero"),
  currentAmount: z
    .number()
    .min(0, "Current amount cannot be negative")
    .default(0)
    .optional(),
  targetDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid target date format"),
  category: z.string().trim().max(50, "Category cannot exceed 50 characters").optional(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),
});

export const updateGoalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Goal name cannot be empty")
    .max(100, "Goal name cannot exceed 100 characters")
    .optional(),
  targetAmount: z.number().positive("Target amount must be greater than zero").optional(),
  currentAmount: z.number().min(0, "Current amount cannot be negative").optional(),
  targetDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid target date format"),
  category: z.string().trim().max(50, "Category cannot exceed 50 characters").optional(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),
  status: savingsGoalStatusEnum.optional(),
});

export const addContributionSchema = z.object({
  amount: z
    .number({ required_error: "Contribution amount is required" })
    .positive("Contribution amount must be greater than zero"),
  date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
  account: z.string().regex(objectIdRegex, "Invalid account ID format").optional(),
  note: z.string().trim().max(250, "Note cannot exceed 250 characters").optional(),
});

export const getGoalsQuerySchema = z.object({
  status: savingsGoalStatusEnum.optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type AddContributionInput = z.infer<typeof addContributionSchema>;
export type GetGoalsQueryInput = z.infer<typeof getGoalsQuerySchema>;
