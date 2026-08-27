import mongoose from "mongoose";
import { Account, Transaction } from "../models";
import { IAccount, AccountType, AccountStatus } from "../types/database.types";
import { CreateAccountInput, UpdateAccountInput } from "../validators/account.validator";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../utils/apiError";

export interface AccountWithBalance {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  name: string;
  type: AccountType;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  status: AccountStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountsSummary {
  totalNetWorth: number;
  totalBankBalance: number;
  totalCashUpiBalance: number;
  totalCreditLiabilities: number;
  activeAccountsCount: number;
  archivedAccountsCount: number;
}

export class AccountService {
  /**
   * Create a new financial account/wallet for a user
   */
  public static async createAccount(
    userId: string,
    input: CreateAccountInput
  ): Promise<IAccount> {
    const normalizedName = input.name.trim();

    // Check for duplicate account name for this user (case-insensitive)
    const existing = await Account.findOne({
      user: userId,
      name: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (existing) {
      throw new ConflictError("An account with this name already exists in your wallets.");
    }

    const account = await Account.create({
      user: userId,
      name: normalizedName,
      type: input.type,
      openingBalance: input.openingBalance ?? 0,
      currency: input.currency?.toUpperCase() || "INR",
      status: "ACTIVE",
      notes: input.notes?.trim(),
    });

    return account;
  }

  /**
   * Calculate dynamic account balance based on opening balance and transactions
   */
  public static async calculateAccountBalance(
    userId: string,
    account: IAccount
  ): Promise<number> {
    // Aggregate income and expense transactions for this account
    const aggregation = await Transaction.aggregate<{ _id: null; totalIncome: number; totalExpense: number }>([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          account: account._id,
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const income = aggregation[0]?.totalIncome || 0;
    const expense = aggregation[0]?.totalExpense || 0;

    // For Credit Cards: Opening balance represents initial outstanding balance
    // Balance = OpeningBalance + Expense - Income (or liability format)
    return account.openingBalance + income - expense;
  }

  /**
   * Get all accounts for a user with calculated balances and category totals
   */
  public static async getAccounts(
    userId: string,
    options: {
      type?: AccountType;
      status?: AccountStatus;
    } = {}
  ): Promise<{ accounts: AccountWithBalance[]; summary: AccountsSummary }> {
    const query: Record<string, unknown> = {
      user: userId,
    };

    if (options.type) {
      query.type = options.type;
    }
    if (options.status) {
      query.status = options.status;
    }

    const rawAccounts = await Account.find(query).sort({ createdAt: -1 });

    // Calculate balances for each account
    const accountsWithBalance: AccountWithBalance[] = await Promise.all(
      rawAccounts.map(async (acc) => {
        const currentBalance = await this.calculateAccountBalance(userId, acc);
        return {
          ...acc.toObject(),
          currentBalance,
        };
      })
    );

    // Calculate Summary Statistics
    let totalAssets = 0;
    let totalCreditLiabilities = 0;
    let totalBankBalance = 0;
    let totalCashUpiBalance = 0;
    let activeAccountsCount = 0;
    let archivedAccountsCount = 0;

    for (const acc of accountsWithBalance) {
      if (acc.status === "ACTIVE") {
        activeAccountsCount++;
      } else if (acc.status === "ARCHIVED" || acc.status === "INACTIVE") {
        archivedAccountsCount++;
      }

      if (acc.status !== "ARCHIVED") {
        if (acc.type === "CREDIT_CARD") {
          // Credit card balance represents liability
          totalCreditLiabilities += Math.abs(acc.currentBalance);
        } else {
          totalAssets += acc.currentBalance;
          if (acc.type === "BANK_ACCOUNT") {
            totalBankBalance += acc.currentBalance;
          } else if (acc.type === "CASH" || acc.type === "UPI") {
            totalCashUpiBalance += acc.currentBalance;
          }
        }
      }
    }

    const summary: AccountsSummary = {
      totalNetWorth: totalAssets - totalCreditLiabilities,
      totalBankBalance,
      totalCashUpiBalance,
      totalCreditLiabilities,
      activeAccountsCount,
      archivedAccountsCount,
    };

    return {
      accounts: accountsWithBalance,
      summary,
    };
  }

  /**
   * Get single account by ID with ownership verification
   */
  public static async getAccountById(
    userId: string,
    accountId: string
  ): Promise<AccountWithBalance> {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new BadRequestError("Invalid account ID format.");
    }

    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) {
      throw new NotFoundError("Account not found or access denied.");
    }

    const currentBalance = await this.calculateAccountBalance(userId, account);
    return {
      ...account.toObject(),
      currentBalance,
    };
  }

  /**
   * Update an existing account with ownership validation
   */
  public static async updateAccount(
    userId: string,
    accountId: string,
    input: UpdateAccountInput
  ): Promise<AccountWithBalance> {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new BadRequestError("Invalid account ID format.");
    }

    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) {
      throw new NotFoundError("Account not found or access denied.");
    }

    // Check name collision if name is being changed
    if (input.name && input.name.trim() !== account.name) {
      const normalizedName = input.name.trim();
      const existing = await Account.findOne({
        user: userId,
        _id: { $ne: accountId },
        name: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      });
      if (existing) {
        throw new ConflictError("Another account with this name already exists.");
      }
      account.name = normalizedName;
    }

    if (input.type) account.type = input.type;
    if (input.currency) account.currency = input.currency.toUpperCase();
    if (input.status) account.status = input.status;
    if (input.notes !== undefined) account.notes = input.notes.trim();

    await account.save();

    const currentBalance = await this.calculateAccountBalance(userId, account);
    return {
      ...account.toObject(),
      currentBalance,
    };
  }

  /**
   * Deactivate or Archive an account
   */
  public static async deactivateAccount(
    userId: string,
    accountId: string,
    archive = false
  ): Promise<IAccount> {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new BadRequestError("Invalid account ID format.");
    }

    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) {
      throw new NotFoundError("Account not found or access denied.");
    }

    account.status = archive ? "ARCHIVED" : "INACTIVE";
    await account.save();
    return account;
  }

  /**
   * Delete an account permanently
   */
  public static async deleteAccount(
    userId: string,
    accountId: string
  ): Promise<{ message: string }> {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new BadRequestError("Invalid account ID format.");
    }

    const account = await Account.findOne({ _id: accountId, user: userId });
    if (!account) {
      throw new NotFoundError("Account not found or access denied.");
    }

    // Check if account has associated transactions
    const transactionCount = await Transaction.countDocuments({
      user: userId,
      account: accountId,
    });

    if (transactionCount > 0) {
      // Soft-archive to protect historical transaction integrity
      account.status = "ARCHIVED";
      await account.save();
      return { message: "Account has recorded financial history. Status changed to ARCHIVED." };
    }

    await Account.deleteOne({ _id: accountId });
    return { message: "Account deleted successfully." };
  }
}
