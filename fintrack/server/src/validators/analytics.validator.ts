import { z } from "zod";

export const analyticsQuerySchema = z.object({
  period: z
    .enum(["7d", "30d", "this_month", "last_month", "3m", "6m", "12m", "year_to_date", "all", "custom"])
    .optional()
    .default("30d"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  paymentMethod: z
    .enum(["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER", "OTHER"])
    .optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
