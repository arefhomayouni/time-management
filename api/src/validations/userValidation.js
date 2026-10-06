import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string().required().trim(),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(6).required(),
  personalRate: Joi.number().min(0).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required()
});

export const updateMeSchema = Joi.object({
  username: Joi.string().trim(),
  email: Joi.string().email().lowercase().trim(),
  personalRate: Joi.number().min(0),
  role: Joi.string().valid('user', 'manager')
});
