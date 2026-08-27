import { api } from "./api";
import { AuthResponse, IUser } from "../types/auth.types";

export class AuthService {
  /**
   * Register new user account
   */
  public static async register(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }): Promise<{ user: IUser; message: string }> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return {
      user: response.data.data!.user!,
      message: response.data.message,
    };
  }

  /**
   * Login with email and password
   */
  public static async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: IUser; message: string }> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return {
      user: response.data.data!.user!,
      message: response.data.message,
    };
  }

  /**
   * Logout user and clear session cookie
   */
  public static async logout(): Promise<void> {
    await api.post<AuthResponse>("/auth/logout");
  }

  /**
   * Retrieve currently authenticated user session
   */
  public static async getMe(): Promise<IUser> {
    const response = await api.get<AuthResponse>("/auth/me");
    return response.data.data!.user!;
  }

  /**
   * Request password reset token email
   */
  public static async forgotPassword(email: string): Promise<string> {
    const response = await api.post<AuthResponse>("/auth/forgot-password", { email });
    return response.data.message;
  }

  /**
   * Reset password using token
   */
  public static async resetPassword(data: {
    token: string;
    password: string;
    confirmPassword?: string;
  }): Promise<string> {
    const response = await api.post<AuthResponse>("/auth/reset-password", data);
    return response.data.message;
  }
}
