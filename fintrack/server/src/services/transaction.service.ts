import mongoose from "mongoose";
import { Transaction, Category, Account } from "../models";
import { ITransaction, TransactionType } from "../types/database.types";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "../validators/transaction.validator";
import {
  NotFoundError,
  BadRequestError,
} from "../utils/apiError";

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
}

export class TransactionService {
  /**
   * Create a new financial transaction
   */
  public static async createTransaction(
    userId: string,
    input: CreateTransactionInput
  ): Promise<ITransaction> {
    if (!mongoose.Types.ObjectId.isValid(input.account)) {
      throw new BadRequestError("Invalid account ID format.");
    }
    if (!mongoose.Types.ObjectId.isValid(input.category)) {
      throw new BadRequestError("Invalid category ID format.");
    }

    // 1. Verify account ownership
    const account = await Account.findOne({
      _id: input.account,
      user: userId,
    });
    if (!account) {
      throw new NotFoundError("Associated account not found or access denied.");
    }

    // 2. Verify category existence and ownership (system or user's custom)
    const category = await Category.findOne({
      _id: input.category,
      $or: [{ isSystem: true }, { user: userId }],
    });
    if (!category) {
      throw new NotFoundError("Associated category not found.");
    }

    // 3. Verify category type matches transaction type
    if (category.type !== input.type) {
      throw new BadRequestError(
        `Category "${category.name}" is configured for ${category.type.toLowerCase()}s, but transaction type is ${input.type.toLowerCase()}.`
      );
    }

    // 4. Create transaction
    const transaction = await Transaction.create({
      user: userId,
      amount: input.amount,
      type: input.type,
      category: input.category,
      description: input.description.trim(),
      date: input.date,
      paymentMethod: input.paymentMethod,
      account: input.account,
      notes: input.notes?.trim(),
    });

    const populated = await Transaction.findById(transaction._id)
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    return populated!;
  }

  /**
   * Get all transactions for a user with calculated financial summary
   */
  public static async getTransactions(
    userId: string,
    options: {
      type?: TransactionType;
      account?: string;
      category?: string;
    } = {}
  ): Promise<{ transactions: ITransaction[]; summary: TransactionSummary }> {
    const query: Record<string, unknown> = {
      user: new mongoose.Types.ObjectId(userId),
    };

    if (options.type) {
      query.type = options.type;
    }
    if (options.account && mongoose.Types.ObjectId.isValid(options.account)) {
      query.account = new mongoose.Types.ObjectId(options.account);
    }
    if (options.category && mongoose.Types.ObjectId.isValid(options.category)) {
      query.category = new mongoose.Types.ObjectId(options.category);
    }

    // Query user transactions sorted by date descending, then createdAt descending
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    // Aggregate summary for all transactions of this user
    const aggregation = await Transaction.aggregate<{
      _id: null;
      totalIncome: number;
      totalExpenses: number;
      count: number;
    }>([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "INCOME"] }, "$amount", 0] },
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalIncome = aggregation[0]?.totalIncome || 0;
    const totalExpenses = aggregation[0]?.totalExpenses || 0;
    const netCashFlow = totalIncome - totalExpenses;
    const transactionCount = aggregation[0]?.count || 0;

    return {
      transactions,
      summary: {
        totalIncome,
        totalExpenses,
        netCashFlow,
        transactionCount,
      },
    };
  }

  /**
   * Get single transaction by ID with ownership verification
   */
  public static async getTransactionById(
    userId: string,
    transactionId: string
  ): Promise<ITransaction> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new BadRequestError("Invalid transaction ID format.");
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
    })
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    if (!transaction) {
      throw new NotFoundError("Transaction not found or access denied.");
    }

    return transaction;
  }

  /**
   * Update an existing transaction with ownership and integrity validation
   */
  public static async updateTransaction(
    userId: string,
    transactionId: string,
    input: UpdateTransactionInput
  ): Promise<ITransaction> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new BadRequestError("Invalid transaction ID format.");
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
    });

    if (!transaction) {
      throw new NotFoundError("Transaction not found or access denied.");
    }

    const newType = input.type || transaction.type;

    // Verify account if changed
    if (input.account) {
      if (!mongoose.Types.ObjectId.isValid(input.account)) {
        throw new BadRequestError("Invalid account ID format.");
      }
      const account = await Account.findOne({
        _id: input.account,
        user: userId,
      });
      if (!account) {
        throw new NotFoundError("Associated account not found or access denied.");
      }
      transaction.account = account._id;
    }

    // Verify category if changed or if type changed
    if (input.category || input.type) {
      const categoryId = input.category || transaction.category;
      if (!mongoose.Types.ObjectId.isValid(categoryId.toString())) {
        throw new BadRequestError("Invalid category ID format.");
      }
      const category = await Category.findOne({
        _id: categoryId,
        $or: [{ isSystem: true }, { user: userId }],
      });
      if (!category) {
        throw new NotFoundError("Associated category not found.");
      }
      if (category.type !== newType) {
        throw new BadRequestError(
          `Category "${category.name}" is configured for ${category.type.toLowerCase()}s, but transaction type is ${newType.toLowerCase()}.`
        );
      }
      transaction.category = category._id;
    }

    if (input.amount !== undefined) transaction.amount = input.amount;
    if (input.type) transaction.type = input.type;
    if (input.description) transaction.description = input.description.trim();
    if (input.date) transaction.date = input.date;
    if (input.paymentMethod) transaction.paymentMethod = input.paymentMethod;
    if (input.notes !== undefined) transaction.notes = input.notes.trim();

    await transaction.save();

    const populated = await Transaction.findById(transaction._id)
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    return populated!;
  }

  /**
   * Delete a transaction with ownership check
   */
  public static async deleteTransaction(
    userId: string,
    transactionId: string
  ): Promise<{ message: string }> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new BadRequestError("Invalid transaction ID format.");
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
    });

    if (!transaction) {
      throw new NotFoundError("Transaction not found or access denied.");
    }

    await Transaction.deleteOne({ _id: transactionId });
    return { message: "Transaction deleted successfully." };
  }
}
