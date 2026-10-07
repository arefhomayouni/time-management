import Joi from 'joi';

export const makePaymentSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  amount: Joi.number().min(0.01).required(),
  groupId: Joi.string().hex().length(24).optional().allow(null),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional().allow('', null),
  paymentMethod: Joi.string().valid('transfer', 'cash', 'card', 'other').optional()
});
