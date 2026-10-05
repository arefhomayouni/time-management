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
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date: { type: string, format: date }
 *               hours: { type: number }
 *               groupId: { type: string }
 *     responses:
 *       201:
 *         description: Log added successfully
 */
export const addTimeLog = catchAsync(async (req, res, next) => {
  const { date, hours, groupId } = req.body;

  // Calculate amount based on rate
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
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs fetched successfully
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
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *         required: true
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Earnings calculated successfully
 */
export const getMonthlyEarnings = catchAsync(async (req, res, next) => {
  const { month, year } = req.query; // e.g., month=10, year=2026

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
