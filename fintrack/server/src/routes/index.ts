import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adminRoutes from "./admin.routes";
import { accountRouter } from "./account.routes";
import { categoryRouter } from "./category.routes";
import { transactionRouter } from "./transaction.routes";
import { dashboardRouter } from "./dashboard.routes";
import { budgetRoutes } from "./budget.routes";
import { recurringRouter } from "./recurring.routes";
import { goalRouter } from "./goal.routes";

const router = Router();

// Mount Health Check endpoint
router.use("/", healthRoutes);

// Mount Authentication routes (/api/auth/...)
router.use("/auth", authRoutes);

// Mount User routes (/api/users/...)
router.use("/users", userRoutes);

// Mount Accounts & Wallets routes (/api/accounts/...)
router.use("/accounts", accountRouter);

// Mount Categories routes (/api/categories/...)
router.use("/categories", categoryRouter);

// Mount Financial Transactions routes (/api/transactions/...)
router.use("/transactions", transactionRouter);

// Mount Dashboard Aggregation & Calculations routes (/api/dashboard/...)
router.use("/dashboard", dashboardRouter);

// Mount Monthly Budgets routes (/api/budgets/...)
router.use("/budgets", budgetRoutes);

// Mount Recurring Transactions routes (/api/recurring-transactions/...)
router.use("/recurring-transactions", recurringRouter);

// Mount Savings Goals routes (/api/goals/...)
router.use("/goals", goalRouter);

// Mount Admin routes (/api/admin/...)
router.use("/admin", adminRoutes);

export default router;
