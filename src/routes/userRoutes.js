import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/me', protect, userController.getMe);
router.patch('/me', protect, userController.updateMe);

export default router;
