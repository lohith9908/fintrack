import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All transaction endpoints require authentication
router.use(requireAuth);

router.get("/", TransactionController.getTransactions);
router.post("/", TransactionController.createTransaction);
router.get("/:id", TransactionController.getTransactionById);
router.patch("/:id", TransactionController.updateTransaction);
router.delete("/:id", TransactionController.deleteTransaction);

export const transactionRouter = router;
