import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name cannot exceed 60 characters")
    .optional(),
  phone: z.string().trim().optional(),
  currency: z.string().trim().min(3).max(3).toUpperCase().optional(),
  timezone: z.string().trim().optional(),
  dateFormat: z.string().trim().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notificationPreferences: z
    .object({
      budgetAlerts: z.boolean().optional(),
      recurringPaymentAlerts: z.boolean().optional(),
      goalAlerts: z.boolean().optional(),
      financialInsights: z.boolean().optional(),
      systemNotifications: z.boolean().optional(),
    })
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(1, "Current password is required"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "New password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "New password must contain at least one letter")
      .regex(/[0-9]/, "New password must contain at least one number"),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.confirmPassword !== undefined && data.confirmPassword !== "") {
        return data.newPassword === data.confirmPassword;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export const deleteAccountSchema = z.object({
  password: z
    .string({ required_error: "Password is required to confirm account deletion" })
    .min(1, "Password is required"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
