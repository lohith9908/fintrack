import { Request, Response, NextFunction } from "express";
import { TransactionService } from "../services/transaction.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
} from "../validators/transaction.validator";
import { BadRequestError } from "../utils/apiError";

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
      const validatedQuery = getTransactionsQuerySchema.parse(req.query);

      const result = await TransactionService.getTransactions(
        userId,
        validatedQuery
      );

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

  /**
   * POST /api/transactions/:id/receipt
   */
  public static async uploadReceipt(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const transactionId = req.params.id;

      if (!req.file) {
        throw new BadRequestError("No receipt file was uploaded.");
      }

      const transaction = await TransactionService.uploadReceipt(
        userId,
        transactionId,
        req.file
      );

      ApiResponse.success(res, "Receipt uploaded successfully", {
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/transactions/:id/receipt (Authorized download/stream)
   */
  public static async getReceipt(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const transactionId = req.params.id;

      const receipt = await TransactionService.getReceiptFile(
        userId,
        transactionId
      );

      res.setHeader("Content-Type", receipt.mimeType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${receipt.originalName}"`
      );
      res.sendFile(receipt.filePath);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/transactions/:id/receipt
   */
  public static async deleteReceipt(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const transactionId = req.params.id;

      const transaction = await TransactionService.deleteReceipt(
        userId,
        transactionId
      );

      ApiResponse.success(res, "Receipt deleted successfully", {
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
}
