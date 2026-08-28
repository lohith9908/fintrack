import axios, { AxiosError } from "axios";

const getBaseUrl = (): string => {
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch {
    // Fallback for non-Vite ESM environments
  }
  if (typeof process !== "undefined" && process.env && process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  return "/api";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Required for HTTP-only cookie exchange
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: unknown[];
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const serverError = (error as AxiosError<ApiErrorResponse>).response?.data;
    if (serverError?.message) {
      return serverError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
};
