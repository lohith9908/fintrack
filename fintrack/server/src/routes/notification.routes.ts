import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

router.get("/", NotificationController.getNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/read-all", NotificationController.markAllAsRead);
router.post("/mark-all-read", NotificationController.markAllAsRead);
router.delete("/", NotificationController.clearNotifications);
router.post("/", NotificationController.createNotification);

router.patch("/:id/read", NotificationController.markAsRead);
router.patch("/:id", NotificationController.markAsRead);
router.delete("/:id", NotificationController.deleteNotification);

export const notificationRouter = router;
export default router;
