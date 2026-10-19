import Payment from '../models/Payment.js';
import TimeLog from '../models/TimeLog.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { catchAsync } from 'vanta-api';
import mongoose from 'mongoose';

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * A payment is denominated in its group's rate currency, or in the payee's
 * personalRateCurrency for personal payouts. Legacy rows have no stored
 * currency; derive it instead of mislabelling Rial payouts as dollars.
 * Mutates the in-memory docs only (they are not saved afterwards).
 */
const resolvePaymentCurrencies = async (payments, userId) => {
  const groupIds = [
    ...new Set(payments.filter((p) => p.group).map((p) => String(p.group)))
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

  payments.forEach((p) => {
    p.currency =
      p.currency ||
      (p.group ? groupCurrency[String(p.group)] || 'usd' : personalCurrency);
  });
};

/** Sum amounts per currency and attach the per-currency breakdown. */
const currencyTotalsOf = (payments) => {
  const totals = { usd: 0, irr: 0 };
  payments.forEach((p) => {
    totals[p.currency === 'irr' ? 'irr' : 'usd'] += p.amount;
  });
  return { usd: round2(totals.usd), irr: round2(totals.irr) };
};

const parseRange = (query) => {
  const { startDate, endDate } = query;
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * @swagger
 * /api/payments/pay:
 *   post:
 *     summary: Record a payout (Manager only)
 *     description: Records money the manager gave to a member and marks that member's pending time logs as paid, oldest logs first, up to the paid amount. Supports an optional date range so only logs inside the filtered period get settled.
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
 *               startDate: { type: string, format: date, example: '2026-10-01' }
 *               endDate: { type: string, format: date, example: '2026-10-31' }
 *               notes: { type: string, example: 'October settlement' }
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *       403:
 *         description: Forbidden - only the group manager can pay
 */
export const makePayment = catchAsync(async (req, res, next) => {
  const { userId, amount, groupId, startDate, endDate, notes, paymentMethod } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
  }

  if (groupId) {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    if (group.manager.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the group manager can record payouts'
      });
    }
    if (!group.members.some((m) => m.toString() === userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this group'
      });
    }
  } else if (req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Only managers can record payouts'
    });
  }

  // The payout is in the same unit as the earnings it settles.
  let currency = 'usd';
  if (groupId) {
    const group = await Group.findById(groupId).select('hourlyRateCurrency');
    currency = group?.hourlyRateCurrency || 'usd';
  } else {
    const payee = await User.findById(userId).select('personalRateCurrency');
    currency = payee?.personalRateCurrency || 'usd';
  }

  const payment = await Payment.create({
    user: userId,
    group: groupId || null,
    amount,
    currency,
    notes,
    paymentMethod: paymentMethod || 'transfer',
    date: endDate ? new Date(endDate) : new Date()
  });

  // Settle pending logs oldest-first, up to the amount paid.
  // When a date range is given, only logs inside that period are settled.
  const logFilter = { user: userId, group: groupId || null, status: 'pending' };
  const logFilterWithoutStatus = { user: userId, group: groupId || null };
  const range = parseRange({ startDate, endDate });
  if (range) {
    logFilter.date = { $gte: range.start, $lte: range.end };
    logFilterWithoutStatus.date = logFilter.date;
  }

  const pendingLogs = await TimeLog.find(logFilter).sort('date');

  // Aggregation $match does not cast strings to ObjectId, so build the
  // match explicitly. Recompute coverage from ALL payments so split payouts
  // (300 + 60) settle a 360 log correctly, and a single partial payment
  // never over-claims.
  const userMatch = {
    user: new mongoose.Types.ObjectId(userId),
    group: groupId ? new mongoose.Types.ObjectId(groupId) : null
  };
  const rangeMatch = range ? { date: { $gte: range.start, $lte: range.end } } : {};

  const paidTotal = await Payment.aggregate([
    { $match: { ...userMatch, ...rangeMatch } },
    { $group: { _id: null, sum: { $sum: '$amount' } } }
  ]);
  const alreadyPaid = await TimeLog.aggregate([
    { $match: { ...userMatch, ...rangeMatch, status: 'paid' } },
    { $group: { _id: null, sum: { $sum: '$amount' } } }
  ]);

  let remaining = (paidTotal[0]?.sum || 0) - (alreadyPaid[0]?.sum || 0);
  const settledIds = [];

  for (const log of pendingLogs) {
    if (remaining + 1e-9 < log.amount) break;
    remaining -= log.amount;
    settledIds.push(log._id);
  }

  if (settledIds.length) {
    await TimeLog.updateMany(
      { _id: { $in: settledIds } },
      { $set: { status: 'paid' } }
    );
  }

  // leftover = how much of this payment did not fully cover a log yet
  res.status(201).json({
    success: true,
    data: {
      payment,
      settledLogs: settledIds.length,
      leftover: round2(Math.max(remaining, 0))
    }
  });
});

/**
 * @swagger
 * /api/payments/my-payments:
 *   get:
 *     summary: Get my payment history
 *     description: Returns payouts received by the authenticated user, optionally filtered by startDate/endDate.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 */
export const getMyPayments = catchAsync(async (req, res, next) => {
  const filter = { user: req.user.id };
  const range = parseRange(req.query);
  if (range) filter.date = { $gte: range.start, $lte: range.end };

  const payments = await Payment.find(filter).sort('-date');
  await resolvePaymentCurrencies(payments, req.user.id);
  const totals = currencyTotalsOf(payments);

  res.status(200).json({
    success: true,
    data: { payments, total: totals.usd, totals }
  });
});

/**
 * @swagger
 * /api/payments/group/{groupId}:
 *   get:
 *     summary: Get group payout history (Manager only)
 *     description: Lists payouts made within a specific group, optionally filtered by startDate/endDate. Restricted to the group manager.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 *       403:
 *         description: Forbidden - only the group manager can view group payments
 */
export const getGroupPayments = catchAsync(async (req, res, next) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }
  if (group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can view group payouts'
    });
  }

  const filter = { group: groupId };
  const range = parseRange(req.query);
  if (range) filter.date = { $gte: range.start, $lte: range.end };

  const payments = await Payment.find(filter)
    .populate('user', 'username email')
    .sort('-date');

  // Every payout in a group shares that group's rate currency.
  const currency = group.hourlyRateCurrency || 'usd';
  payments.forEach((p) => {
    p.currency = p.currency || currency;
  });
  const totals = currencyTotalsOf(payments);

  res.status(200).json({
    success: true,
    data: { payments, total: totals.usd, totals, currency }
  });
});
