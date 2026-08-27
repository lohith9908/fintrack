import { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE_NAME } from "../utils/cookies";
import { verifyToken } from "../utils/jwt";
import { User } from "../models";
import { UserRole } from "../types/database.types";
import { UnauthorizedError, ForbiddenError } from "../utils/apiError";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    } else if (req.signedCookies && req.signedCookies[AUTH_COOKIE_NAME]) {
      token = req.signedCookies[AUTH_COOKIE_NAME];
    }

    // 2. Fallback to Authorization Bearer header if provided
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new UnauthorizedError("Authentication required. Please log in.");
    }

    // 3. Verify JWT signature and expiration
    const decoded = verifyToken(token);

    // 4. Fetch active user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError("Session is invalid. User not found.");
    }

    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new ForbiddenError("Account is inactive or suspended.");
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Enforces that the authenticated user has one of the allowed roles
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required. Please log in.");
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        "Access denied. You do not have permission to access this resource."
      );
    }

    next();
  };
};

/**
 * Convenience middleware for ADMIN-only protected routes
 */
export const requireAdmin = requireRole("ADMIN");
