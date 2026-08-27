import { z } from "zod";

export const createAccountSchema = z.object({
  name: z
    .string({ required_error: "Account name is required" })
    .trim()
    .min(2, "Account name must be at least 2 characters")
    .max(60, "Account name cannot exceed 60 characters"),
  type: z.enum(["CASH", "BANK_ACCOUNT", "CREDIT_CARD", "UPI", "OTHER"], {
    required_error: "Account type is required",
  }),
  openingBalance: z
    .number({ invalid_type_error: "Opening balance must be a number" })
    .default(0),
  currency: z
    .string()
    .trim()
    .min(3, "Currency must be 3 characters")
    .max(3, "Currency must be 3 characters")
    .toUpperCase()
    .default("INR"),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const updateAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Account name must be at least 2 characters")
    .max(60, "Account name cannot exceed 60 characters")
    .optional(),
  type: z.enum(["CASH", "BANK_ACCOUNT", "CREDIT_CARD", "UPI", "OTHER"]).optional(),
  currency: z.string().trim().min(3).max(3).toUpperCase().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
