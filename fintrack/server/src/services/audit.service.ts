import mongoose, { Types } from "mongoose";
import { AuditLog } from "../models";
import { AdminAuditLogQueryParams } from "../validators/admin.validator";

export interface LogActionParams {
  actorId: string | Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Centralized Audit Log Writer
   * Strictly sanitizes metadata to guarantee that no credentials, tokens, or secrets are ever recorded.
   */
  public static async logAction(params: LogActionParams): Promise<void> {
    try {
      const sanitizedMetadata = this.sanitizeMetadata(params.metadata);

      const actorObjectId =
        typeof params.actorId === "string"
          ? new mongoose.Types.ObjectId(params.actorId)
          : params.actorId;

      await AuditLog.create({
        actor: actorObjectId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: sanitizedMetadata,
        createdAt: new Date(),
      });
    } catch (err) {
      // Non-blocking catch to prevent audit failure from crashing primary business action
      console.error("[AuditService] Failed to record audit log:", err);
    }
  }

  /**
   * Query and list paginated audit logs with search filters
   */
  public static async getAuditLogs(params: AdminAuditLogQueryParams) {
    const page = params.page || 1;
    const limit = params.limit || 30;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (params.actor) {
      if (mongoose.Types.ObjectId.isValid(params.actor)) {
        filter.actor = new mongoose.Types.ObjectId(params.actor);
      }
    }

    if (params.action) {
      filter.action = params.action;
    }

    if (params.targetType) {
      filter.targetType = params.targetType;
    }

    if (params.startDate || params.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (params.startDate) dateFilter.$gte = new Date(params.startDate);
      if (params.endDate) dateFilter.$lte = new Date(params.endDate);
      filter.createdAt = dateFilter;
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actor", "name email role status")
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      logs: logs.map((log) => ({
        id: log._id.toString(),
        actor: log.actor
          ? {
              id: (log.actor as unknown as { _id: Types.ObjectId })._id.toString(),
              name: (log.actor as unknown as { name: string }).name,
              email: (log.actor as unknown as { email: string }).email,
              role: (log.actor as unknown as { role: string }).role,
            }
          : { id: "system", name: "System / Deleted User", email: "system@fintrack.local", role: "ADMIN" },
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get distinct audit log actions & target types for filter dropdowns
   */
  public static async getAuditFilterOptions() {
    const [actions, targetTypes] = await Promise.all([
      AuditLog.distinct("action"),
      AuditLog.distinct("targetType"),
    ]);

    return {
      actions: actions.filter(Boolean),
      targetTypes: targetTypes.filter(Boolean),
    };
  }

  /**
   * Helper: Recursive metadata sanitizer to scrub credentials, tokens, and secrets
   */
  private static sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata || typeof metadata !== "object") return undefined;

    const forbiddenKeyPatterns = [
      /password/i,
      /passwordhash/i,
      /token/i,
      /jwt/i,
      /secret/i,
      /auth/i,
      /cookie/i,
      /creditcard/i,
      /cvv/i,
      /pin/i,
    ];

    const clean: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const isForbidden = forbiddenKeyPatterns.some((pattern) => pattern.test(key));
      if (isForbidden) {
        clean[key] = "[REDACTED]";
      } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        clean[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        clean[key] = value;
      }
    }

    return clean;
  }
}
