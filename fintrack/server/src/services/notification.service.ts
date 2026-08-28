import mongoose from "mongoose";
import { Notification, User } from "../models";
import { INotification, NotificationType, NotificationSeverity } from "../types/database.types";
import { GetNotificationsQueryInput } from "../validators/notification.validator";
import { NotFoundError } from "../utils/apiError";

export interface CreateNotificationDTO {
  type: NotificationType;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  metadata?: Record<string, unknown>;
}

export interface NotificationListResult {
  notifications: INotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class NotificationService {
  /**
   * Determine if user has enabled notifications of this type per User.notificationPreferences
   */
  private static async isNotificationEnabled(
    userId: string | mongoose.Types.ObjectId,
    type: NotificationType
  ): Promise<boolean> {
    const user = await User.findById(userId).select("notificationPreferences");
    if (!user || !user.notificationPreferences) {
      return true; // Default to true if user preferences not found
    }

    const prefs = user.notificationPreferences;
    switch (type) {
      case "BUDGET_ALERT":
      case "BUDGET_EXCEEDED":
        return prefs.budgetAlerts !== false;
      case "RECURRING_PAYMENT":
        return prefs.recurringPaymentAlerts !== false;
      case "GOAL_MILESTONE":
        return prefs.goalAlerts !== false;
      case "FINANCIAL_INSIGHT":
        return prefs.financialInsights !== false;
      case "SYSTEM":
        return prefs.systemNotifications !== false;
      default:
        return true;
    }
  }

  /**
   * Create a notification respecting user preferences and idempotency
   */
  public static async createNotification(
    userId: string | mongoose.Types.ObjectId,
    data: CreateNotificationDTO
  ): Promise<INotification | null> {
    const enabled = await this.isNotificationEnabled(userId, data.type);
    if (!enabled) {
      return null;
    }

    const notif = await Notification.create({
      user: new mongoose.Types.ObjectId(userId),
      type: data.type,
      title: data.title,
      message: data.message,
      severity: data.severity || "INFO",
      read: false,
      metadata: data.metadata,
    });

    return notif;
  }

  /**
   * Query paginated user notifications with filters and unread count
   */
  public static async getNotifications(
    userId: string,
    query: GetNotificationsQueryInput
  ): Promise<NotificationListResult> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: Record<string, unknown> = { user: userObjectId };

    if (query.read !== undefined) {
      filter.read = query.read;
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.severity) {
      filter.severity = query.severity;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userObjectId, read: false }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      notifications: notifications as unknown as INotification[],
      total,
      unreadCount,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get unread notifications count for header badge
   */
  public static async getUnreadCount(userId: string): Promise<number> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Notification.countDocuments({ user: userObjectId, read: false });
  }

  /**
   * Mark a specific notification as read
   */
  public static async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const notifObjectId = new mongoose.Types.ObjectId(notificationId);

    const notification = await Notification.findOneAndUpdate(
      { _id: notifObjectId, user: userObjectId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError("Notification not found or unauthorized.");
    }

    return notification;
  }

  /**
   * Mark all unread notifications for a user as read
   */
  public static async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Notification.updateMany(
      { user: userObjectId, read: false },
      { $set: { read: true } }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a single notification
   */
  public static async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const notifObjectId = new mongoose.Types.ObjectId(notificationId);

    const result = await Notification.deleteOne({ _id: notifObjectId, user: userObjectId });

    if (result.deletedCount === 0) {
      throw new NotFoundError("Notification not found or unauthorized.");
    }
  }

  /**
   * Clear all read notifications (or all notifications)
   */
  public static async clearNotifications(
    userId: string,
    readOnly = true
  ): Promise<{ deletedCount: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter: Record<string, unknown> = { user: userObjectId };

    if (readOnly) {
      filter.read = true;
    }

    const result = await Notification.deleteMany(filter);
    return { deletedCount: result.deletedCount };
  }
}
