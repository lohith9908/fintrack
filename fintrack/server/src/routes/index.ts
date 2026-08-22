import { Router } from "express";
import healthRoutes from "./health.routes";

const router = Router();

// Mount Health Check endpoint
router.use("/", healthRoutes);

export default router;
