import mongoose from "mongoose";
import { User, Transaction, Account, Category, Budget, RecurringTransaction, SystemSetting, AuditLog } from "../models";
import {
  AdminUserQueryParams,
  AdminUpdateUserStatusInput,
  AdminUpdateUserRoleInput,
  AdminCreateCategoryInput,
  AdminUpdateCategoryInput,
} from "../validators/admin.validator";
import { AuditService } from "./audit.service";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/apiError";

export const DEFAULT_SYSTEM_SETTINGS: Record<string, unknown> = {
  defaultCurrency: "INR",
  allowUserRegistration: true,
  maxAccountsPerUser: 10,
  maxBudgetsPerUser: 20,
  maintenanceMode: false,
  sessionTimeoutMinutes: 1440,
  supportEmail: "support@fintrack.local",
  appVersion: "1.0.0",
};

export class AdminService {
  /**
   * Platform Overview & Telemetry Metrics
   */
  public static async getPlatformOverview() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      adminUsers,
      totalTransactions,
      totalAccounts,
      totalBudgets,
      totalCategories,
      totalAuditLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "ACTIVE" }),
      User.countDocuments({ status: "INACTIVE" }),
      User.countDocuments({ status: "SUSPENDED" }),
      User.countDocuments({ role: "ADMIN" }),
      Transaction.countDocuments(),
      Account.countDocuments(),
      Budget.countDocuments(),
      Category.countDocuments({ isSystem: true }),
      AuditLog.countDocuments(),
    ]);

    // Financial volume aggregation (Total Inflows, Total Outflows, Gross Volume)
    const volumeAgg = await Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalInflows = 0;
    let totalOutflows = 0;

    for (const item of volumeAgg) {
      if (item._id === "INCOME") {
        totalInflows = Math.round(item.totalAmount * 100) / 100;
      } else if (item._id === "EXPENSE") {
        totalOutflows = Math.round(item.totalAmount * 100) / 100;
      }
    }

    const grossVolume = Math.round((totalInflows + totalOutflows) * 100) / 100;

    // User growth & monthly trends for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const userRegistrationTrends = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Recent 5 audit logs with actor details
    const recentAuditLogs = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("actor", "name email role")
      .lean();

    return {
      metrics: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        adminUsers,
        totalTransactions,
        totalAccounts,
        totalBudgets,
        totalCategories,
        totalAuditLogs,
        financialVolume: {
          totalInflows,
          totalOutflows,
          grossVolume,
        },
      },
      userRegistrationTrends: userRegistrationTrends.map((t) => ({
        year: t._id.year,
        month: t._id.month,
        count: t.count,
      })),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log._id.toString(),
        actor: log.actor
          ? {
              name: (log.actor as unknown as { name: string }).name,
              email: (log.actor as unknown as { email: string }).email,
              role: (log.actor as unknown as { role: string }).role,
            }
          : { name: "System", email: "system@fintrack.local", role: "ADMIN" },
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        createdAt: log.createdAt.toISOString(),
      })),
      systemHealth: {
        status: "OPERATIONAL",
        database: mongoose.connection.readyState === 1 ? "CONNECTED" : "DEGRADED",
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * User Management: List users with search, role, status filters, and entity counts
   */
  public static async getUsers(params: AdminUserQueryParams) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (params.search) {
      const searchRegex = new RegExp(params.search.trim(), "i");
      filter.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (params.role) {
      filter.role = params.role;
    }

    if (params.status) {
      filter.status = params.status;
    }

    const sortOrder = params.sortOrder === "asc" ? 1 : -1;
    const sortField = params.sortBy || "createdAt";
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [total, userDocs] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-passwordHash -__v")
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const userIds = userDocs.map((u) => u._id);

    // Entity counts aggregation for the current page batch
    const [accountsAgg, transactionsAgg, budgetsAgg] = await Promise.all([
      Account.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
      Budget.aggregate([
        { $match: { user: { $in: userIds } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
      ]),
    ]);

    const accountsCountMap = new Map<string, number>();
    accountsAgg.forEach((a) => accountsCountMap.set(a._id.toString(), a.count));

    const transactionsCountMap = new Map<string, number>();
    transactionsAgg.forEach((t) => transactionsCountMap.set(t._id.toString(), t.count));

    const budgetsCountMap = new Map<string, number>();
    budgetsAgg.forEach((b) => budgetsCountMap.set(b._id.toString(), b.count));

    const users = userDocs.map((user) => {
      const uId = user._id.toString();
      return {
        id: uId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone || null,
        currency: user.currency || "INR",
        timezone: user.timezone || "Asia/Kolkata",
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
        onboardingCompleted: user.onboardingCompleted || false,
        entityCounts: {
          accounts: accountsCountMap.get(uId) || 0,
          transactions: transactionsCountMap.get(uId) || 0,
          budgets: budgetsCountMap.get(uId) || 0,
        },
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * User Management: Get safe user profile and details by ID
   */
  public static async getUserById(targetUserId: string) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestError("Invalid user ID format");
    }

    const user = await User.findById(targetUserId).select("-passwordHash -__v").lean();
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const uObjectId = new mongoose.Types.ObjectId(targetUserId);

    const [accounts, transactionCount, budgetCount, recurringCount, recentTransactions] =
      await Promise.all([
        Account.find({ user: uObjectId }).lean(),
        Transaction.countDocuments({ user: uObjectId }),
        Budget.countDocuments({ user: uObjectId }),
        RecurringTransaction.countDocuments({ user: uObjectId }),
        Transaction.find({ user: uObjectId })
          .sort({ date: -1 })
          .limit(5)
          .populate("account", "name")
          .lean(),
      ]);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone || null,
        currency: user.currency || "INR",
        timezone: user.timezone || "Asia/Kolkata",
        dateFormat: user.dateFormat || "DD/MM/YYYY",
        theme: user.theme || "system",
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
        onboardingCompleted: user.onboardingCompleted,
      },
      entitySummary: {
        accountsCount: accounts.length,
        transactionsCount: transactionCount,
        budgetsCount: budgetCount,
        recurringCount,
      },
      accounts: accounts.map((acc) => ({
        id: acc._id.toString(),
        name: acc.name,
        type: acc.type,
        currency: acc.currency,
        status: acc.status,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t._id.toString(),
        amount: t.amount,
        type: t.type,
        date: t.date.toISOString(),
        description: t.description,
        accountName: (t.account as unknown as { name?: string })?.name || "Account",
      })),
    };
  }

  /**
   * User Management: Update user status (ACTIVE, INACTIVE, SUSPENDED)
   * Prevents self-suspension/deactivation
   */
  public static async updateUserStatus(
    actingAdminId: string,
    targetUserId: string,
    input: AdminUpdateUserStatusInput
  ) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestError("Invalid user ID format");
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Self-action protection guard
    if (actingAdminId === targetUserId && input.status !== "ACTIVE") {
      throw new ForbiddenError("Administrators cannot deactivate or suspend their own account.");
    }

    const previousStatus = user.status;
    user.status = input.status;
    await user.save();

    // Record audit log
    await AuditService.logAction({
      actorId: actingAdminId,
      action: "USER_STATUS_UPDATE",
      targetType: "USER",
      targetId: targetUserId,
      metadata: {
        targetUserEmail: user.email,
        targetUserName: user.name,
        previousStatus,
        newStatus: input.status,
        reason: input.reason || "Status updated via admin console",
      },
    });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      updatedAt: user.updatedAt?.toISOString(),
    };
  }

  /**
   * User Management: Change user role (USER, ADMIN)
   * Prevents sole admin demotion
   */
  public static async updateUserRole(
    actingAdminId: string,
    targetUserId: string,
    input: AdminUpdateUserRoleInput
  ) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestError("Invalid user ID format");
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Last administrator protection guard
    if (user.role === "ADMIN" && input.role === "USER") {
      const activeAdminCount = await User.countDocuments({ role: "ADMIN", status: "ACTIVE" });
      if (activeAdminCount <= 1) {
        throw new ForbiddenError("Cannot demote the sole active administrator on the platform.");
      }
    }

    const previousRole = user.role;
    user.role = input.role;
    await user.save();

    // Record audit log
    await AuditService.logAction({
      actorId: actingAdminId,
      action: "USER_ROLE_UPDATE",
      targetType: "USER",
      targetId: targetUserId,
      metadata: {
        targetUserEmail: user.email,
        targetUserName: user.name,
        previousRole,
        newRole: input.role,
        reason: input.reason || "Role changed via admin console",
      },
    });

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      updatedAt: user.updatedAt?.toISOString(),
    };
  }

  /**
   * System Category Management: List all system categories with usage count
   */
  public static async getSystemCategories() {
    const categories = await Category.find({ isSystem: true }).sort({ type: 1, name: 1 }).lean();

    const categoryIds = categories.map((c) => c._id);

    // Compute transaction usage counts for each system category
    const usageAgg = await Transaction.aggregate([
      { $match: { category: { $in: categoryIds } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const usageMap = new Map<string, number>();
    usageAgg.forEach((u) => usageMap.set(u._id.toString(), u.count));

    return categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name,
      type: cat.type,
      icon: cat.icon || "tag",
      color: cat.color || "#6366F1",
      isSystem: true,
      isActive: cat.isActive !== false,
      transactionCount: usageMap.get(cat._id.toString()) || 0,
      createdAt: cat.createdAt?.toISOString(),
      updatedAt: cat.updatedAt?.toISOString(),
    }));
  }

  /**
   * System Category Management: Create new system category
   */
  public static async createSystemCategory(actingAdminId: string, input: AdminCreateCategoryInput) {
    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${input.name.trim()}$`, "i") },
      type: input.type,
      isSystem: true,
    });

    if (existing) {
      throw new BadRequestError(`System category with name "${input.name}" already exists for ${input.type}`);
    }

    const category = await Category.create({
      name: input.name.trim(),
      type: input.type,
      icon: input.icon || "tag",
      color: input.color || "#6366F1",
      isSystem: true,
      user: null,
      isActive: true,
    });

    // Record audit log
    await AuditService.logAction({
      actorId: actingAdminId,
      action: "CATEGORY_CREATE",
      targetType: "CATEGORY",
      targetId: category._id.toString(),
      metadata: {
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
      },
    });

    return {
      id: category._id.toString(),
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      isSystem: true,
      isActive: category.isActive,
      transactionCount: 0,
      createdAt: category.createdAt?.toISOString(),
    };
  }

  /**
   * System Category Management: Update system category
   */
  public static async updateSystemCategory(
    actingAdminId: string,
    categoryId: string,
    input: AdminUpdateCategoryInput
  ) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestError("Invalid category ID format");
    }

    const category = await Category.findOne({ _id: categoryId, isSystem: true });
    if (!category) {
      throw new NotFoundError("System category not found");
    }

    if (input.name) category.name = input.name.trim();
    if (input.icon) category.icon = input.icon.trim();
    if (input.color) category.color = input.color.trim();
    if (input.isActive !== undefined) category.isActive = input.isActive;

    await category.save();

    // Record audit log
    await AuditService.logAction({
      actorId: actingAdminId,
      action: "CATEGORY_UPDATE",
      targetType: "CATEGORY",
      targetId: categoryId,
      metadata: {
        categoryName: category.name,
        changes: input,
      },
    });

    return {
      id: category._id.toString(),
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      isSystem: true,
      isActive: category.isActive,
      updatedAt: category.updatedAt?.toISOString(),
    };
  }

  /**
   * System Category Management: Safe Delete or Soft-Disable
   * If referenced by transactions/budgets/recurring rules, performs soft-disable to preserve ledger integrity.
   */
  public static async deleteOrDisableCategory(actingAdminId: string, categoryId: string) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestError("Invalid category ID format");
    }

    const catObjectId = new mongoose.Types.ObjectId(categoryId);
    const category = await Category.findOne({ _id: catObjectId, isSystem: true });
    if (!category) {
      throw new NotFoundError("System category not found");
    }

    // Check financial record references
    const [txnCount, budgetCount, recurringCount] = await Promise.all([
      Transaction.countDocuments({ category: catObjectId }),
      Budget.countDocuments({ category: catObjectId }),
      RecurringTransaction.countDocuments({ category: catObjectId }),
    ]);

    const isReferenced = txnCount > 0 || budgetCount > 0 || recurringCount > 0;

    if (isReferenced) {
      // Soft-disable to preserve historical records
      category.isActive = false;
      await category.save();

      await AuditService.logAction({
        actorId: actingAdminId,
        action: "CATEGORY_SOFT_DISABLE",
        targetType: "CATEGORY",
        targetId: categoryId,
        metadata: {
          categoryName: category.name,
          reason: "Category is referenced by existing financial records",
          references: {
            transactions: txnCount,
            budgets: budgetCount,
            recurring: recurringCount,
          },
        },
      });

      return {
        action: "DISABLED",
        message: "Category is referenced by existing financial transactions and has been safely disabled rather than deleted.",
        category: {
          id: category._id.toString(),
          name: category.name,
          isActive: false,
        },
      };
    } else {
      // Safe hard delete for unreferenced category
      await Category.findByIdAndDelete(catObjectId);

      await AuditService.logAction({
        actorId: actingAdminId,
        action: "CATEGORY_DELETE",
        targetType: "CATEGORY",
        targetId: categoryId,
        metadata: {
          categoryName: category.name,
          type: category.type,
        },
      });

      return {
        action: "DELETED",
        message: "Category was not referenced by any records and has been permanently deleted.",
        categoryId,
      };
    }
  }

  /**
   * System Settings: Retrieve all platform parameters with defaults
   */
  public static async getSystemSettings() {
    const persistedSettings = await SystemSetting.find({}).lean();
    const settingsMap: Record<string, unknown> = { ...DEFAULT_SYSTEM_SETTINGS };

    persistedSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return {
      settings: settingsMap,
      schema: Object.keys(DEFAULT_SYSTEM_SETTINGS).map((key) => ({
        key,
        defaultValue: DEFAULT_SYSTEM_SETTINGS[key],
        currentValue: settingsMap[key],
      })),
    };
  }

  /**
   * System Settings: Update a single parameter
   */
  public static async updateSystemSetting(
    actingAdminId: string,
    key: string,
    value: unknown,
    description?: string
  ) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SYSTEM_SETTINGS, key)) {
      throw new BadRequestError(`Unknown system setting key "${key}"`);
    }

    const previousSetting = await SystemSetting.findOne({ key });
    const previousValue = previousSetting ? previousSetting.value : DEFAULT_SYSTEM_SETTINGS[key];

    const adminObjectId = new mongoose.Types.ObjectId(actingAdminId);

    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      {
        value,
        description: description || `Configured ${key}`,
        updatedBy: adminObjectId,
      },
      { upsert: true, new: true }
    );

    // Record audit log
    await AuditService.logAction({
      actorId: actingAdminId,
      action: "SYSTEM_SETTING_UPDATE",
      targetType: "SYSTEM_SETTING",
      targetId: key,
      metadata: {
        key,
        previousValue,
        newValue: value,
      },
    });

    return {
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updatedAt: setting.updatedAt?.toISOString(),
    };
  }

  /**
   * System Settings: Update multiple settings in batch
   */
  public static async updateSystemSettingsBatch(
    actingAdminId: string,
    settingsObj: Record<string, unknown>
  ) {
    const adminObjectId = new mongoose.Types.ObjectId(actingAdminId);
    const updatedEntries: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(settingsObj)) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_SYSTEM_SETTINGS, key)) {
        await SystemSetting.findOneAndUpdate(
          { key },
          {
            value,
            updatedBy: adminObjectId,
          },
          { upsert: true }
        );
        updatedEntries[key] = value;
      }
    }

    // Record audit log
    await AuditService.logAction({
      actorId: actingAdminId,
      action: "SYSTEM_SETTINGS_BATCH_UPDATE",
      targetType: "SYSTEM_SETTING",
      metadata: {
        updatedKeys: Object.keys(updatedEntries),
        values: updatedEntries,
      },
    });

    return this.getSystemSettings();
  }

  /**
   * System Settings: Reset to default values
   */
  public static async resetSystemSettings(actingAdminId: string) {
    await SystemSetting.deleteMany({});

    await AuditService.logAction({
      actorId: actingAdminId,
      action: "SYSTEM_SETTING_RESET",
      targetType: "SYSTEM_SETTING",
      metadata: {
        resetToDefaults: DEFAULT_SYSTEM_SETTINGS,
      },
    });

    return this.getSystemSettings();
  }
}
