export interface AdminPlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  totalTransactions: number;
  totalAccounts: number;
  totalBudgets: number;
  totalCategories: number;
  totalAuditLogs: number;
  financialVolume: {
    totalInflows: number;
    totalOutflows: number;
    grossVolume: number;
  };
}

export interface AdminUserRegistrationTrend {
  year: number;
  month: number;
  count: number;
}

export interface AdminRecentAuditLog {
  id: string;
  actor: {
    name: string;
    email: string;
    role: string;
  };
  action: string;
  targetType: string;
  targetId?: string;
  createdAt: string;
}

export interface AdminSystemHealth {
  status: string;
  database: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
  nodeVersion: string;
  environment: string;
  timestamp: string;
}

export interface AdminPlatformOverview {
  metrics: AdminPlatformMetrics;
  userRegistrationTrends: AdminUserRegistrationTrend[];
  recentAuditLogs: AdminRecentAuditLog[];
  systemHealth: AdminSystemHealth;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  phone?: string | null;
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  entityCounts: {
    accounts: number;
    transactions: number;
    budgets: number;
  };
}

export interface AdminUserDetails {
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    phone?: string | null;
    currency: string;
    timezone: string;
    dateFormat: string;
    theme: string;
    createdAt?: string;
    updatedAt?: string;
    onboardingCompleted: boolean;
  };
  entitySummary: {
    accountsCount: number;
    transactionsCount: number;
    budgetsCount: number;
    recurringCount: number;
  };
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    currency: string;
    status: string;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    date: string;
    description: string;
    accountName: string;
  }>;
}

export interface AdminCategoryItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  isSystem: boolean;
  isActive: boolean;
  transactionCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAuditLogItem {
  id: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminAuditFilterOptions {
  actions: string[];
  targetTypes: string[];
}

export interface AdminSystemSettingsResponse {
  settings: Record<string, unknown>;
  schema: Array<{
    key: string;
    defaultValue: unknown;
    currentValue: unknown;
  }>;
}

export interface AdminUserFilterParams {
  search?: string;
  role?: "USER" | "ADMIN";
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AdminAuditFilterParams {
  actor?: string;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
