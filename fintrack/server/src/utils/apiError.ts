import { HTTP_STATUS, HttpStatusCode } from "../constants/httpStatus";

export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly errors: unknown[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: HttpStatusCode,
    message: string,
    errors: unknown[] = [],
    isOperational = true,
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request", errors: unknown[] = []) {
    super(HTTP_STATUS.BAD_REQUEST, message, errors);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", errors: unknown[] = []) {
    super(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", errors: unknown[] = []) {
    super(HTTP_STATUS.FORBIDDEN, message, errors);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource Not Found", errors: unknown[] = []) {
    super(HTTP_STATUS.NOT_FOUND, message, errors);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict", errors: unknown[] = []) {
    super(HTTP_STATUS.CONFLICT, message, errors);
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation Error", errors: unknown[] = []) {
    super(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal Server Error", errors: unknown[] = []) {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors, false);
  }
}
