import { z } from "zod";

export const calendarQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  type: z
    .enum(["ALL", "RECURRING_PAYMENT", "GOAL_DEADLINE", "BUDGET_PERIOD", "TRANSACTION"])
    .optional()
    .default("ALL"),
});

export type CalendarQueryParams = z.infer<typeof calendarQuerySchema>;
