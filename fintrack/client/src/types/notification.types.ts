export type NotificationType =
  | "BUDGET_ALERT"
  | "BUDGET_EXCEEDED"
  | "RECURRING_PAYMENT"
  | "GOAL_MILESTONE"
  | "FINANCIAL_INSIGHT"
  | "SYSTEM";

export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";

export interface NotificationItem {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationFilterParams {
  read?: boolean | string;
  type?: NotificationType;
  severity?: NotificationSeverity;
  page?: number;
  limit?: number;
}
