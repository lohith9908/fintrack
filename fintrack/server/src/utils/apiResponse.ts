import { Response } from "express";
import { HTTP_STATUS, HttpStatusCode } from "../constants/httpStatus";

export interface ApiResponseData<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

export class ApiResponse {
  public static success<T>(
    res: Response,
    message = "Success",
    data?: T,
    statusCode: HttpStatusCode = HTTP_STATUS.OK
  ): Response {
    const responsePayload: ApiResponseData<T> = {
      success: true,
      message,
      ...(data !== undefined ? { data } : {}),
    };
    return res.status(statusCode).json(responsePayload);
  }

  public static created<T>(
    res: Response,
    message = "Created successfully",
    data?: T
  ): Response {
    return this.success(res, message, data, HTTP_STATUS.CREATED);
  }

  public static error(
    res: Response,
    message = "Error",
    errors: unknown[] = [],
    statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR
  ): Response {
    const responsePayload: ApiResponseData = {
      success: false,
      message,
      ...(errors.length > 0 ? { errors } : {}),
    };
    return res.status(statusCode).json(responsePayload);
  }
}
