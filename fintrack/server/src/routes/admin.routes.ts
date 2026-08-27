import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(requireAuth, requireAdmin);

// Foundation Admin Routes
router.get("/overview", AdminController.getOverview);

export default router;
