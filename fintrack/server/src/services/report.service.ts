import mongoose from "mongoose";
import {
  Transaction,
  User,
  Account,
  Category,
  Budget,
  RecurringTransaction,
  SavingsGoal,
  Notification,
} from "../models";
import { MonthlyReportQueryParams, ExportTransactionsQueryParams } from "../validators/report.validator";
import { generateMonthlyReportPDF, MonthlyReportPDFData } from "../utils/pdfGenerator";

export interface MonthlyReportData {
  title: string;
  month: number;
  year: number;
  monthLabel: string;
  currency: string;
  generatedAt: string;
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
    avgDailyExpense: number;
  };
  categories: Array<{
    categoryId: string;
    name: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  accounts: Array<{
    accountId: string;
    name: string;
    type: string;
    amount: number;
    percentage: number;
  }>;
  topTransactions: Array<{
    id: string;
    date: string;
    description: string;
    category: string;
    account: string;
    amount: number;
    type: string;
    paymentMethod: string;
  }>;
}

export interface UserDataExport {
  exportMetadata: {
    version: string;
    exportedAt: string;
    userId: string;
    entityCounts: Record<string, number>;
  };
  user: Record<string, unknown>;
  accounts: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  budgets: Array<Record<string, unknown>>;
  recurringTransactions: Array<Record<string, unknown>>;
  savingsGoals: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
}

export class ReportService {
  /**
   * Calculate deterministic monthly financial statement data
   */
  public static async getMonthlyReport(
    userId: string,
    params: MonthlyReportQueryParams
  ): Promise<MonthlyReportData> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const user = await User.findById(userObjectId).lean();
    const currency = user?.currency || "INR";

    const now = new Date();
    const targetYear = params.year || now.getFullYear();
    const targetMonth = params.month || now.getMonth() + 1; // 1-12

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    // Preload categories
    const categoriesList = await Category.find({}).lean();
    const categoryMap = new Map<string, string>();
    categoriesList.forEach((cat) => {
      categoryMap.set(cat._id.toString(), cat.name);
    });

    // 1. Income and Expense Summary
    const incomeExpenseAgg = await Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: { $in: ["INCOME", "EXPENSE"] },
        },
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTxnCount = 0;

    for (const item of incomeExpenseAgg) {
      if (item._id === "INCOME") {
        totalIncome = Math.round(item.total * 100) / 100;
        totalTxnCount += item.count;
      } else if (item._id === "EXPENSE") {
        totalExpenses = Math.round(item.total * 100) / 100;
        totalTxnCount += item.count;
      }
    }

    const netSavings = Math.round((totalIncome - totalExpenses) * 100) / 100;
    const savingsRate =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 1000) / 10
        : 0;

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const avgDailyExpense = Math.round((totalExpenses / daysInMonth) * 100) / 100;

    // 2. Category Breakdown
    const categoryAgg = await Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: "EXPENSE",
        },
      },
      {
        $group: {
          _id: "$category",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const categories = categoryAgg.map((c) => {
      const catIdStr = c._id ? c._id.toString() : "uncategorized";
      const name = c._id ? categoryMap.get(catIdStr) || "Uncategorized" : "Uncategorized";
      const amount = Math.round(c.amount * 100) / 100;
      const percentage =
        totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0;
      return {
        categoryId: catIdStr,
        name,
        amount,
        percentage,
        count: c.count,
      };
    });

    // 3. Payment Methods Breakdown
    const paymentAgg = await Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: "EXPENSE",
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const paymentMethods = paymentAgg.map((p) => {
      const method = p._id || "OTHER";
      const amount = Math.round(p.amount * 100) / 100;
      const percentage =
        totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0;
      return {
        method,
        amount,
        count: p.count,
        percentage,
      };
    });

    // 4. Accounts Breakdown
    const accountAgg = await Transaction.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          type: "EXPENSE",
        },
      },
      {
        $group: {
          _id: "$account",
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    const userAccounts = await Account.find({ user: userObjectId }).lean();
    const accountMap = new Map<string, { name: string; type: string }>();
    userAccounts.forEach((acc) => {
      accountMap.set(acc._id.toString(), { name: acc.name, type: acc.type });
    });

    const accounts = accountAgg.map((a) => {
      const accIdStr = a._id ? a._id.toString() : "unknown";
      const accInfo = accountMap.get(accIdStr) || { name: "Account", type: "BANK_ACCOUNT" };
      const amount = Math.round(a.amount * 100) / 100;
      const percentage =
        totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0;
      return {
        accountId: accIdStr,
        name: accInfo.name,
        type: accInfo.type,
        amount,
        percentage,
      };
    });

    // 5. Top Transactions in this period
    const topTxnDocs = await Transaction.find({
      user: userObjectId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .sort({ amount: -1 })
      .limit(10)
      .populate("account", "name")
      .lean();

    const topTransactions = topTxnDocs.map((t) => {
      const catName = t.category ? categoryMap.get(t.category.toString()) || "General" : "General";
      const accName = (t.account as unknown as { name?: string })?.name || "Account";
      return {
        id: t._id.toString(),
        date: t.date.toISOString(),
        description: t.description || `${t.type} Transaction`,
        category: catName,
        account: accName,
        amount: t.amount,
        type: t.type,
        paymentMethod: t.paymentMethod,
      };
    });

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthLabel = `${monthNames[targetMonth - 1]} ${targetYear}`;

    return {
      title: `${monthLabel} Financial Report`,
      month: targetMonth,
      year: targetYear,
      monthLabel,
      currency,
      generatedAt: new Date().toISOString(),
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        transactionCount: totalTxnCount,
        avgDailyExpense,
      },
      categories,
      paymentMethods,
      accounts,
      topTransactions,
    };
  }

  /**
   * Generate Binary PDF Document for Monthly Financial Statement
   */
  public static async getMonthlyReportPDFBuffer(
    userId: string,
    params: MonthlyReportQueryParams
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const reportData = await this.getMonthlyReport(userId, params);

    const user = await User.findById(userId).lean();
    const userName = user?.name || "FinTrack User";
    const userEmail = user?.email || "";

    const pdfData: MonthlyReportPDFData = {
      title: reportData.title,
      periodLabel: reportData.monthLabel,
      userName,
      userEmail,
      currency: reportData.currency,
      generatedAt: new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      summary: reportData.summary,
      categories: reportData.categories.map((c) => ({
        name: c.name,
        amount: c.amount,
        percentage: c.percentage,
      })),
      paymentMethods: reportData.paymentMethods.map((p) => ({
        method: p.method,
        amount: p.amount,
        count: p.count,
        percentage: p.percentage,
      })),
      topTransactions: reportData.topTransactions.map((t) => ({
        date: t.date,
        description: t.description,
        category: t.category,
        amount: t.amount,
        type: t.type,
      })),
    };

    const buffer = generateMonthlyReportPDF(pdfData);
    const fileName = `fintrack-report-${reportData.year}-${String(reportData.month).padStart(2, "0")}.pdf`;

    return { buffer, fileName };
  }

  /**
   * Export transactions as RFC 4180 compliant CSV format
   */
  public static async exportTransactionsCSV(
    userId: string,
    params: ExportTransactionsQueryParams
  ): Promise<{ csvContent: string; fileName: string }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matchQuery: Record<string, unknown> = {
      user: userObjectId,
    };

    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.$gte = new Date(params.startDate);
      if (params.endDate) dateFilter.$lte = new Date(params.endDate);
      matchQuery.date = dateFilter;
    }

    if (params.type) matchQuery.type = params.type;
    if (params.accountId) matchQuery.account = new mongoose.Types.ObjectId(params.accountId);
    if (params.categoryId) matchQuery.category = new mongoose.Types.ObjectId(params.categoryId);

    const transactions = await Transaction.find(matchQuery)
      .sort({ date: -1 })
      .populate("account", "name")
      .lean();

    const categoriesList = await Category.find({}).lean();
    const categoryMap = new Map<string, string>();
    categoriesList.forEach((c) => {
      categoryMap.set(c._id.toString(), c.name);
    });

    const user = await User.findById(userObjectId).lean();
    const defaultCurrency = user?.currency || "INR";

    // Escape CSV cell according to RFC 4180
    const escapeCsv = (str: unknown): string => {
      if (str === null || str === undefined) return '""';
      const text = String(str).replace(/"/g, '""');
      return `"${text}"`;
    };

    const headers = [
      "Date",
      "Type",
      "Amount",
      "Currency",
      "Category",
      "Account",
      "Payment Method",
      "Description",
      "Receipt",
      "Notes",
    ];

    const rows = transactions.map((t) => {
      const catName = t.category ? categoryMap.get(t.category.toString()) || "Uncategorized" : "Uncategorized";
      const accName = (t.account as unknown as { name?: string })?.name || "Default Account";
      const dateStr = t.date ? new Date(t.date).toISOString().split("T")[0] : "";
      const receiptStr = t.receipt?.originalName || t.receipt?.url || "";

      return [
        escapeCsv(dateStr),
        escapeCsv(t.type),
        escapeCsv(t.amount),
        escapeCsv(defaultCurrency),
        escapeCsv(catName),
        escapeCsv(accName),
        escapeCsv(t.paymentMethod || "OTHER"),
        escapeCsv(t.description || ""),
        escapeCsv(receiptStr),
        escapeCsv(t.notes || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const dateTag = new Date().toISOString().split("T")[0];
    const fileName = `fintrack-transactions-${dateTag}.csv`;

    return { csvContent, fileName };
  }

  /**
   * Full User Data Archive Export
   * Strictly sanitizes sensitive fields (strips passwordHash, tokens, JWTs, secrets)
   */
  public static async exportUserData(userId: string): Promise<UserDataExport> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch user and strictly omit passwordHash and sensitive tokens
    const rawUser = await User.findById(userObjectId)
      .select("-passwordHash -__v")
      .lean();

    if (!rawUser) {
      throw new Error("User not found");
    }

    const [
      accounts,
      categories,
      transactions,
      budgets,
      recurringTransactions,
      savingsGoals,
      notifications,
    ] = await Promise.all([
      Account.find({ user: userObjectId }).select("-__v").lean(),
      Category.find({ $or: [{ user: userObjectId }, { isSystem: true }] }).select("-__v").lean(),
      Transaction.find({ user: userObjectId }).select("-__v").lean(),
      Budget.find({ user: userObjectId }).select("-__v").lean(),
      RecurringTransaction.find({ user: userObjectId }).select("-__v").lean(),
      SavingsGoal.find({ user: userObjectId }).select("-__v").lean(),
      Notification.find({ user: userObjectId }).select("-__v").lean(),
    ]);

    const sanitizedUser = {
      _id: rawUser._id,
      name: rawUser.name,
      email: rawUser.email,
      role: rawUser.role,
      phone: rawUser.phone,
      currency: rawUser.currency,
      timezone: rawUser.timezone,
      dateFormat: rawUser.dateFormat,
      notificationPreferences: rawUser.notificationPreferences,
      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
    };

    return {
      exportMetadata: {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        userId: rawUser._id.toString(),
        entityCounts: {
          accounts: accounts.length,
          categories: categories.length,
          transactions: transactions.length,
          budgets: budgets.length,
          recurringTransactions: recurringTransactions.length,
          savingsGoals: savingsGoals.length,
          notifications: notifications.length,
        },
      },
      user: sanitizedUser,
      accounts: accounts as unknown as Array<Record<string, unknown>>,
      categories: categories as unknown as Array<Record<string, unknown>>,
      transactions: transactions as unknown as Array<Record<string, unknown>>,
      budgets: budgets as unknown as Array<Record<string, unknown>>,
      recurringTransactions: recurringTransactions as unknown as Array<Record<string, unknown>>,
      savingsGoals: savingsGoals as unknown as Array<Record<string, unknown>>,
      notifications: notifications as unknown as Array<Record<string, unknown>>,
    };
  }
}
