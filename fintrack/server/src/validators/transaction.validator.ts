import { z } from "zod";

export const createTransactionSchema = z.object({
  amount: z
    .number({ required_error: "Amount is required", invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .finite("Amount must be a finite number"),
  type: z.enum(["INCOME", "EXPENSE"], {
    required_error: "Transaction type must be INCOME or EXPENSE",
  }),
  category: z
    .string({ required_error: "Category is required" })
    .trim()
    .min(1, "Category ID is required"),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(1, "Description is required")
    .max(120, "Description cannot exceed 120 characters"),
  date: z
    .string({ required_error: "Transaction date is required" })
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .refine((date) => !isNaN(date.getTime()), {
      message: "Invalid transaction date format",
    }),
  paymentMethod: z.enum(
    ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "OTHER"],
    { required_error: "Payment method is required" }
  ),
  account: z
    .string({ required_error: "Account is required" })
    .trim()
    .min(1, "Account ID is required"),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const updateTransactionSchema = z.object({
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .finite("Amount must be a finite number")
    .optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  category: z.string().trim().min(1, "Category ID cannot be empty").optional(),
  description: z
    .string()
    .trim()
    .min(1, "Description cannot be empty")
    .max(120, "Description cannot exceed 120 characters")
    .optional(),
  date: z
    .string()
    .or(z.date())
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .refine((date) => !isNaN(date.getTime()), {
      message: "Invalid transaction date format",
    })
    .optional(),
  paymentMethod: z
    .enum(["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "OTHER"])
    .optional(),
  account: z.string().trim().min(1, "Account ID cannot be empty").optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
