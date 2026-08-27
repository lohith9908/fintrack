import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../services/transaction.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "../validators/transaction.validator";
import { TransactionType } from "../types/database.types";

export class TransactionController {
  /**
   * GET /api/transactions
   */
  public static async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const type = req.query.type as TransactionType | undefined;
      const account = req.query.account as string | undefined;
      const category = req.query.category as string | undefined;

      const result = await TransactionService.getTransactions(userId, {
        type,
        account,
        category,
      });

      ApiResponse.success(res, "Transactions retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/transactions
   */
  public static async createTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validatedData = createTransactionSchema.parse(req.body);

      const transaction = await TransactionService.createTransaction(
        userId,
        validatedData
      );

      ApiResponse.created(res, "Transaction created successfully", {
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/transactions/:id
   */
  public static async getTransactionById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const transactionId = req.params.id;

      const transaction = await TransactionService.getTransactionById(
        userId,
        transactionId
      );

      ApiResponse.success(res, "Transaction details retrieved", {
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/transactions/:id
   */
  public static async updateTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const transactionId = req.params.id;
      const validatedData = updateTransactionSchema.parse(req.body);

      const transaction = await TransactionService.updateTransaction(
        userId,
        transactionId,
        validatedData
      );

      ApiResponse.success(res, "Transaction updated successfully", {
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/transactions/:id
   */
  public static async deleteTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const transactionId = req.params.id;

      const result = await TransactionService.deleteTransaction(
        userId,
        transactionId
      );

      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
