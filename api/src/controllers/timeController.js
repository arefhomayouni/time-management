import TimeLog from '../models/TimeLog.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Payment from '../models/Payment.js';
import { catchAsync } from 'vanta-api';
import mongoose from 'mongoose';

/**
 * What has actually been paid for a set of logs.
 * Partial payouts count: cash received in the period is matched against what
 * was earned in that same scope (one group, or personal entries) and never
 * exceeds it, so "owed" cannot go negative. Fully settled logs still count
 * when the payment that covered them falls outside the queried date range.
 */
const computePaidAmount = async (logs, userId, dateFilter) => {
  const match = { user: new mongoose.Types.ObjectId(userId) };
  if (dateFilter) match.date = dateFilter;

  const cash = {};
  const rows = await Payment.aggregate([
    { $match: match },
    { $group: { _id: '$group', sum: { $sum: '$amount' } } }
  ]);
  rows.forEach((r) => {
    cash[r._id ? String(r._id) : 'personal'] = r.sum;
  });

  const earned = {};
  const settled = {};
  logs.forEach((log) => {
    const scope = log.group ? String(log.group) : 'personal';
    earned[scope] = (earned[scope] || 0) + log.amount;
    if (log.status === 'paid') settled[scope] = (settled[scope] || 0) + log.amount;
  });

  let paid = 0;
  Object.keys(earned).forEach((scope) => {
    paid += Math.min(earned[scope], Math.max(cash[scope] || 0, settled[scope] || 0));
  });

  return Math.round(paid * 100) / 100;
};

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
  // Plain mongoose query instead of ApiFeatures: the library's sanitizer
  // converts Date objects to {}, which silently breaks date-range filters.
  const { startDate, endDate, limit, sort } = req.query;

  const filter = { user: new mongoose.Types.ObjectId(req.user.id) };
  if (startDate) {
    filter.date = filter.date || {};
    filter.date.$gte = new Date(startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.date = filter.date || {};
    filter.date.$lte = end;
  }

  const pageLimit = Math.min(parseInt(limit, 10) || 100, 500);
  const sortSpec = String(sort || '-date');
  const sortObj = {};
  sortSpec.split(',').forEach((part) => {
    const field = part.replace(/^-/, '').trim();
    if (['date', 'hours', 'amount', 'createdAt'].includes(field)) {
      sortObj[field] = part.startsWith('-') ? -1 : 1;
    }
  });
  if (!Object.keys(sortObj).length) sortObj.date = -1;

  const [count, data] = await Promise.all([
    TimeLog.countDocuments(filter),
    TimeLog.find(filter).sort(sortObj).limit(pageLimit),
  ]);

  res.status(200).json({
    success: true,
    count,
    data,
  });
});

/**
 * @swagger
 * /api/time/logs:
 *   delete:
 *     summary: Delete one of my time logs
 *     description: Removes a personal time log by id. Only the owner can delete it.
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema: { type: string, example: '650c1234567890abcdef1234' }
 *     responses:
 *       200:
 *         description: Log deleted
 *       404:
 *         description: Log not found
 */
export const deleteMyLog = catchAsync(async (req, res, next) => {
  const log = await TimeLog.findOneAndDelete({
    _id: req.query.id,
    user: req.user.id
  });

  if (!log) {
    return res.status(404).json({
      success: false,
      message: 'Time log not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Time log deleted'
  });
});

/**
 * @swagger
 * /api/time/summary:
 *   get:
 *     summary: Date-filtered time summary
 *     description: Returns total hours, total amount, per-day breakdown and paid/pending split for the authenticated user over an optional date range.
 *     tags: [Time]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date, example: '2026-10-01' }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date, example: '2026-10-31' }
 *     responses:
 *       200:
 *         description: Summary computed successfully
 */
export const getTimeSummary = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  const filter = { user: req.user.id };
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }

  const logs = await TimeLog.find(filter).sort('date');

  const byDay = {};
  let totalHours = 0;
  let totalAmount = 0;

  logs.forEach((log) => {
    const key = log.date.toISOString().slice(0, 10);
    if (!byDay[key]) {
      byDay[key] = { date: key, hours: 0, amount: 0, entries: 0 };
    }
    byDay[key].hours += log.hours;
    byDay[key].amount += log.amount;
    byDay[key].entries += 1;

    totalHours += log.hours;
    totalAmount += log.amount;
  });

  const paidAmount = await computePaidAmount(logs, req.user.id, filter.date);

  const days = Object.values(byDay).map((d) => ({
    ...d,
    hours: Math.round(d.hours * 100) / 100,
    amount: Math.round(d.amount * 100) / 100
  }));

  res.status(200).json({
    success: true,
    data: {
      totalHours: Math.round(totalHours * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      pendingAmount: Math.round((totalAmount - paidAmount) * 100) / 100,
      entryCount: logs.length,
      days
    }
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
  endDate.setHours(23, 59, 59, 999);

  const dateFilter = { $gte: startDate, $lte: endDate };
  const logs = await TimeLog.find({
    user: req.user.id,
    date: dateFilter
  });

  const totalEarnings = logs.reduce((sum, log) => sum + log.amount, 0);
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
  const paidAmount = await computePaidAmount(logs, req.user.id, dateFilter);

  res.status(200).json({
    success: true,
    data: {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      pendingAmount: Math.round((totalEarnings - paidAmount) * 100) / 100,
      logs
    }
  });
});
