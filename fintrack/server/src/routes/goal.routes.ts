import { Router } from "express";
import { GoalController } from "../controllers/goal.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All savings goal routes require authentication
router.use(requireAuth);

router.get("/", GoalController.getGoals);
router.post("/", GoalController.createGoal);
router.get("/:id", GoalController.getGoalById);
router.patch("/:id", GoalController.updateGoal);
router.post("/:id/contribute", GoalController.addContribution);
router.post("/:id/pause", GoalController.pauseGoal);
router.post("/:id/resume", GoalController.resumeGoal);
router.post("/:id/complete", GoalController.completeGoal);
router.delete("/:id", GoalController.deleteGoal);

export const goalRouter = router;
