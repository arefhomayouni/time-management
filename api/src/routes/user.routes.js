import express from 'express';
import { body } from 'express-validator';
import { getUsers, getProfile, updateProfile } from '../controllers/userController.js';
import { authenticate, validateRequest } from '../config/middleware/auth.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', authenticate, getUsers);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticate, getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, [
  body('firstName').optional().notEmpty().withMessage('لطفاً نام خود را وارد کنید'),
  body('lastName').optional().notEmpty().withMessage('لطفاً نام خانوادگی خود را وارد کنید'),
], validateRequest, updateProfile);

export default router;