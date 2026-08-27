import { Request, Response, NextFunction } from "express";
import { GoalService } from "../services/goal.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  createGoalSchema,
  updateGoalSchema,
  addContributionSchema,
  getGoalsQuerySchema,
} from "../validators/goal.validator";

export class GoalController {
  /**
   * GET /api/goals
   */
  public static async getGoals(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = getGoalsQuerySchema.parse(req.query);
      const result = await GoalService.getGoals(userId, query);

      ApiResponse.success(res, "Savings goals retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/goals
   */
  public static async createGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const input = createGoalSchema.parse(req.body);
      const result = await GoalService.createGoal(userId, input);

      ApiResponse.created(res, "Savings goal created successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/goals/:id
   */
  public static async getGoalById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await GoalService.getGoalById(userId, id);

      ApiResponse.success(res, "Savings goal retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/goals/:id
   */
  public static async updateGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const input = updateGoalSchema.parse(req.body);
      const result = await GoalService.updateGoal(userId, id, input);

      ApiResponse.success(res, "Savings goal updated successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/goals/:id/contribute
   */
  public static async addContribution(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const input = addContributionSchema.parse(req.body);
      const result = await GoalService.addContribution(userId, id, input);

      ApiResponse.success(res, "Contribution added successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/goals/:id/pause
   */
  public static async pauseGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await GoalService.updateStatus(userId, id, "PAUSED");

      ApiResponse.success(res, "Savings goal paused", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/goals/:id/resume
   */
  public static async resumeGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await GoalService.updateStatus(userId, id, "ACTIVE");

      ApiResponse.success(res, "Savings goal resumed", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/goals/:id/complete
   */
  public static async completeGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await GoalService.updateStatus(userId, id, "COMPLETED");

      ApiResponse.success(res, "Savings goal marked as completed", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/goals/:id
   */
  public static async deleteGoal(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const result = await GoalService.deleteGoal(userId, id);

      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
