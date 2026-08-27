import { Router } from "express";
import { RecurringController } from "../controllers/recurring.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All recurring routes require authentication
router.use(requireAuth);

router.get("/", RecurringController.getRecurringRules);
router.post("/", RecurringController.createRecurringRule);
router.post("/process-due", RecurringController.processDue);
router.get("/:id", RecurringController.getRecurringRuleById);
router.patch("/:id", RecurringController.updateRecurringRule);
router.post("/:id/pause", RecurringController.pauseRecurringRule);
router.post("/:id/resume", RecurringController.resumeRecurringRule);
router.delete("/:id", RecurringController.deleteRecurringRule);

export const recurringRouter = router;
