import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { mongoUri, corsOrigins, isProduction } from "./config/env.js";
import userRoutes from "./routes/userRoutes.js";
import timeRoutes from "./routes/timeRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import { specs } from "./config/swagger.js";
import { notFound, errorHandler } from "./middlewares/error.js";

const app = express();

// Do not advertise the stack.
app.disable("x-powered-by");

/**
 * CORS. With CORS_ORIGINS set, only those origins are allowed (requests with
 * no Origin header - curl, server-to-server - still pass). Without it the
 * default is permissive, which is what local development needs.
 */
app.use(
  cors(
    corsOrigins.length
      ? {
          origin(origin, callback) {
            if (!origin || corsOrigins.includes(origin)) return callback(null, true);
            return callback(new Error(`Origin ${origin} is not allowed by CORS`));
          },
        }
      : {}
  )
);

app.use(express.json({ limit: "100kb" }));

// Swagger Documentation
const swaggerOptions = {
  customCss: `
    body { background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .swagger-ui .topbar { background-color: #2c3e50; color: #fff; }
    .swagger-ui .info .title { color: #2c3e50; font-weight: bold; }
    .swagger-ui .opblock { border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 15px; }
    .swagger-ui .opblock-summary-method { border-radius: 4px; font-weight: bold; }
    .swagger-ui .opblock-summary-description { font-size: 14px; }
    .swagger-ui .opblock-summary-tag { background: #3498db; color: white; border-radius: 4px; padding: 2px 8px; }
    .swagger-ui .btn-execute { background-color: #27ae60; color: white; border-radius: 4px; border: none; }
    .swagger-ui .btn-execute:hover { background-color: #2ecc71; }
  `,
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Database connection. A failure is logged loudly but does not kill the
// process: /health reports `database: "disconnected"` so a platform probe can
// see the problem instead of a silent crash loop.
mongoose
  .connect(mongoUri, {
    bufferTimeoutMS: 120000,
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.error("MongoDB connection error:", err.message));

const DB_STATES = ["disconnected", "connected", "connecting", "disconnecting"];

app.get("/health", (req, res) => {
  const state = DB_STATES[mongoose.connection.readyState] || "unknown";
  res.status(200).json({
    status: "ok",
    database: state,
    uptime: Math.round(process.uptime()),
    environment: isProduction ? "production" : "development",
  });
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "Time Management API is running..." });
});

app.use("/api/users", userRoutes);
app.use("/api/time", timeRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/search", searchRoutes);

// Anything unmatched is a JSON 404, and every thrown error becomes JSON too.
app.use(notFound);
app.use(errorHandler);

export default app;
