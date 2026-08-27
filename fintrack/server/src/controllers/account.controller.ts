import { Request, Response, NextFunction } from "express";
import { AccountService } from "../services/account.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  createAccountSchema,
  updateAccountSchema,
} from "../validators/account.validator";
import { AccountType, AccountStatus } from "../types/database.types";

export class AccountController {
  /**
   * GET /api/accounts
   */
  public static async getAccounts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const type = req.query.type as AccountType | undefined;
      const status = req.query.status as AccountStatus | undefined;

      const result = await AccountService.getAccounts(userId, { type, status });

      ApiResponse.success(res, "Accounts retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/accounts
   */
  public static async createAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validatedData = createAccountSchema.parse(req.body);

      const account = await AccountService.createAccount(userId, validatedData);

      ApiResponse.created(res, "Account created successfully", { account });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/accounts/:id
   */
  public static async getAccountById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const accountId = req.params.id;

      const account = await AccountService.getAccountById(userId, accountId);

      ApiResponse.success(res, "Account details retrieved", { account });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/accounts/:id
   */
  public static async updateAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const accountId = req.params.id;
      const validatedData = updateAccountSchema.parse(req.body);

      const account = await AccountService.updateAccount(
        userId,
        accountId,
        validatedData
      );

      ApiResponse.success(res, "Account updated successfully", { account });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/accounts/:id/deactivate
   */
  public static async deactivateAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const accountId = req.params.id;
      const isArchive = req.body?.archive === true || req.query.archive === "true";

      const account = await AccountService.deactivateAccount(
        userId,
        accountId,
        isArchive
      );

      ApiResponse.success(
        res,
        `Account ${isArchive ? "archived" : "deactivated"} successfully`,
        { account }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/accounts/:id
   */
  public static async deleteAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const accountId = req.params.id;

      const result = await AccountService.deleteAccount(userId, accountId);

      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
