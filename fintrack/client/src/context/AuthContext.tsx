/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { IUser, ProfileUpdatePayload } from "../types/auth.types";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { useTheme } from "../hooks/useTheme";

export interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (data: {
    token: string;
    password: string;
    confirmPassword?: string;
  }) => Promise<string>;
  updateProfile: (data: ProfileUpdatePayload) => Promise<IUser>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }) => Promise<string>;
  deleteAccount: (password: string) => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setTheme } = useTheme();

  // Session restoration on initial application mount
  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await AuthService.getMe();
      setUser(currentUser);
      if (currentUser.theme) {
        setTheme(currentUser.theme);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (data: { email: string; password: string }) => {
    const result = await AuthService.login(data);
    setUser(result.user);
    if (result.user.theme) {
      setTheme(result.user.theme);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
  }) => {
    const result = await AuthService.register(data);
    setUser(result.user);
    if (result.user.theme) {
      setTheme(result.user.theme);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      setUser(null);
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    return await AuthService.forgotPassword(email);
  };

  const resetPassword = async (data: {
    token: string;
    password: string;
    confirmPassword?: string;
  }): Promise<string> => {
    return await AuthService.resetPassword(data);
  };

  const updateProfile = async (data: ProfileUpdatePayload): Promise<IUser> => {
    const updatedUser = await UserService.updateProfile(data);
    setUser(updatedUser);
    if (updatedUser.theme) {
      setTheme(updatedUser.theme);
    }
    return updatedUser;
  };

  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }): Promise<string> => {
    return await UserService.changePassword(data);
  };

  const deleteAccount = async (password: string): Promise<string> => {
    const message = await UserService.deleteAccount(password);
    setUser(null);
    return message;
  };

  const refreshUser = async () => {
    try {
      const currentUser = await AuthService.getMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        deleteAccount,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
