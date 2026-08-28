import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(requireAuth, requireAdmin);

// 1. Admin Platform Overview
router.get("/overview", AdminController.getOverview);

// 2. User Management
router.get("/users", AdminController.getUsers);
router.get("/users/:id", AdminController.getUserById);
router.patch("/users/:id/status", AdminController.updateUserStatus);
router.patch("/users/:id/role", AdminController.updateUserRole);

// 3. System Category Management
router.get("/categories", AdminController.getSystemCategories);
router.post("/categories", AdminController.createSystemCategory);
router.patch("/categories/:id", AdminController.updateSystemCategory);
router.delete("/categories/:id", AdminController.deleteOrDisableCategory);

// 4. Audit Logs
router.get("/audit-logs", AdminController.getAuditLogs);
router.get("/audit-logs/filters", AdminController.getAuditFilterOptions);

// 5. System Settings
router.get("/settings", AdminController.getSystemSettings);
router.put("/settings", AdminController.updateSystemSettingsBatch);
router.patch("/settings/:key", AdminController.updateSystemSetting);
router.post("/settings/reset", AdminController.resetSystemSettings);

export default router;
