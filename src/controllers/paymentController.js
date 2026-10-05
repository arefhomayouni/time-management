import Payment from '../models/Payment.js';
import TimeLog from '../models/TimeLog.js';
import { catchAsync } from 'vanta-api';

/**
 * @swagger
 * /api/payments/pay:
 *   post:
 *     summary: Make a payment
 *     description: Records a payment and marks corresponding time logs as paid.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount]
 *             properties:
 *               userId: { type: string, example: '650c1234567890abcdef1234' }
 *               amount: { type: number, example: 1600 }
 *               groupId: { type: string, example: '650c9876543210fedcba4321' }
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment: { $ref: '#/components/schemas/Payment' }
 */
export const makePayment = catchAsync(async (req, res, next) => {
  const { userId, amount, groupId } = req.body;

  const payment = await Payment.create({
    user: userId,
    group: groupId || null,
    amount
  });

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
 *     description: Returns a list of all payments made by the authenticated user.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Payment' }
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
 *     description: Lists all payments made within a specific group. Restricted to the group manager.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string, example: '650c9876543210fedcba4321' }
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Payment' }
 *       403:
 *         description: Forbidden - only managers can view group payments
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const getGroupPayments = catchAsync(async (req, res, next) => {
  const { groupId } = req.params;
  const payments = await Payment.find({ group: groupId });
  res.status(200).json({
    success: true,
    data: { payments }
  });
});
