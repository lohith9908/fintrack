import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator";
import { TransactionType } from "../types/database.types";

export class CategoryController {
  /**
   * GET /api/categories
   */
  public static async getCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const type = req.query.type as TransactionType | undefined;

      const categories = await CategoryService.getCategories(userId, type);

      ApiResponse.success(res, "Categories retrieved successfully", { categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/categories
   */
  public static async createCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const validatedData = createCategorySchema.parse(req.body);

      const category = await CategoryService.createCategory(
        userId,
        validatedData
      );

      ApiResponse.created(res, "Custom category created successfully", { category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/categories/:id
   */
  public static async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const categoryId = req.params.id;
      const validatedData = updateCategorySchema.parse(req.body);

      const category = await CategoryService.updateCategory(
        userId,
        categoryId,
        validatedData
      );

      ApiResponse.success(res, "Category updated successfully", { category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/categories/:id
   */
  public static async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const categoryId = req.params.id;

      const result = await CategoryService.deleteCategory(userId, categoryId);

      ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}
