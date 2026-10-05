import express from 'express';
import { body, param, query } from 'express-validator';
import { calculateGroupPayments, getUserPayments, getGroupPayments, getPaymentReport, updatePaymentStatus } from '../controllers/paymentController.js';
import { authenticate, validateRequest } from '../config/middleware/auth.js';

const router = express.Router();

// @route   POST /api/payments/calculate/:groupId
// @desc    Calculate and generate payments for a group (manager only)
// @access  Private (group manager only)
router.post('/calculate/:groupId', authenticate, [
  param('groupId').isMongoId().withMessage('شناسه گروه نامعتبر است'),
  body('period').notEmpty().withMessage('دوره پرداخت الزامی است'),
  body('paymentDate').optional().isISO8601().withMessage('فرمت تاریخ پرداخت معتبر نیست'),
], validateRequest, calculateGroupPayments);

// @route   GET /api/payments/user/:userId
// @desc    Get user payments
// @access  Private
router.get('/user/:userId', authenticate, [
  param('userId').isMongoId().withMessage('شناسه کاربر نامعتبر است'),
  query('period').optional().isLength({ max: 20 }).withMessage('فرمت دوره پرداخت نامعتبر است'),
], validateRequest, getUserPayments);

// @route   GET /api/payments/group/:groupId
// @desc    Get group payments (manager only)
// @access  Private (group manager only)
router.get('/group/:groupId', authenticate, [
  param('groupId').isMongoId().withMessage('شناسه گروه نامعتبر است'),
  query('period').optional().isLength({ max: 20 }).withMessage('فرمت دوره پرداخت نامعتبر است'),
], validateRequest, getGroupPayments);

// @route   GET /api/payments/report/group/:groupId/user/:userId
// @desc    Get payment report for group members
// @access  Private
router.get('/report/group/:groupId/user/:userId', authenticate, [
  param('groupId').isMongoId().withMessage('شناسه گروه نامعتبر است'),
  param('userId').isMongoId().withMessage('شناسه کاربر نامعتبر است'),
  query('period').optional().isLength({ max: 20 }).withMessage('فرمت دوره پرداخت نامعتبر است'),
], validateRequest, getPaymentReport);

// @route   PUT /api/payments/:id/status
// @desc    Update payment status (manager only)
// @access  Private (group manager only)
router.put('/:id/status', authenticate, [
  param('id').isMongoId().withMessage('شناسه پرداخت نامعتبر است'),
  body('status').isIn(['pending', 'paid', 'processing', 'failed']).withMessage('وضعیت پرداخت نامعتبر است'),
  body('transactionId').optional().isLength({ max: 100 }).withMessage('شناسه تراکنش نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد'),
], validateRequest, updatePaymentStatus);

export default router;