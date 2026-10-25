import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/env.js";

/**
 * Token factory + reader.
 *
 * Two flavours exist and they are NOT interchangeable:
 *
 * - access token   `{ id, version }`           30 days  -> the session itself
 * - reset token    `{ id, purpose: 'reset' }`  15 minutes -> only good for
 *                   one password reset, and rejected by `protect`
 *
 * `version` mirrors User.tokenVersion. Bumping that counter (on a password
 * change or reset) invalidates every access token handed out before it, so a
 * stolen session cannot outlive the credential it was built on.
 */
const ACCESS_TTL = "30d";
const RESET_TTL = "15m";

export const RESET_PURPOSE = "password-reset";

export const signAccessToken = (user) =>
  jwt.sign(
    { id: String(user._id ?? user.id ?? user), version: user.tokenVersion || 0 },
    jwtSecret,
    { expiresIn: ACCESS_TTL }
  );

export const signResetToken = (user) =>
  jwt.sign(
    { id: String(user._id ?? user.id ?? user), purpose: RESET_PURPOSE },
    jwtSecret,
    { expiresIn: RESET_TTL }
  );

/** Verifies signature + expiry. Throws when the token is not valid. */
export const verifyToken = (token) => jwt.verify(token, jwtSecret);

/** Pulls the bearer token out of the Authorization header, if present. */
export const bearerToken = (req) => {
  const header = req.headers?.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
};
