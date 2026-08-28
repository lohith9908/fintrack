import { api } from "./api";
import {
  NotificationItem,
  NotificationListResponse,
  NotificationFilterParams,
} from "../types/notification.types";

export const NotificationService = {
  /**
   * Get paginated notifications list with optional filters
   */
  async getNotifications(params?: NotificationFilterParams): Promise<NotificationListResponse> {
    const res = await api.get<{ success: boolean; data: NotificationListResponse }>(
      "/notifications",
      { params }
    );
    return res.data.data;
  },

  /**
   * Get unread notifications count for header badge
   */
  async getUnreadCount(): Promise<number> {
    const res = await api.get<{ success: boolean; data: { unreadCount: number } }>(
      "/notifications/unread-count"
    );
    return res.data.data.unreadCount;
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(id: string): Promise<NotificationItem> {
    const res = await api.patch<{ success: boolean; data: NotificationItem }>(
      `/notifications/${id}/read`
    );
    return res.data.data;
  },

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const res = await api.patch<{ success: boolean; data: { modifiedCount: number } }>(
      "/notifications/read-all"
    );
    return res.data.data;
  },

  /**
   * Delete a single notification
   */
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  /**
   * Clear notifications (read only or all)
   */
  async clearNotifications(readOnly = true): Promise<{ deletedCount: number }> {
    const res = await api.delete<{ success: boolean; data: { deletedCount: number } }>(
      "/notifications",
      { params: { readOnly } }
    );
    return res.data.data;
  },
};
