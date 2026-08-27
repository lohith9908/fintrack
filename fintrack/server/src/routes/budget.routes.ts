import { Router } from "express";
import { BudgetController } from "../controllers/budget.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All budget routes require user authentication
router.use(requireAuth);

router.get("/", BudgetController.getBudgets);
router.post("/", BudgetController.createBudget);
router.get("/:id", BudgetController.getBudgetById);
router.patch("/:id", BudgetController.updateBudget);
router.delete("/:id", BudgetController.deleteBudget);

export const budgetRoutes = router;
