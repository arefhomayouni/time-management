
import mongoose from "mongoose";
import app from "./src/app.js";
import { mongoUri, port } from "./src/config/env.js";

let server;

/**
 * Mongo failures reach the console as a driver string ("querySrv EBADRESP
 * _mongodb._tcp...") that says nothing about what to do next. These hints
 * cover the two that actually stop a developer: a network that breaks Node's
 * SRV lookups (while dig/nslookup keep working) and an Atlas IP allowlist that
 * does not include this machine.
 */
const MONGO_FAILURE_HINTS = [
  {
    match: /querySrv|EBADRESP|ESERVFAIL/,
    hint:
      "This network breaks Node's SRV (DNS) lookups for mongodb+srv://. Use the standard mongodb://host:port,host:port URI (Atlas: Connect > Drivers > older driver version), or set MONGODB_URI to a local mongod: mongodb://127.0.0.1:27017/time-management",
  },
  {
    match: /whitelist|Could not connect to any servers/i,
    hint:
      "The database refused the connection. Add this machine's public IP to the Atlas Network Access allowlist, or set MONGODB_URI to a local mongod: mongodb://127.0.0.1:27017/time-management",
  },
];

const explainMongoFailure = (message) =>
  MONGO_FAILURE_HINTS.filter(({ match }) => match.test(message)).map(({ hint }) => hint);

const startServer = async () => {
  try {
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not configured");
    }

    // Connect to MongoDB first
    await mongoose.connect(mongoUri, {
      bufferTimeoutMS: 120000,
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
    });

    console.log("MongoDB connected...");

    // Start the server after successful connection
    server = app.listen(port, () => {
      console.log(`Server is running on port ${port}...`);
    });

    server.on("error", (err) => {
      console.error("Server startup error:", err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error("Application startup failed:", err.message);
    for (const hint of explainMongoFailure(err.message)) {
      console.error(`  -> ${hint}`);
    }
    process.exit(1);
  }
};

const shutdown = (signal) => {
  console.log(`${signal} received, closing server...`);

  const forceExit = setTimeout(() => {
    process.exit(1);
  }, 10000);

  forceExit.unref();

  if (server) {
    server.close(async () => {
      try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected...");
        process.exit(0);
      } catch (err) {
        console.error("Shutdown error:", err.message);
        process.exit(1);
      }
    });
  } else {
    mongoose.disconnect().finally(() => process.exit(0));
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
