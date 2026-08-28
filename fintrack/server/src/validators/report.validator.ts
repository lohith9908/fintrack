import { z } from "zod";

export const monthlyReportQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
});

export const exportTransactionsQuerySchema = z.object({
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  accountId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid account ID").optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID").optional(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

export type MonthlyReportQueryParams = z.infer<typeof monthlyReportQuerySchema>;
export type ExportTransactionsQueryParams = z.infer<typeof exportTransactionsQuerySchema>;
