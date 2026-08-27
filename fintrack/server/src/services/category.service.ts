import mongoose from "mongoose";
import { Category, Transaction } from "../models";
import { ICategory, TransactionType } from "../types/database.types";
import { CreateCategoryInput, UpdateCategoryInput } from "../validators/category.validator";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} from "../utils/apiError";

export class CategoryService {
  /**
   * Get all categories accessible to user (System + User Custom Categories)
   */
  public static async getCategories(
    userId: string,
    type?: TransactionType
  ): Promise<ICategory[]> {
    const query: Record<string, unknown> = {
      $or: [{ isSystem: true }, { user: userId, isSystem: false }],
      isActive: true,
    };

    if (type) {
      query.type = type;
    }

    // Sort system categories first, then custom categories alphabetically
    const categories = await Category.find(query).sort({
      isSystem: -1,
      name: 1,
    });

    return categories;
  }

  /**
   * Create a new custom category for a user
   */
  public static async createCategory(
    userId: string,
    input: CreateCategoryInput
  ): Promise<ICategory> {
    const normalizedName = input.name.trim();

    // Check collision against system categories AND user's existing categories of the same type
    const existing = await Category.findOne({
      type: input.type,
      name: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      $or: [{ isSystem: true }, { user: userId }],
    });

    if (existing) {
      throw new ConflictError(
        `A category named "${normalizedName}" already exists for ${input.type.toLowerCase()} transactions.`
      );
    }

    const category = await Category.create({
      user: userId,
      name: normalizedName,
      type: input.type,
      icon: input.icon || (input.type === "INCOME" ? "Briefcase" : "Tag"),
      color: input.color || (input.type === "INCOME" ? "#10B981" : "#EF4444"),
      isSystem: false,
      isActive: true,
    });

    return category;
  }

  /**
   * Update an existing custom category
   */
  public static async updateCategory(
    userId: string,
    categoryId: string,
    input: UpdateCategoryInput
  ): Promise<ICategory> {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestError("Invalid category ID format.");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    // Protect system categories from user modification
    if (category.isSystem) {
      throw new ForbiddenError("System categories are protected and cannot be modified.");
    }

    // Verify ownership
    if (category.user?.toString() !== userId) {
      throw new ForbiddenError("You do not have permission to modify this category.");
    }

    if (input.name && input.name.trim() !== category.name) {
      const normalizedName = input.name.trim();
      const existing = await Category.findOne({
        _id: { $ne: categoryId },
        type: category.type,
        name: { $regex: new RegExp(`^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        $or: [{ isSystem: true }, { user: userId }],
      });

      if (existing) {
        throw new ConflictError(`Another category named "${normalizedName}" already exists.`);
      }
      category.name = normalizedName;
    }

    if (input.icon) category.icon = input.icon.trim();
    if (input.color) category.color = input.color.trim();
    if (input.isActive !== undefined) category.isActive = input.isActive;

    await category.save();
    return category;
  }

  /**
   * Delete or soft-disable a custom category
   */
  public static async deleteCategory(
    userId: string,
    categoryId: string
  ): Promise<{ message: string }> {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestError("Invalid category ID format.");
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    // Protect system categories
    if (category.isSystem) {
      throw new ForbiddenError("System categories are protected and cannot be deleted.");
    }

    // Verify ownership
    if (category.user?.toString() !== userId) {
      throw new ForbiddenError("You do not have permission to delete this category.");
    }

    // Check if category is used in transactions
    const transactionCount = await Transaction.countDocuments({
      user: userId,
      category: categoryId,
    });

    if (transactionCount > 0) {
      category.isActive = false;
      await category.save();
      return { message: "Category is in use by recorded transactions. It has been deactivated." };
    }

    await Category.deleteOne({ _id: categoryId });
    return { message: "Custom category deleted successfully." };
  }
}
