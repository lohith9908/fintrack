import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Transaction, Category, Account } from "../models";
import { ITransaction } from "../types/database.types";
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  GetTransactionsQueryInput,
} from "../validators/transaction.validator";
import {
  NotFoundError,
  BadRequestError,
} from "../utils/apiError";
import { RECEIPT_UPLOAD_DIR } from "../middlewares/upload.middleware";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface PaginatedTransactionsResult {
  transactions: ITransaction[];
  pagination: PaginationMeta;
  summary: TransactionSummary;
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
   * Get transactions with user-scoped search, multi-field filters, and pagination
   */
  public static async getTransactions(
    userId: string,
    queryInput: Partial<GetTransactionsQueryInput> = {}
  ): Promise<PaginatedTransactionsResult> {
    const page = Math.max(1, queryInput.page || 1);
    const limit = Math.max(1, Math.min(100, queryInput.limit || 10));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      user: new mongoose.Types.ObjectId(userId),
    };

    // 1. Text Search (description, notes)
    if (queryInput.search && queryInput.search.trim()) {
      const sanitized = queryInput.search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const searchRegex = new RegExp(sanitized, "i");
      query.$or = [
        { description: { $regex: searchRegex } },
        { notes: { $regex: searchRegex } },
      ];
    }

    // 2. Transaction Type
    if (queryInput.type) {
      query.type = queryInput.type;
    }

    // 3. Account Filter
    if (queryInput.account && mongoose.Types.ObjectId.isValid(queryInput.account)) {
      query.account = new mongoose.Types.ObjectId(queryInput.account);
    }

    // 4. Category Filter
    if (queryInput.category && mongoose.Types.ObjectId.isValid(queryInput.category)) {
      query.category = new mongoose.Types.ObjectId(queryInput.category);
    }

    // 5. Payment Method Filter
    if (queryInput.paymentMethod) {
      query.paymentMethod = queryInput.paymentMethod;
    }

    // 6. Date Range Filter
    if (queryInput.startDate || queryInput.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (queryInput.startDate) {
        const start = new Date(queryInput.startDate);
        if (!isNaN(start.getTime())) {
          dateFilter.$gte = start;
        }
      }
      if (queryInput.endDate) {
        const end = new Date(queryInput.endDate);
        if (!isNaN(end.getTime())) {
          // If date only string like 2026-08-27, set to end of day
          if (queryInput.endDate.length <= 10) {
            end.setHours(23, 59, 59, 999);
          }
          dateFilter.$lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        query.date = dateFilter;
      }
    }

    // 7. Amount Range Filter
    if (queryInput.minAmount !== undefined || queryInput.maxAmount !== undefined) {
      const amountFilter: Record<string, number> = {};
      if (queryInput.minAmount !== undefined && !isNaN(queryInput.minAmount)) {
        amountFilter.$gte = queryInput.minAmount;
      }
      if (queryInput.maxAmount !== undefined && !isNaN(queryInput.maxAmount)) {
        amountFilter.$lte = queryInput.maxAmount;
      }
      if (Object.keys(amountFilter).length > 0) {
        query.amount = amountFilter;
      }
    }

    // Total matching count for pagination
    const total = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch paginated transactions sorted by date descending, then createdAt descending
    const transactions = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    // Aggregate summary for all transactions of this user (unfiltered by pagination, but matching search/filters if applied)
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
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
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
   * Upload or replace receipt attachment for a transaction
   */
  public static async uploadReceipt(
    userId: string,
    transactionId: string,
    file: Express.Multer.File
  ): Promise<ITransaction> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      // Clean up uploaded file if invalid transaction ID
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestError("Invalid transaction ID format.");
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
    });

    if (!transaction) {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new NotFoundError("Transaction not found or access denied.");
    }

    // Clean up previous receipt file from disk if replacing
    if (transaction.receipt?.storageKey) {
      const oldPath = path.resolve(RECEIPT_UPLOAD_DIR, transaction.receipt.storageKey);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch {
          // ignore unlink error
        }
      }
    }

    const fileId = crypto.randomUUID();
    transaction.receipt = {
      fileId,
      storageKey: file.filename,
      url: `/api/transactions/${transactionId}/receipt`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
    };

    await transaction.save();

    const populated = await Transaction.findById(transaction._id)
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    return populated!;
  }

  /**
   * Retrieve receipt file for authorized download / viewing
   */
  public static async getReceiptFile(
    userId: string,
    transactionId: string
  ): Promise<{ filePath: string; mimeType: string; originalName: string }> {
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

    if (!transaction.receipt || !transaction.receipt.storageKey) {
      throw new NotFoundError("No receipt attached to this transaction.");
    }

    const filePath = path.resolve(RECEIPT_UPLOAD_DIR, transaction.receipt.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundError("Receipt file not found on storage.");
    }

    return {
      filePath,
      mimeType: transaction.receipt.mimeType || "application/octet-stream",
      originalName: transaction.receipt.originalName || "receipt",
    };
  }

  /**
   * Delete attached receipt file from disk and remove metadata
   */
  public static async deleteReceipt(
    userId: string,
    transactionId: string
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

    if (transaction.receipt?.storageKey) {
      const filePath = path.resolve(RECEIPT_UPLOAD_DIR, transaction.receipt.storageKey);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore unlink error
        }
      }
    }

    transaction.receipt = undefined;
    await transaction.save();

    const populated = await Transaction.findById(transaction._id)
      .populate("category", "name type icon color isSystem")
      .populate("account", "name type currency");

    return populated!;
  }

  /**
   * Delete a transaction with ownership check and file cleanup
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

    // Clean up attached receipt file from storage if present
    if (transaction.receipt?.storageKey) {
      const filePath = path.resolve(RECEIPT_UPLOAD_DIR, transaction.receipt.storageKey);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore unlink error
        }
      }
    }

    await Transaction.deleteOne({ _id: transactionId });
    return { message: "Transaction deleted successfully." };
  }
}
