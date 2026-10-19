import TimeLog from '../models/TimeLog.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Payment from '../models/Payment.js';
import { catchAsync } from 'vanta-api';
import mongoose from 'mongoose';

/**
 * Every `amount` in the DB is denominated in the currency of the rate that
 * produced it: group.hourlyRateCurrency for group entries, the user's
 * personalRateCurrency for personal entries. Amounts from different
 * currencies must never be added or converted implicitly, so the API groups
 * them explicitly and the UI formats each group in its own unit.
 *
 * Legacy rows written before `currency` existed have no value stored;
 * resolve it from the related group or user instead of assuming USD.
 */
const resolveLogCurrencies = async (logs, userId) => {
  const groupIds = [
    ...new Set(logs.filter((l) => l.group).map((l) => String(l.group)))
  ];
  const groups = groupIds.length
    ? await Group.find({ _id: { $in: groupIds } }).select('hourlyRateCurrency')
    : [];
  const groupCurrency = {};
  groups.forEach((g) => {
    groupCurrency[String(g._id)] = g.hourlyRateCurrency || 'usd';
  });

  const user = await User.findById(userId).select('personalRateCurrency');
  const personalCurrency = user?.personalRateCurrency || 'usd';

  const currencyOf = (log) =>
    log.currency ||
    (log.group ? groupCurrency[String(log.group)] || 'usd' : personalCurrency);

  // Mutating in memory is safe here: these documents are only used for the
  // response being built, never saved.
  logs.forEach((log) => {
    log.currency = currencyOf(log);
  });

  return currencyOf;
};

/**
 * What has actually been paid for a set of logs, per currency.
 * Partial payouts count: cash received in the period is matched against what
 * was earned in that same scope (one group, or personal entries) and never
 * exceeds it, so "owed" cannot go negative. Fully settled logs still count
 * when the payment that covered them falls outside the queried date range.
 *
 * Logs must already carry a resolved `currency` (see resolveLogCurrencies).
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
  const scopeCurrency = {};
  logs.forEach((log) => {
    const scope = log.group ? String(log.group) : 'personal';
    earned[scope] = (earned[scope] || 0) + log.amount;
    if (log.status === 'paid') settled[scope] = (settled[scope] || 0) + log.amount;
    if (!scopeCurrency[scope]) scopeCurrency[scope] = log.currency || 'usd';
  });

  const paid = { usd: 0, irr: 0 };
  Object.keys(earned).forEach((scope) => {
    const currency = scopeCurrency[scope] || 'usd';
    paid[currency] +=
      Math.min(earned[scope], Math.max(cash[scope] || 0, settled[scope] || 0));
  });

  return {
    usd: Math.round(paid.usd * 100) / 100,
    irr: Math.round(paid.irr * 100) / 100,
  };
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
  let currency = 'usd';
  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    amount = hours * group.hourlyRate;
    currency = group.hourlyRateCurrency || 'usd';
  } else {
    const user = await User.findById(req.user.id);
    amount = hours * (user.personalRate || 0);
    currency = user.personalRateCurrency || 'usd';
  }

  const log = await TimeLog.create({
    user: req.user.id,
    group: groupId || null,
    date: new Date(date),
    hours,
    amount,
    currency
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

  // Tag every log with the unit its amount is in so the client can format it
  // without guessing (and without converting 25,000,000 Rials into USD).
  await resolveLogCurrencies(data, req.user.id);

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
  await resolveLogCurrencies(logs, req.user.id);

  const byDay = {};
  let totalHours = 0;
  const earned = { usd: 0, irr: 0 };

  logs.forEach((log) => {
    const key = log.date.toISOString().slice(0, 10);
    if (!byDay[key]) {
      byDay[key] = { date: key, hours: 0, amount: 0, entries: 0 };
    }
    byDay[key].hours += log.hours;
    byDay[key].amount += log.amount;
    byDay[key].entries += 1;

    totalHours += log.hours;
    earned[log.currency === 'irr' ? 'irr' : 'usd'] += log.amount;
  });

  const paid = await computePaidAmount(logs, req.user.id, filter.date);
  const round2 = (n) => Math.round(n * 100) / 100;

  // Amounts are never summed across currencies; each one is reported in the
  // unit it was earned in. Legacy top-level fields stay USD-only so older
  // clients keep a sane number instead of a mixed-currency total.
  const currencyTotals = {
    usd: {
      earned: round2(earned.usd),
      paid: round2(paid.usd),
      pending: round2(earned.usd - paid.usd)
    },
    irr: {
      earned: round2(earned.irr),
      paid: round2(paid.irr),
      pending: round2(earned.irr - paid.irr)
    }
  };

  const days = Object.values(byDay).map((d) => ({
    ...d,
    hours: round2(d.hours),
    amount: round2(d.amount)
  }));

  res.status(200).json({
    success: true,
    data: {
      totalHours: round2(totalHours),
      totalAmount: currencyTotals.usd.earned,
      paidAmount: currencyTotals.usd.paid,
      pendingAmount: currencyTotals.usd.pending,
      currencyTotals,
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
  await resolveLogCurrencies(logs, req.user.id);

  const round2 = (n) => Math.round(n * 100) / 100;
  const earned = { usd: 0, irr: 0 };
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
  logs.forEach((log) => {
    earned[log.currency === 'irr' ? 'irr' : 'usd'] += log.amount;
  });

  const paid = await computePaidAmount(logs, req.user.id, dateFilter);
  const currencyTotals = {
    usd: {
      earned: round2(earned.usd),
      paid: round2(paid.usd),
      pending: round2(earned.usd - paid.usd)
    },
    irr: {
      earned: round2(earned.irr),
      paid: round2(paid.irr),
      pending: round2(earned.irr - paid.irr)
    }
  };

  res.status(200).json({
    success: true,
    data: {
      totalEarnings: currencyTotals.usd.earned,
      totalHours: round2(totalHours),
      paidAmount: currencyTotals.usd.paid,
      pendingAmount: currencyTotals.usd.pending,
      currencyTotals,
      logs
    }
  });
});
