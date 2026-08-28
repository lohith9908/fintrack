import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/notification.service";
import { ApiResponse } from "../utils/apiResponse";
import {
  getNotificationsQuerySchema,
  createNotificationSchema,
} from "../validators/notification.validator";

export class NotificationController {
  /**
   * GET /api/notifications
   */
  public static async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const query = getNotificationsQuerySchema.parse(req.query);
      const result = await NotificationService.getNotifications(userId, query);

      ApiResponse.success(res, "Notifications retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   */
  public static async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const count = await NotificationService.getUnreadCount(userId);

      ApiResponse.success(res, "Unread count retrieved successfully", { unreadCount: count });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * PATCH /api/notifications/:id
   */
  public static async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      const notification = await NotificationService.markAsRead(userId, id);

      ApiResponse.success(res, "Notification marked as read", notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * POST /api/notifications/mark-all-read
   */
  public static async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const result = await NotificationService.markAllAsRead(userId);

      ApiResponse.success(res, "All notifications marked as read", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  public static async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { id } = req.params;
      await NotificationService.deleteNotification(userId, id);

      ApiResponse.success(res, "Notification deleted successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications
   */
  public static async clearNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const readOnly = req.query.readOnly !== "false";
      const result = await NotificationService.clearNotifications(userId, readOnly);

      ApiResponse.success(res, "Notifications cleared successfully", result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications (Internal/Manual creation if needed)
   */
  public static async createNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const input = createNotificationSchema.parse(req.body);
      const notification = await NotificationService.createNotification(userId, input);

      if (!notification) {
        ApiResponse.success(res, "Notification skipped due to user preferences", null);
        return;
      }

      ApiResponse.created(res, "Notification created successfully", notification);
    } catch (error) {
      next(error);
    }
  }
}
