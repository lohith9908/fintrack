import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Dashboard routes require authentication
router.use(requireAuth);

router.get("/overview", DashboardController.getOverview);
router.get("/", DashboardController.getOverview);

export const dashboardRouter = router;
