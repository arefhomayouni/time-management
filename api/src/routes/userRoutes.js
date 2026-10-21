import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema, updateMeSchema } from '../validations/userValidation.js';

const router = express.Router();

router.post('/register', validate(registerSchema), userController.register);
router.post('/login', validate(loginSchema), userController.login);
router.get('/me', protect, userController.getMe);
router.patch('/me', protect, validate(updateMeSchema), userController.updateMe);
router.get('/invitations', protect, userController.getMyInvitations);
// forget routes
router.post('/send-forget', userController.sendForgetCodeToEmail);
router.post('/forget-check', userController.CheckForgetCodeToEmail);
router.post("/forget-reset", protect, userController.changePassword);

export default router;
