import TimeLog from '../models/TimeLog.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import ApiFeatures from 'vanta-api';
import { catchAsync } from 'vanta-api';
import mongoose from 'mongoose';

/**
 * @swagger
 * /api/time/logs:
 *   post:
 *     summary: Add a time log
 *     description: Records the hours worked for a specific day. If a groupId is provided, the amount is calculated based on the group rate; otherwise, it uses the user's personal rate.
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, hours]
 *             properties:
 *               date: { type: string, format: date, example: '2026-10-05' }
 *               hours: { type: number, example: 8 }
 *               groupId: { type: string, example: '650c9876543210fedcba4321' }
 *     responses:
 *       201:
 *         description: Log added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     log: { $ref: '#/components/schemas/TimeLog' }
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const addTimeLog = catchAsync(async (req, res, next) => {
  const { date, hours, groupId } = req.body;

  let amount = 0;
  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    amount = hours * group.hourlyRate;
  } else {
    const user = await User.findById(req.user.id);
    amount = hours * (user.personalRate || 0);
  }

  const log = await TimeLog.create({
    user: req.user.id,
    group: groupId || null,
    date: new Date(date),
    hours,
    amount
  });

  res.status(201).json({
    success: true,
    data: { log }
  });
});

/**
 * @swagger
 * /api/time/logs:
 *   get:
 *     summary: Get my time logs
 *     description: Returns a list of time logs for the authenticated user. Supports filtering, sorting, and pagination via Vanta API.
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, example: 100 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TimeLog' }
 */
export const getMyLogs = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(TimeLog, req.query, req.user.role)
    .addManualFilters({ user: req.user.id })
    .filter()
    .sort()
    .paginate();

  const result = await features.execute();

  res.status(200).json({
    success: true,
    count: result.count,
    data: result.data
  });
});

/**
 * @swagger
 * /api/time/earnings:
 *   get:
 *     summary: Get monthly earnings
 *     description: Calculates total earnings for the specified month and year.
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: integer, example: 10 }
 *         required: true
 *         description: Month of the year (1-12)
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2026 }
 *         required: true
 *         description: Year (e.g., 2026)
 *     responses:
 *       200:
 *         description: Earnings calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEarnings: { type: number, example: 3200 }
 *                     logs:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/TimeLog' }
 *       400:
 *         description: Missing parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const getMonthlyEarnings = catchAsync(async (req, res, next) => {
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      message: 'Please provide month and year'
    });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const logs = await TimeLog.find({
    user: req.user.id,
    date: { $gte: startDate, $lte: endDate }
  });

  const totalEarnings = logs.reduce((sum, log) => sum + log.amount, 0);

  res.status(200).json({
    success: true,
    data: {
      totalEarnings,
      logs
    }
  });
});
