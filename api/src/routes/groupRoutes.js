import express from 'express';
import * as groupController from '../controllers/groupController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createGroupSchema, inviteUserSchema, handleInvitationSchema, updateGroupSchema } from '../validations/groupValidation.js';

const router = express.Router();

router.post('/', protect, validate(createGroupSchema), groupController.createGroup);
router.post('/invite', protect, validate(inviteUserSchema), groupController.inviteUser);
router.post('/invitation/handle', protect, validate(handleInvitationSchema), groupController.handleInvitation);
router.get('/my-groups', protect, groupController.getMyGroups);
router.get('/:id', protect, groupController.getGroupById);
router.patch('/:id', protect, validate(updateGroupSchema), groupController.updateGroup);
router.get('/:id/members', protect, groupController.getGroupMembers);
router.get('/:id/report', protect, groupController.getGroupReport);

export default router;
