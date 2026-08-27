import { Request, Response, NextFunction } from "express";
import { BudgetService } from "../services/budget.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  createBudgetSchema,
  updateBudgetSchema,
  getBudgetsQuerySchema,
} from "../validators/budget.validator";

export class BudgetController {
  /**
   * GET /api/budgets
   */
  public static async getBudgets(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = getBudgetsQuerySchema.parse(req.query);
      const result = await BudgetService.getBudgets(userId, query);

      ApiResponse.success(res, "Budgets retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/budgets
   */
  public static async createBudget(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const input = createBudgetSchema.parse(req.body);
      const budget = await BudgetService.createBudget(userId, input);

      ApiResponse.created(res, "Budget created successfully", budget);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/budgets/:id
   */
  public static async getBudgetById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const budget = await BudgetService.getBudgetById(userId, id);

      ApiResponse.success(res, "Budget retrieved successfully", budget);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/budgets/:id
   */
  public static async updateBudget(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const input = updateBudgetSchema.parse(req.body);
      const budget = await BudgetService.updateBudget(userId, id, input);

      ApiResponse.success(res, "Budget updated successfully", budget);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/budgets/:id
   */
  public static async deleteBudget(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await BudgetService.deleteBudget(userId, id);

      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
