import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Log info for success/redirects, warn for 4xx, error for 5xx
    const logMeta = { method, url: originalUrl, statusCode, durationMs: duration, ip };

    if (statusCode >= 500) {
      logger.error(`HTTP ${method} ${originalUrl} ${statusCode} [${duration}ms]`, logMeta);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${method} ${originalUrl} ${statusCode} [${duration}ms]`, logMeta);
    } else {
      logger.info(`HTTP ${method} ${originalUrl} ${statusCode} [${duration}ms]`, logMeta);
    }
  });

  next();
};
