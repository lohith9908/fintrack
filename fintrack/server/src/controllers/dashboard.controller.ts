import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard.service";
import { ApiResponse } from "../utils/apiResponse";
import { dashboardQuerySchema } from "../validators/dashboard.validator";

export class DashboardController {
  /**
   * GET /api/dashboard/overview
   */
  public static async getOverview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validatedQuery = dashboardQuerySchema.parse(req.query);

      const overview = await DashboardService.getOverview(
        userId,
        validatedQuery
      );

      ApiResponse.success(res, "Dashboard overview retrieved successfully", overview);
    } catch (error) {
      next(error);
    }
  }
}
