import Joi from "joi";

export const registerSchema = Joi.object({
  username: Joi.string().required().trim().min(3).max(40),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(8).required(),
  personalRate: Joi.number().min(0).optional(),
  personalRateCurrency: Joi.string().valid("usd", "irr").optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required(),
});

// Authenticated password change from the profile screen. The current password
// is required so a hijacked session cannot rotate the credential silently.
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

// Note: role is intentionally not updatable here. Self-promoting to manager
// would grant payout powers, so role changes must go through an admin flow.
export const updateMeSchema = Joi.object({
  username: Joi.string().trim().min(3).max(40),
  email: Joi.string().email().lowercase().trim(),
  personalRate: Joi.number().min(0),
  personalRateCurrency: Joi.string().valid("usd", "irr"),
});

// ---- Password recovery ----

export const sendForgetSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
});

export const checkForgetSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  code: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({ "string.pattern.base": "The code has 6 digits" }),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().optional(),
  newPassword: Joi.string().min(8).required(),
});
