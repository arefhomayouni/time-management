import Joi from 'joi';

export const addTimeLogSchema = Joi.object({
  date: Joi.date().iso().required(),
  hours: Joi.number().min(0).max(24).required(),
  groupId: Joi.string().hex().length(24).optional().allow(null)
});

export const earningsQuerySchema = Joi.object({
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2000).max(2100).required()
});
