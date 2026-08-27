import { z } from "zod";

export const dashboardQuerySchema = z.object({
  period: z
    .enum(["30d", "current_month", "6m", "12m", "all"])
    .default("30d")
    .optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
