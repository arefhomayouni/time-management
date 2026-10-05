import Payment from '../models/Payment.js';
import TimeLog from '../models/TimeLog.js';
import { catchAsync } from 'vanta-api';

/**
 * @swagger
 * /api/payments/pay:
 *   post:
 *     summary: Make a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               amount: { type: number }
 *               groupId: { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 */
export const makePayment = catchAsync(async (req, res, next) => {
  const { userId, amount, groupId } = req.body;

  // Record the payment
  const payment = await Payment.create({
    user: userId,
    group: groupId || null,
    amount
  });

  // Mark logs as paid (simplified: mark logs for the current month as paid)
  await TimeLog.updateMany(
    { user: userId, group: groupId || null, status: 'pending' },
    { $set: { status: 'paid' } }
  );

  res.status(201).json({
    success: true,
    data: { payment }
  });
});

/**
 * @swagger
 * /api/payments/my-payments:
 *   get:
 *     summary: Get my payment history
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 */
export const getMyPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find({ user: req.user.id });
  res.status(200).json({
    success: true,
    data: { payments }
  });
});

/**
 * @swagger
 * /api/payments/group/{groupId}:
 *   get:
 *     summary: Get group payment history (Manager only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 */
export const getGroupPayments = catchAsync(async (req, res, next) => {
  const { groupId } = req.params;
  const payments = await Payment.find({ group: groupId });
  res.status(200).json({
    success: true,
    data: { payments }
  });
});
