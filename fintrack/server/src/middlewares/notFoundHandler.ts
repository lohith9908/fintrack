import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { HTTP_STATUS } from "../constants/httpStatus";

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  ApiResponse.error(
    res,
    `Resource not found: ${req.method} ${req.originalUrl}`,
    [],
    HTTP_STATUS.NOT_FOUND
  );
};
