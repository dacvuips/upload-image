import config from "config";
import startExpressApp from "./express";
import logger from "./helpers/logger";
import { MainConnection } from "./helpers/mongo";

const app = startExpressApp();
const port = process.env.PORT || config.get<number>("port") || 3000;

async function startServer() {
  try {
    // Wait for database connection
    await new Promise<void>((resolve) => {
      if (MainConnection.readyState === 1) {
        resolve();
      } else {
        MainConnection.once("connected", () => resolve());
      }
    });

    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
