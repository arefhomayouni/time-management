import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate, validateRequest } from '../config/middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('username').isLength({ min: 3, max: 30 }).withMessage('نام کاربری باید حداقل ۳ و حداکثر ۳۰ کاراکتر باشد'),
  body('email').isEmail().withMessage('لطفاً یک ایمیل معتبر وارد کنید'),
  body('password').isLength({ min: 6 }).withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  body('firstName').notEmpty().withMessage('لطفاً نام خود را وارد کنید'),
  body('lastName').notEmpty().withMessage('لطفاً نام خانوادگی خود را وارد کنید'),
], validateRequest, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('username').notEmpty().withMessage('لطفاً نام کاربری خود را وارد کنید'),
  body('password').notEmpty().withMessage('لطفاً رمز عبور خود را وارد کنید'),
], validateRequest, login);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, getMe);

export default router;