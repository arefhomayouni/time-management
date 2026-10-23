import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string().required().trim(),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(6).required(),
  personalRate: Joi.number().min(0).optional(),
  personalRateCurrency: Joi.string().valid('usd', 'irr').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required()
});

// Authenticated password change from the profile screen. The current password
// is required so a hijacked session cannot rotate the credential silently.
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

// Note: role is intentionally not updatable here. Self-promoting to manager
// would grant payout powers, so role changes must go through an admin flow.
export const updateMeSchema = Joi.object({
  username: Joi.string().trim().min(3),
  email: Joi.string().email().lowercase().trim(),
  personalRate: Joi.number().min(0),
  personalRateCurrency: Joi.string().valid('usd', 'irr')
});
