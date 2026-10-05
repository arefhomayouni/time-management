import express from 'express';
import * as groupController from '../controllers/groupController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, groupController.createGroup);
router.post('/invite', protect, groupController.inviteUser);
router.post('/invitation/handle', protect, groupController.handleInvitation);
router.get('/my-groups', protect, groupController.getMyGroups);
router.get('/:id/members', protect, groupController.getGroupMembers);
router.get('/:id/report', protect, groupController.getGroupReport);

export default router;
