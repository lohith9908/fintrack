import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const PORT = env.PORT || 5000;

const startServer = (): void => {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`🚀 FinTrack Server listening on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`🌐 Health check available at http://localhost:${PORT}/api/health`);
    });

    const shutdown = (signal: string): void => {
      logger.info(`${signal} received. Initiating graceful shutdown...`);
      server.close(() => {
        logger.info("HTTP server closed. Exiting process.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
