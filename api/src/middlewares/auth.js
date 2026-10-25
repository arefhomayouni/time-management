import User from "../models/User.js";
import { catchAsync } from "vanta-api";
import {
  bearerToken,
  verifyToken,
  RESET_PURPOSE,
} from "../utils/tokens.js";

const unauthorized = (res, message = "Not authorized to access this route") =>
  res.status(401).json({ success: false, message });

/**
 * Session guard.
 *
 * Rejects, in order:
 *  - a missing/malformed Authorization header
 *  - a token that does not verify (bad signature or expired)
 *  - a password-reset token (those are purpose-scoped and must never act as
 *    a full session)
 *  - a token whose user no longer exists
 *  - a token issued before the last password change (`tokenVersion` bumped)
 */
export const protect = catchAsync(async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) return unauthorized(res);

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return unauthorized(res, "Token is invalid or expired");
  }

  if (payload.purpose) {
    return unauthorized(res, "This token is not a session token");
  }

  const user = await User.findById(payload.id);
  if (!user) return unauthorized(res, "Token is invalid or expired");

  // Tokens minted before tokenVersion existed have no claim; treat as 0.
  if ((payload.version || 0) !== (user.tokenVersion || 0)) {
    return unauthorized(res, "Session expired, please sign in again");
  }

  req.user = user;
  next();
});

/**
 * Password-reset guard: accepts only a reset token whose exact value is still
 * stored on the account, so a reset link works once and only for the user it
 * was minted for.
 */
export const protectPasswordReset = catchAsync(async (req, res, next) => {
  const token = bearerToken(req);
  if (!token) return unauthorized(res, "A reset token is required");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return unauthorized(res, "The reset token is invalid or expired");
  }

  if (payload.purpose !== RESET_PURPOSE) {
    return unauthorized(res, "The reset token is invalid or expired");
  }

  // `token` lives on a nested path that is hidden from normal reads.
  const user = await User.findById(payload.id).select(
    "+forgetPasswordToken.token +forgetPasswordToken.time"
  );
  if (!user) return unauthorized(res, "The reset token is invalid or expired");

  const stored = user.forgetPasswordToken || {};
  if (!stored.token || stored.token !== token) {
    return unauthorized(res, "The reset token has already been used");
  }
  if (!stored.time || Date.now() - new Date(stored.time).getTime() > 15 * 60 * 1000) {
    return unauthorized(res, "The reset token is invalid or expired");
  }

  req.user = user;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
