import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { HTTP_STATUS } from "../constants/httpStatus";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Custom ApiError
  if (err instanceof ApiError) {
    logger.warn(`API Error on ${req.method} ${req.originalUrl}: ${err.message}`, {
      statusCode: err.statusCode,
      errors: err.errors,
    });
    ApiResponse.error(res, err.message, err.errors, err.statusCode);
    return;
  }

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    logger.warn(`Validation Error on ${req.method} ${req.originalUrl}`, formattedErrors);
    ApiResponse.error(res, "Validation Error", formattedErrors, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    return;
  }

  // Handle Mongoose CastError (Invalid ObjectId)
  if (err.name === "CastError") {
    ApiResponse.error(res, "Invalid ID format provided", [], HTTP_STATUS.BAD_REQUEST);
    return;
  }

  // Handle Mongoose Duplicate Key Error (11000)
  if ("code" in err && (err as { code?: number }).code === 11000) {
    ApiResponse.error(res, "Duplicate record already exists", [], HTTP_STATUS.CONFLICT);
    return;
  }

  // Unexpected / Internal Server Errors
  logger.error(`Unhandled Server Error on ${req.method} ${req.originalUrl}: ${err.message}`, err);

  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  ApiResponse.error(res, message, [], HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
