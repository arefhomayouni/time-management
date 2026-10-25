import { corsOrigins, isProduction } from "../config/env.js";

/**
 * CORS, on our own terms.
 *
 * The previous setup passed every request through the `cors` package and threw
 * an Error when the Origin was not in CORS_ORIGINS. That error reached the
 * generic error handler, so the browser got a 500 with no
 * Access-Control-Allow-Origin header - which Chrome reports as a vague CORS
 * failure with no way to tell "origin not allowed" from "server is down".
 *
 * Here a blocked origin gets an explicit 403 JSON body (still without the ACAO
 * header, which is what makes the browser block it) and a single log line that
 * names the origin and the fix.
 */

const ALLOWED_METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

/** Echo whatever the preflight asks for; Authorization is the one we require. */
const DEFAULT_ALLOWED_HEADERS = "Content-Type, Authorization";

/** Origins compare without a trailing slash and case-insensitively. */
const normalizeOrigin = (origin) => origin.trim().replace(/\/+$/, "").toLowerCase();

const isLoopbackOrLan = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".local") ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
};

/**
 * - No Origin header (curl, server-to-server, same-origin navigation) -> allow.
 * - No CORS_ORIGINS configured (local development) -> allow any origin.
 * - Otherwise the origin must be listed. During development, loopback and
 *   private-network origins are also allowed, so testing the PWA from a phone
 *   against `http://192.168.x.x:3001` does not look like a CORS bug.
 */
export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (!corsOrigins.length) return true;
  if (corsOrigins.includes(normalizeOrigin(origin))) return true;
  return !isProduction && isLoopbackOrLan(origin);
};

/** Origins already reported, so one misconfigured client does not flood logs. */
const warned = new Set();

export const cors = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin)) {
    // Echo the exact origin instead of "*" so the response can never be
    // reused for a different origin out of an intermediary cache.
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");

    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS.join(", "));
      res.setHeader(
        "Access-Control-Allow-Headers",
        req.headers["access-control-request-headers"] || DEFAULT_ALLOWED_HEADERS
      );
      res.setHeader("Access-Control-Max-Age", "86400");
      return res.status(204).end();
    }

    return next();
  }

  if (origin) {
    // A 403 is origin-dependent too; without Vary a cache could replay it to
    // an origin that is actually allowed.
    res.setHeader("Vary", "Origin");
    if (!warned.has(origin)) {
      warned.add(origin);
      console.warn(
        `[cors] blocked origin ${origin}. Add it to CORS_ORIGINS (comma-separated, e.g. CORS_ORIGINS=${origin}) and restart the API.`
      );
    }
    // Deliberately no Access-Control-Allow-Origin: the browser must block this
    // response. The body still explains the problem to a curious developer.
    return res.status(403).json({
      success: false,
      code: "CORS_BLOCKED",
      message: "This origin is not allowed to call the API",
    });
  }

  return next();
};
