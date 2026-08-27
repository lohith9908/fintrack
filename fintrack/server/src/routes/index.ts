import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";

const router = Router();

// Mount Health Check endpoint
router.use("/", healthRoutes);

// Mount Authentication routes (/api/auth/...)
router.use("/auth", authRoutes);

// Mount Admin routes (/api/admin/...)
router.use("/admin", adminRoutes);

export default router;
