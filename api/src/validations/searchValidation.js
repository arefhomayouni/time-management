import Joi from 'joi';

export const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(400).required()
});
