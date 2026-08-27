export type CategoryType = "INCOME" | "EXPENSE";

export interface ICategory {
  _id: string;
  user?: string | null;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}
