import { api } from "./api";
import {
  ICategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryType,
} from "../types/category.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class CategoryService {
  /**
   * Get all categories (system and custom)
   */
  public static async getCategories(
    type?: CategoryType
  ): Promise<ICategory[]> {
    const res = await api.get<ApiResponse<{ categories: ICategory[] }>>(
      "/categories",
      { params: { type } }
    );
    return res.data.data.categories;
  }

  /**
   * Create a new custom category
   */
  public static async createCategory(
    payload: CreateCategoryPayload
  ): Promise<ICategory> {
    const res = await api.post<ApiResponse<{ category: ICategory }>>(
      "/categories",
      payload
    );
    return res.data.data.category;
  }

  /**
   * Update a custom category
   */
  public static async updateCategory(
    id: string,
    payload: UpdateCategoryPayload
  ): Promise<ICategory> {
    const res = await api.patch<ApiResponse<{ category: ICategory }>>(
      `/categories/${id}`,
      payload
    );
    return res.data.data.category;
  }

  /**
   * Delete a custom category
   */
  public static async deleteCategory(id: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<null>>(`/categories/${id}`);
    return { message: res.data.message };
  }
}
