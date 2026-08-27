import { api } from "./api";
import {
  IAccount,
  AccountsSummary,
  CreateAccountPayload,
  UpdateAccountPayload,
  AccountType,
  AccountStatus,
} from "../types/account.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class AccountService {
  /**
   * Fetch all accounts and computed summary statistics
   */
  public static async getAccounts(params?: {
    type?: AccountType;
    status?: AccountStatus;
  }): Promise<{ accounts: IAccount[]; summary: AccountsSummary }> {
    const res = await api.get<ApiResponse<{ accounts: IAccount[]; summary: AccountsSummary }>>(
      "/accounts",
      { params }
    );
    return res.data.data;
  }

  /**
   * Create a new account / wallet
   */
  public static async createAccount(
    payload: CreateAccountPayload
  ): Promise<IAccount> {
    const res = await api.post<ApiResponse<{ account: IAccount }>>(
      "/accounts",
      payload
    );
    return res.data.data.account;
  }

  /**
   * Get single account details
   */
  public static async getAccountById(id: string): Promise<IAccount> {
    const res = await api.get<ApiResponse<{ account: IAccount }>>(
      `/accounts/${id}`
    );
    return res.data.data.account;
  }

  /**
   * Update an existing account
   */
  public static async updateAccount(
    id: string,
    payload: UpdateAccountPayload
  ): Promise<IAccount> {
    const res = await api.patch<ApiResponse<{ account: IAccount }>>(
      `/accounts/${id}`,
      payload
    );
    return res.data.data.account;
  }

  /**
   * Deactivate or Archive an account
   */
  public static async deactivateAccount(
    id: string,
    archive = false
  ): Promise<IAccount> {
    const res = await api.post<ApiResponse<{ account: IAccount }>>(
      `/accounts/${id}/deactivate`,
      { archive }
    );
    return res.data.data.account;
  }

  /**
   * Delete an account permanently
   */
  public static async deleteAccount(id: string): Promise<{ message: string }> {
    const res = await api.delete<ApiResponse<null>>(`/accounts/${id}`);
    return { message: res.data.message };
  }
}
