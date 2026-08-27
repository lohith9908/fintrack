import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { User } from "../models";

export class AdminController {
  /**
   * GET /api/admin/overview
   * Protected foundation route for ADMIN role verification
   */
  public static async getOverview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: "ACTIVE" });

      ApiResponse.success(res, "Admin overview retrieved successfully", {
        admin: {
          id: req.user!._id,
          name: req.user!.name,
          email: req.user!.email,
          role: req.user!.role,
        },
        system: {
          status: "OPERATIONAL",
          totalUsers,
          activeUsers,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
