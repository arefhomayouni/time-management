/**
 * Terminal middleware: every response from the API is JSON, and internal
 * details (Mongo error text, stack traces, driver codes) never reach the
 * client in production.
 */

/** Unknown route -> JSON 404 instead of Express' HTML error page. */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const isProduction = process.env.NODE_ENV === "production";

/**
 * Translates the errors this API actually produces into (status, message)
 * pairs, so a duplicate email is a clear 409 instead of a raw 500 carrying the
 * MongoDB index name.
 */
export const errorHandler = (err, req, res, next) => {
  // Headers already flushed: hand back to Express, it will close the socket.
  if (res.headersSent) return next(err);

  let status = err.statusCode || err.status || 500;
  let message = err.message || "Something went wrong";

  // Duplicate key (unique index on email / username).
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    message = field
      ? `That ${field} is already registered`
      : "That record already exists";
  }

  // Mongoose schema validation.
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(", ") || "Validation failed";
  }

  // Malformed ObjectId in a path/query parameter.
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid value for ${err.path}`;
  }

  // JWT failures that escaped a middleware.
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Token is invalid or expired";
  }

  if (status >= 500) {
    console.error("[api] unhandled error:", err);
  }

  res.status(status).json({
    success: false,
    message:
      status >= 500 && isProduction ? "Internal server error" : message,
    ...(status >= 500 && !isProduction && err.stack ? { stack: err.stack } : {}),
  });
};
