import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: "/api",
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
