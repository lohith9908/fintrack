import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../utils/apiResponse";
import { setAuthCookie, clearAuthCookie } from "../utils/cookies";
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../validators/auth.validator";

export class AuthController {
  /**
   * POST /api/auth/register
   */
  public static async register(
    req: Request<unknown, unknown, RegisterInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { user, token } = await AuthService.registerUser(req.body);
      setAuthCookie(res, token);
      ApiResponse.created(res, "Registration successful", { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  public static async login(
    req: Request<unknown, unknown, LoginInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { user, token } = await AuthService.loginUser(req.body);
      setAuthCookie(res, token);
      ApiResponse.success(res, "Login successful", { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  public static async logout(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      clearAuthCookie(res);
      ApiResponse.success(res, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me (Protected)
   */
  public static async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await AuthService.getCurrentUser(req.user!._id.toString());
      ApiResponse.success(res, "Session active", { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  public static async forgotPassword(
    req: Request<unknown, unknown, ForgotPasswordInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  public static async resetPassword(
    req: Request<unknown, unknown, ResetPasswordInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.resetPassword(req.body);
      clearAuthCookie(res);
      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
