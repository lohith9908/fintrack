import { Router, Request, Response } from "express";
import { ApiResponse } from "../utils/apiResponse";
import { isDatabaseConnected } from "../config/db";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  const dbStatus = isDatabaseConnected() ? "connected" : "disconnected";

  ApiResponse.success(res, "API is healthy", {
    status: "ok",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
