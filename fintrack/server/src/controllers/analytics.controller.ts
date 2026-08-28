import { Request, Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { InsightService } from "../services/insight.service";
import { ApiResponse } from "../utils/apiResponse";
import { analyticsQuerySchema } from "../validators/analytics.validator";

export class AnalyticsController {
  /**
   * GET /api/analytics
   * Consolidated analytics dashboard payload
   */
  public static async getOverview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = analyticsQuerySchema.parse(req.query);
      const data = await AnalyticsService.getAnalyticsOverview(userId, query);

      ApiResponse.success(res, "Analytics overview retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/summary
   */
  public static async getSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = analyticsQuerySchema.parse(req.query);
      const data = await AnalyticsService.getFinancialSummary(userId, query);

      ApiResponse.success(res, "Financial summary retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/trends
   */
  public static async getTrends(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = analyticsQuerySchema.parse(req.query);
      const data = await AnalyticsService.getMonthlyTrends(userId, query);

      ApiResponse.success(res, "Monthly trends retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/categories
   */
  public static async getCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = analyticsQuerySchema.parse(req.query);
      const data = await AnalyticsService.getExpenseByCategory(userId, query);

      ApiResponse.success(res, "Category breakdown retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/payment-methods
   */
  public static async getPaymentMethods(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = analyticsQuerySchema.parse(req.query);
      const data = await AnalyticsService.getPaymentMethodBreakdown(userId, query);

      ApiResponse.success(res, "Payment methods breakdown retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/accounts
   */
  public static async getAccounts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = analyticsQuerySchema.parse(req.query);
      const data = await AnalyticsService.getAccountBreakdown(userId, query);

      ApiResponse.success(res, "Account spending breakdown retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/insights
   */
  public static async getInsights(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = analyticsQuerySchema.parse(req.query);
      const data = await InsightService.evaluateInsights(userId, query);

      ApiResponse.success(res, "Financial insights retrieved successfully", data);
    } catch (error) {
      next(error);
    }
  }
}
