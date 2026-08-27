import { Request, Response, NextFunction } from "express";
import { RecurringService } from "../services/recurring.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  createRecurringSchema,
  updateRecurringSchema,
  getRecurringQuerySchema,
} from "../validators/recurring.validator";

export class RecurringController {
  /**
   * GET /api/recurring-transactions
   */
  public static async getRecurringRules(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = getRecurringQuerySchema.parse(req.query);
      const result = await RecurringService.getRecurringRules(userId, query);

      ApiResponse.success(res, "Recurring transactions retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/recurring-transactions
   */
  public static async createRecurringRule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const input = createRecurringSchema.parse(req.body);
      const result = await RecurringService.createRecurringRule(userId, input);

      ApiResponse.created(res, "Recurring transaction created successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/recurring-transactions/:id
   */
  public static async getRecurringRuleById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await RecurringService.getRecurringRuleById(userId, id);

      ApiResponse.success(res, "Recurring transaction retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/recurring-transactions/:id
   */
  public static async updateRecurringRule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const input = updateRecurringSchema.parse(req.body);
      const result = await RecurringService.updateRecurringRule(userId, id, input);

      ApiResponse.success(res, "Recurring transaction updated successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/recurring-transactions/:id/pause
   */
  public static async pauseRecurringRule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await RecurringService.toggleActive(userId, id, false);

      ApiResponse.success(res, "Recurring transaction paused", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/recurring-transactions/:id/resume
   */
  public static async resumeRecurringRule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await RecurringService.toggleActive(userId, id, true);

      ApiResponse.success(res, "Recurring transaction resumed", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/recurring-transactions/:id
   */
  public static async deleteRecurringRule(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await RecurringService.deleteRecurringRule(userId, id);

      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/recurring-transactions/process-due
   */
  public static async processDue(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const result = await RecurringService.processDueTransactions(userId);

      ApiResponse.success(
        res,
        `Processed ${result.processedCount} due recurring transactions.`,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}
