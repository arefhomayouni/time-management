import Joi from 'joi';

export const createGroupSchema = Joi.object({
  name: Joi.string().required().trim(),
  hourlyRate: Joi.number().min(0).required(),
  budget: Joi.number().min(0).optional()
});

export const inviteUserSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  groupId: Joi.string().hex().length(24).required()
});

export const updateGroupSchema = Joi.object({
  name: Joi.string().trim().min(2),
  hourlyRate: Joi.number().min(0),
  budget: Joi.number().min(0)
}).min(1);

export const handleInvitationSchema = Joi.object({
  invitationId: Joi.string().hex().length(24).required(),
  status: Joi.string().valid('accepted', 'declined').required()
});
