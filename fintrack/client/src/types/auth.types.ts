export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type UserTheme = "light" | "dark" | "system";

export interface INotificationPreferences {
  budgetAlerts: boolean;
  recurringPaymentAlerts: boolean;
  goalAlerts: boolean;
  financialInsights: boolean;
  systemNotifications: boolean;
}

export interface IProfilePicture {
  url?: string;
  storageKey?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  profilePicture?: IProfilePicture;
  currency: string;
  timezone: string;
  dateFormat: string;
  theme: UserTheme;
  notificationPreferences: INotificationPreferences;
  status: UserStatus;
  onboardingCompleted: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: IUser;
  };
  errors?: unknown[];
}

export interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  theme?: UserTheme;
  notificationPreferences?: Partial<INotificationPreferences>;
}
