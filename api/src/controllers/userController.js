import crypto from "crypto";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import bcrypt from "bcryptjs";
import { catchAsync } from "vanta-api";
import { signAccessToken, signResetToken } from "../utils/tokens.js";
import { exposeRecoveryCode } from "../config/env.js";

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

/** Six digits, from the CSPRNG - Math.random is not a credential source. */
const generateRecoveryCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

/** Codes are stored hashed so a database leak does not hand out resets. */
const hashCode = (code) =>
  crypto.createHash("sha256").update(String(code)).digest("hex");

/** Constant-time compare that also tolerates different lengths. */
const safeEqual = (a, b) => {
  const left = Buffer.from(String(a ?? ""));
  const right = Buffer.from(String(b ?? ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

/** Clears the recovery state after a successful reset / restart of the flow. */
const clearRecoveryState = (userId) =>
  User.updateOne(
    { _id: userId },
    {
      $set: {
        "forgetPasswordToken.time": null,
        "forgetPasswordToken.token": null,
        "forgetPasswordToken.code": null,
        "forgetPasswordToken.attempts": 0,
      },
    }
  );

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with a hashed password and personal hourly rate.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, example: 'johndoe' }
 *               email: { type: string, example: 'john@example.com' }
 *               password: { type: string, example: 'password123' }
 *               personalRate: { type: number, example: 25 }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 token: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const register = catchAsync(async (req, res, next) => {
  const { username, email, password, personalRate, personalRateCurrency } =
    req.body;

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    personalRate,
    personalRateCurrency: personalRateCurrency || "usd",
  });

  res.status(201).json({
    success: true,
    token: signAccessToken(user),
    data: {
      // toPublicJSON strips the bcrypt hash: User.create() hands back the full
      // document, hash included.
      user: user.toPublicJSON(),
    },
  });
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a JWT access token.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: 'john@example.com' }
 *               password: { type: string, example: 'password123' }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      success: false,
      message: "Incorrect email or password",
    });
  }

  res.status(200).json({
    success: true,
    token: signAccessToken(user),
    data: {
      user: user.toPublicJSON(),
    },
  });
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched successfully
 *       401:
 *         description: Unauthorized
 */
export const getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
    },
  });
});

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */
export const updateMe = catchAsync(async (req, res, next) => {
  // Explicit allowlist: `role` and `tokenVersion` are never client-writable.
  const allowed = {};
  for (const field of [
    "username",
    "email",
    "personalRate",
    "personalRateCurrency",
  ]) {
    if (req.body[field] !== undefined) allowed[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user.id, allowed, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    data: {
      user: user.toPublicJSON(),
    },
  });
});

/**
 * @swagger
 * /api/users/invitations:
 *   get:
 *     summary: Get my pending group invitations
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
export const getMyInvitations = catchAsync(async (req, res, next) => {
  const invitations = await Invitation.find({
    toUser: req.user.id,
    status: "pending",
  })
    .populate("group", "name hourlyRate")
    .populate("fromUser", "username")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    data: { invitations },
  });
});

/**
 * Change the password of the signed-in user. Requires the current password so
 * a stolen session cannot rotate the credential on its own. Every other
 * session is revoked by bumping tokenVersion.
 */
export const changeMyPassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // password is select:false, so it must be requested explicitly here.
  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // 400 rather than 401: the session is valid, only the submitted password is
  // wrong. The client signs the user out on any 401, so a typo here would
  // otherwise kick them out of the app.
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    return res.status(400).json({
      success: false,
      message: "New password cannot be the same as the old password",
    });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
    // The caller's own session is re-issued so they are not signed out.
    data: { token: signAccessToken(user) },
  });
});

/**
 * Step 1 of password recovery: mint a six-digit code.
 *
 * The response never reveals whether the address exists, and in production it
 * never contains the code either - that is what a mailer is for. Development
 * echoes it so the flow can be exercised without SMTP.
 */
export const sendForgetCodeToEmail = catchAsync(async (req, res, next) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ email });

  if (!user) {
    // Same shape as success, so this endpoint cannot be used to enumerate
    // registered addresses.
    return res.status(200).json({ success: true, data: {} });
  }

  const code = generateRecoveryCode();
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        "forgetPasswordToken.code": hashCode(code),
        "forgetPasswordToken.time": new Date(),
        "forgetPasswordToken.token": null,
        "forgetPasswordToken.attempts": 0,
      },
    }
  );

  res.status(200).json({
    success: true,
    data: exposeRecoveryCode ? { code } : {},
  });
});

/**
 * Step 2: exchange the code for a single-use reset token.
 * Five wrong guesses burn the code, so the six digits cannot be brute forced.
 */
export const CheckForgetCodeToEmail = catchAsync(async (req, res, next) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const code = String(req.body.code || "").trim();

  const user = await User.findOne({ email }).select(
    "+forgetPasswordToken.code +forgetPasswordToken.time +forgetPasswordToken.attempts"
  );

  const invalid = () =>
    res.status(400).json({ success: false, message: "Invalid or expired code" });

  if (!user) return invalid();

  const recovery = user.forgetPasswordToken || {};
  if (!recovery.code || !recovery.time) return invalid();

  if (Date.now() - new Date(recovery.time).getTime() > CODE_TTL_MS) {
    await clearRecoveryState(user._id);
    return invalid();
  }

  if (!safeEqual(hashCode(code), recovery.code)) {
    const attempts = (recovery.attempts || 0) + 1;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      await clearRecoveryState(user._id);
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Request a new code.",
      });
    }
    await User.updateOne(
      { _id: user._id },
      { $set: { "forgetPasswordToken.attempts": attempts } }
    );
    return invalid();
  }

  const token = signResetToken(user);
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        "forgetPasswordToken.token": token,
        "forgetPasswordToken.code": null,
        "forgetPasswordToken.time": new Date(),
        "forgetPasswordToken.attempts": 0,
      },
    }
  );

  res.status(200).json({ success: true, data: { token } });
});

/**
 * Step 3: set the new password.
 *
 * `protectPasswordReset` has already verified that the presented token is the
 * one stored on the account and that it has not expired, so the account comes
 * from the token rather than from a caller-supplied email.
 */
export const changePassword = catchAsync(async (req, res, next) => {
  const { newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    return res.status(400).json({
      success: false,
      message: "New password cannot be the same as the old password",
    });
  }

  user.password = await bcrypt.hash(newPassword, 12);
  // Revoke every existing session: a password reset means "assume the old
  // credential leaked".
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  await clearRecoveryState(user._id);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
    data: { token: signAccessToken(user) },
  });
});
