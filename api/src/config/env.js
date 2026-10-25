import dotenv from "dotenv";

/**
 * Single place where the process reads configuration.
 *
 * Real environment variables win over .env, so a deployment (or a one-off
 * `PORT=3099 node server.js`) can override the file. The single exception is
 * PORT: the sandbox exports PORT=0 as a placeholder, which would otherwise
 * win over a perfectly good value from .env.
 *
 * Imported by app.js and server.js, so every module sees the same values no
 * matter which one boots first.
 */
const fileEnv = dotenv.config({ override: false }).parsed || {};
if ((!process.env.PORT || process.env.PORT === "0") && fileEnv.PORT) {
  process.env.PORT = fileEnv.PORT;
}

export const isProduction = process.env.NODE_ENV === "production";

/** Port the HTTP server binds to. 0 and NaN fall back to 5000. */
export const port = Number(process.env.PORT) > 0 ? Number(process.env.PORT) : 5000;

/**
 * Secret used to sign JWTs. A missing or short secret means anybody can forge
 * a token for any account, so production refuses to boot instead of falling
 * back to a guessable string. Development keeps a clearly-labelled fallback
 * so `npm run dev` works before .env is filled in.
 */
const rawSecret = process.env.JWT_SECRET;
export const jwtSecret =
  rawSecret && rawSecret.trim().length >= 16
    ? rawSecret
    : (() => {
        if (isProduction) {
          throw new Error(
            "JWT_SECRET is missing or shorter than 16 characters. Set it in api/.env before running in production."
          );
        }
        console.warn(
          "[config] JWT_SECRET is missing or too short - using an insecure development secret. Tokens will not survive a deploy."
        );
        return "development-only-insecure-secret";
      })();

/**
 * Database URI. Required: the API is useless without its database, and
 * connecting lazily turns every request into a 10-minute buffering timeout
 * instead of one clear startup error.
 */
export const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI is not set - copy api/.env.example to api/.env");
}

/**
 * Browser origins allowed to call the API. Empty means "reflect any origin",
 * which is the convenient default for local development but must be set
 * explicitly in production (`CORS_ORIGINS=https://app.example.com,https://www...`).
 */
export const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  // Browsers send the Origin header without a trailing slash and lowercased,
  // so `https://App.example.com/` in the env must still match it.
  .map((origin) => origin.trim().replace(/\/+$/, "").toLowerCase())
  .filter(Boolean);

/**
 * Password recovery codes can only be read back by the client in development.
 * In production the code exists solely in the database until a mailer delivers
 * it; echoing it in the HTTP response would let anyone reset any account.
 */
export const exposeRecoveryCode = !isProduction;
