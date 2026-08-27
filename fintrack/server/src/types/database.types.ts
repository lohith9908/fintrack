import { Types, Document } from "mongoose";

// ==========================================
// Enums matching DATABASESCHEMA.md
// ==========================================

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type UserTheme = "light" | "dark" | "system";

export type TransactionType = "INCOME" | "EXPENSE";
export type PaymentMethod =
  | "CASH"
  | "UPI"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "BANK_TRANSFER"
  | "OTHER";

export type AccountType = "CASH" | "BANK_ACCOUNT" | "CREDIT_CARD" | "UPI" | "OTHER";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type RecurringFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export type SavingsGoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";

export type NotificationType =
  | "BUDGET_ALERT"
  | "BUDGET_EXCEEDED"
  | "RECURRING_PAYMENT"
  | "GOAL_MILESTONE"
  | "FINANCIAL_INSIGHT"
  | "SYSTEM";

export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

// ==========================================
// Document Interfaces
// ==========================================

export interface IProfilePicture {
  url?: string;
  storageKey?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
}

export interface INotificationPreferences {
  budgetAlerts: boolean;
  recurringPaymentAlerts: boolean;
  goalAlerts: boolean;
  financialInsights: boolean;
  systemNotifications: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
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
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  user?: Types.ObjectId | null;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAccount extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  type: AccountType;
  openingBalance: number;
  currency: string;
  status: AccountStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceiptMetadata {
  fileId?: string;
  storageKey?: string;
  url?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: Date;
}

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  type: TransactionType;
  category: Types.ObjectId;
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
  account: Types.ObjectId;
  notes?: string;
  receipt?: IReceiptMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBudgetAlertThresholds {
  informational: number;
  warning: number;
  critical: number;
  exceeded: number;
}

export interface IBudget extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  category: Types.ObjectId;
  month: number;
  year: number;
  limitAmount: number;
  alertThresholds: IBudgetAlertThresholds;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecurringTransaction extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  amount: number;
  type: TransactionType;
  category: Types.ObjectId;
  account: Types.ObjectId;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  startDate: Date;
  nextOccurrence: Date;
  endDate?: Date;
  isActive: boolean;
  lastProcessedOccurrence?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGoalContribution {
  _id?: Types.ObjectId;
  amount: number;
  date: Date;
  account?: Types.ObjectId;
  note?: string;
}

export interface ISavingsGoal extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  category?: string;
  description?: string;
  status: SavingsGoalStatus;
  contributions?: IGoalContribution[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPasswordResetToken extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IUserActivity extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ISystemSetting extends Document {
  _id: Types.ObjectId;
  key: string;
  value: unknown;
  description?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
