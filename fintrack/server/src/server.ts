import { app } from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { logger } from "./utils/logger";

const PORT = env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Establish database connection
    await connectDatabase();

    // Start HTTP Server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 FinTrack Server listening on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`🌐 Health check available at http://localhost:${PORT}/api/health`);
    });

    // Graceful Shutdown Handler
    let isShuttingDown = false;

    const shutdown = async (signal: string): Promise<void> => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      logger.info(`🛑 ${signal} received. Initiating graceful shutdown...`);

      server.close(async () => {
        logger.info("🔌 HTTP server stopped.");
        await disconnectDatabase();
        logger.info("👋 Graceful shutdown complete. Exiting.");
        process.exit(0);
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        logger.error("⚠️ Graceful shutdown timed out after 10s. Force exiting.");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
