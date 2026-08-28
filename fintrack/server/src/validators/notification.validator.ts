import { z } from "zod";

export const getNotificationsQuerySchema = z.object({
  read: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  type: z
    .enum([
      "BUDGET_ALERT",
      "BUDGET_EXCEEDED",
      "RECURRING_PAYMENT",
      "GOAL_MILESTONE",
      "FINANCIAL_INSIGHT",
      "SYSTEM",
    ])
    .optional(),
  severity: z.enum(["INFO", "SUCCESS", "WARNING", "CRITICAL"]).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10) || 20)) : 20)),
});

export type GetNotificationsQueryInput = z.infer<typeof getNotificationsQuerySchema>;

export const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
});

export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;

export const createNotificationSchema = z.object({
  type: z.enum([
    "BUDGET_ALERT",
    "BUDGET_EXCEEDED",
    "RECURRING_PAYMENT",
    "GOAL_MILESTONE",
    "FINANCIAL_INSIGHT",
    "SYSTEM",
  ]),
  title: z.string().min(1, "Title is required").max(150, "Title is too long"),
  message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
  severity: z.enum(["INFO", "SUCCESS", "WARNING", "CRITICAL"]).default("INFO"),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
