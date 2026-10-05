import express from 'express';
import { body, param, query } from 'express-validator';
import { createTimeEntry, getUserTimeEntries, getMonthlySummary, approveTimeEntry } from '../controllers/timeEntryController.js';
import { authenticate, validateRequest } from '../config/middleware/auth.js';

const router = express.Router();

// @route   POST /api/time/entries
// @desc    Create a new time entry
// @access  Private
router.post('/entries', authenticate, [
  body('date').notEmpty().withMessage('تاریخ الزامی است'),
  body('hours').isFloat({ min: 0, max: 24 }).withMessage('ساعات کار باید بین ۰ تا ۲۴ باشد'),
  body('description').optional().isLength({ max: 200 }).withMessage('توضیحات نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد'),
  body('group').optional().isMongoId().withMessage('شناسه گروه نامعتبر است'),
], validateRequest, createTimeEntry);

// @route   GET /api/time/user/:userId
// @desc    Get user time entries
// @access  Private
router.get('/user/:userId', authenticate, [
  param('userId').isMongoId().withMessage('شناسه کاربر نامعتبر است'),
  query('startDate').optional().isISO8601().withMessage('فرمت تاریخ شروع معتبر نیست'),
  query('endDate').optional().isISO8601().withMessage('فرمت تاریخ پایان معتبر نیست'),
  query('group').optional().isMongoId().withMessage('شناسه گروه نامعتبر است'),
], validateRequest, getUserTimeEntries);

// @route   GET /api/time/monthly/:yearMonth
// @desc    Get monthly summary for user
// @access  Private
router.get('/monthly/:yearMonth', authenticate, [
  param('yearMonth').matches(/^\d{4}-\d{2}$/).withMessage('فرمت تاریخ ماه باید YYYY-MM باشد'),
], validateRequest, getMonthlySummary);

// @route   PUT /api/time/entries/:id/approve
// @desc    Approve time entry (manager only)
// @access  Private (manager only)
router.put('/entries/:id/approve', authenticate, [
  param('id').isMongoId().withMessage('شناسه ورودی زمانی نامعتبر است'),
  body('status').isIn(['approved', 'rejected']).withMessage('وضعیت باید یا تایید شده یا رد شده باشد'),
  body('notes').optional().isLength({ max: 500 }).withMessage('یادداشت‌ها نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد'),
], validateRequest, approveTimeEntry);

export default router;