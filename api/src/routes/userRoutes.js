import express from "express";
import * as userController from "../controllers/userController.js";
import { protect, protectPasswordReset } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  sendForgetSchema,
  checkForgetSchema,
  resetPasswordSchema,
} from "../validations/userValidation.js";

const router = express.Router();

// Auth endpoints are the ones worth guessing at, so they get a tight budget:
// 10 requests per IP per route per 15 minutes. Normal use never comes close.
const authLimit = rateLimit({ windowMs: 15 * 60_000, max: 10 });
const recoveryLimit = rateLimit({ windowMs: 15 * 60_000, max: 5 });

router.post("/register", authLimit, validate(registerSchema), userController.register);
router.post("/login", authLimit, validate(loginSchema), userController.login);

router.get("/me", protect, userController.getMe);
router.patch("/me", protect, validate(updateMeSchema), userController.updateMe);
router.get("/invitations", protect, userController.getMyInvitations);
router.patch(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  userController.changeMyPassword
);

// Password recovery. Steps 1 and 2 are unauthenticated by nature; step 3 only
// accepts the single-use reset token issued by step 2.
router.post("/send-forget", recoveryLimit, validate(sendForgetSchema), userController.sendForgetCodeToEmail);
router.post("/forget-check", recoveryLimit, validate(checkForgetSchema), userController.CheckForgetCodeToEmail);
router.post(
  "/forget-reset",
  protectPasswordReset,
  validate(resetPasswordSchema),
  userController.changePassword
);

export default router;
