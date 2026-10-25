import app from "./src/app.js";
import { port } from "./src/config/env.js";

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});

/**
 * Shut down cleanly on the signals a container/orchestrator sends, so
 * in-flight requests finish instead of being cut off.
 */
const shutdown = (signal) => {
  console.log(`${signal} received, closing server...`);
  server.close(() => process.exit(0));
  // Do not hang forever on a stuck connection.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
