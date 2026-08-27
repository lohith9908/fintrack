import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { ApiResponse } from "../utils/apiResponse";
import { clearAuthCookie } from "../utils/cookies";
import {
  UpdateProfileInput,
  ChangePasswordInput,
  DeleteAccountInput,
} from "../validators/user.validator";

export class UserController {
  /**
   * GET /api/users/me
   */
  public static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await UserService.getProfile(req.user!._id.toString());
      ApiResponse.success(res, "Profile retrieved successfully", { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/profile
   */
  public static async updateProfile(
    req: Request<unknown, unknown, UpdateProfileInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await UserService.updateProfile(
        req.user!._id.toString(),
        req.body
      );
      ApiResponse.success(res, "Profile updated successfully", { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/change-password
   */
  public static async changePassword(
    req: Request<unknown, unknown, ChangePasswordInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await UserService.changePassword(
        req.user!._id.toString(),
        req.body
      );
      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/me
   */
  public static async deleteAccount(
    req: Request<unknown, unknown, DeleteAccountInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await UserService.deleteAccount(
        req.user!._id.toString(),
        req.body
      );
      clearAuthCookie(res);
      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
