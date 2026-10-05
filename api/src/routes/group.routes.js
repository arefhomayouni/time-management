import express from 'express';
import { body, param } from 'express-validator';
import { createGroup, getUserGroups, getGroupDetails, inviteToGroup, removeFromGroup, updateGroupRate } from '../controllers/groupController.js';
import { authenticate, validateRequest } from '../config/middleware/auth.js';

const router = express.Router();

// @route   POST /api/groups/create
// @desc    Create a new group
// @access  Private (manager only)
router.post('/create', authenticate, [
  body('name').isLength({ min: 2, max: 50 }).withMessage('نام گروه باید حداقل ۲ و حداکثر ۵۰ کاراکتر باشد'),
  body('description').optional().isLength({ max: 200 }).withMessage('توضیحات نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'),
  body('rate').isFloat({ min: 0 }).withMessage('نرخ پرداخت باید یک عدد مثبت باشد'),
  body('currency').optional().isLength({ max: 10 }).withMessage('واحد پول نمی‌تواند بیشتر از ۱۰ کاراکتر باشد'),
], validateRequest, createGroup);

// @route   GET /api/groups/user
// @desc    Get user's groups
// @access  Private
router.get('/user', authenticate, getUserGroups);

// @route   GET /api/groups/:id
// @desc    Get group details
// @access  Private (group members only)
router.get('/:id', authenticate, [
  param('id').isMongoId().withMessage('شناسه گروه نامعتبر است'),
], validateRequest, getGroupDetails);

// @route   POST /api/groups/:id/invite
// @desc    Invite user to group
// @access  Private (group manager only)
router.post('/:id/invite', authenticate, [
  param('id').isMongoId().withMessage('شناسه گروه نامعتبر است'),
  body('userId').isMongoId().withMessage('شناسه کاربر نامعتبر است'),
], validateRequest, inviteToGroup);

// @route   DELETE /api/groups/:id/members/:userId
// @desc    Remove user from group
// @access  Private (group manager only)
router.delete('/:id/members/:userId', authenticate, [
  param('id').isMongoId().withMessage('شناسه گروه نامعتبر است'),
  param('userId').isMongoId().withMessage('شناسه کاربر نامعتبر است'),
], validateRequest, removeFromGroup);

// @route   PUT /api/groups/:id/rate
// @desc    Update group rate
// @access  Private (group manager only)
router.put('/:id/rate', authenticate, [
  param('id').isMongoId().withMessage('شناسه گروه نامعتبر است'),
  body('rate').optional().isFloat({ min: 0 }).withMessage('نرخ پرداخت باید یک عدد مثبت باشد'),
  body('currency').optional().isLength({ max: 10 }).withMessage('واحد پول نمی‌تواند بیشتر از ۱۰ کاراکتر باشد'),
], validateRequest, updateGroupRate);

export default router;