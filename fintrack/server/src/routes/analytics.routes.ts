import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

router.get("/", AnalyticsController.getOverview);
router.get("/summary", AnalyticsController.getSummary);
router.get("/trends", AnalyticsController.getTrends);
router.get("/categories", AnalyticsController.getCategories);
router.get("/payment-methods", AnalyticsController.getPaymentMethods);
router.get("/accounts", AnalyticsController.getAccounts);
router.get("/insights", AnalyticsController.getInsights);

export const analyticsRouter = router;
export default router;
