import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const recurringFrequencyEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
export const transactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);
export const paymentMethodEnum = z.enum([
  "CASH",
  "UPI",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "OTHER",
]);

export const createRecurringSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name cannot exceed 100 characters"),
  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than zero"),
  type: transactionTypeEnum,
  category: z
    .string({ required_error: "Category is required" })
    .regex(objectIdRegex, "Invalid category ID format"),
  account: z
    .string({ required_error: "Account is required" })
    .regex(objectIdRegex, "Invalid account ID format"),
  paymentMethod: paymentMethodEnum,
  frequency: recurringFrequencyEnum,
  startDate: z
    .string({ required_error: "Start date is required" })
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date format"),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid end date format"),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const updateRecurringSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  amount: z.number().positive("Amount must be greater than zero").optional(),
  type: transactionTypeEnum.optional(),
  category: z.string().regex(objectIdRegex, "Invalid category ID format").optional(),
  account: z.string().regex(objectIdRegex, "Invalid account ID format").optional(),
  paymentMethod: paymentMethodEnum.optional(),
  frequency: recurringFrequencyEnum.optional(),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid start date format"),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid end date format"),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const getRecurringQuerySchema = z.object({
  type: transactionTypeEnum.optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  frequency: recurringFrequencyEnum.optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
export type GetRecurringQueryInput = z.infer<typeof getRecurringQuerySchema>;
