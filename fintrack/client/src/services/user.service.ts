import { api } from "./api";
import { AuthResponse, IUser, ProfileUpdatePayload } from "../types/auth.types";

export class UserService {
  /**
   * Get authenticated user profile
   */
  public static async getProfile(): Promise<IUser> {
    const response = await api.get<AuthResponse>("/users/me");
    return response.data.data!.user!;
  }

  /**
   * Update profile information, preferences, and display settings
   */
  public static async updateProfile(data: ProfileUpdatePayload): Promise<IUser> {
    const response = await api.patch<AuthResponse>("/users/profile", data);
    return response.data.data!.user!;
  }

  /**
   * Change password with current password verification
   */
  public static async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }): Promise<string> {
    const response = await api.post<AuthResponse>("/users/change-password", data);
    return response.data.message;
  }

  /**
   * Delete account permanently with password confirmation
   */
  public static async deleteAccount(password: string): Promise<string> {
    const response = await api.delete<AuthResponse>("/users/me", { data: { password } });
    return response.data.message;
  }
}
