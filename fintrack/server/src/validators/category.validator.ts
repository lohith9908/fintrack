import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required" })
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),
  type: z.enum(["INCOME", "EXPENSE"], {
    required_error: "Category type must be INCOME or EXPENSE",
  }),
  icon: z.string().trim().optional().default("Tag"),
  color: z.string().trim().optional().default("#3B82F6"),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters")
    .optional(),
  icon: z.string().trim().optional(),
  color: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
