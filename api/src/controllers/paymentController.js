import Payment from '../models/payment.model.js';
import TimeEntry from '../models/timeEntry.model.js';
import Group from '../models/group.model.js';
import User from '../models/user.model.js';
import logger from '../config/logger.js';

// @desc    Calculate and generate payments for a group (manager only)
// @route   POST /api/payments/calculate/:groupId
// @access  Private (group manager only)
export const calculateGroupPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { period, paymentDate } = req.body;
    const processedBy = req.user.id;

    // Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'گروه یافت نشد',
      });
    }

    // Check if user is the group manager
    if (group.manager.toString() !== processedBy) {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیر گروه می‌تواند پرداخت‌ها را محاسبه کند',
      });
    }

    // Check if payments already exist for this period
    const existingPayments = await Payment.find({
      group: groupId,
      period,
    });

    if (existingPayments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'پرداخت‌ها برای این دوره قبلاً محاسبه شده‌اند',
      });
    }

    // Get all time entries for this group for the period
    const startDate = new Date(`${period}-01T00:00:00.000Z`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

    const timeEntries = await TimeEntry.find({
      group: groupId,
      date: { $gte: startDate, $lt: endDate },
      status: 'approved',
    }).populate('user', 'username firstName lastName');

    // Generate payments for each unique user
    const payments = [];

    for (const entry of timeEntries) {
      // Calculate user's total hours for this period
      const userHours = timeEntries
        .filter((e) => e.user.toString() === entry.user._id.toString())
        .reduce((sum, e) => sum + e.hours, 0);

      // Get user's rate (use group rate if user's rate is not set)
      const userRate = group.rate; // Using group rate for all members

      // Calculate payment
      const basePayment = userHours * userRate;
      const deductions = 0; // Can be customized based on company policy
      const finalPayment = basePayment - deductions;

      // Create payment record
      const payment = await Payment.create({
        user: entry.user._id,
        group: groupId,
        period,
        totalHours: userHours,
        rate: userRate,
        basePayment,
        deductions,
        finalPayment,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        status: 'processing',
        processedBy,
      });

      payments.push(payment);
    }

    logger.info('Payments calculated for group', {
      groupId,
      period,
      processedBy,
      paymentCount: payments.length,
    });

    res.status(201).json({
      success: true,
      message: 'پرداخت‌ها با موفقیت محاسبه شدند',
      period,
      paymentCount: payments.length,
      payments,
    });
  } catch (error) {
    logger.error('Error calculating group payments', { error: error.message });
    next(error);
  }
};

// @desc    Get user payments
// @route   GET /api/payments/user/:userId
// @access  Private
export const getUserPayments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { period } = req.query;

    // Check if user is requesting their own data or is admin/manager
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'شما به این داده‌ها دسترسی ندارید',
      });
    }

    // Build query
    const query = { user: userId };
    if (period) {
      query.period = period;
    }

    const payments = await Payment.find(query)
      .populate('user', 'username firstName lastName')
      .populate('group', 'name rate currency')
      .populate('processedBy', 'username firstName lastName')
      .sort({ paymentDate: -1 });

    // Calculate summary
    const totalAmount = payments.reduce((sum, payment) => sum + payment.finalPayment, 0);
    const totalHours = payments.reduce((sum, payment) => sum + payment.totalHours, 0);

    res.json({
      success: true,
      count: payments.length,
      totalAmount,
      totalHours,
      payments,
    });
  } catch (error) {
    logger.error('Error getting user payments', { error: error.message });
    next(error);
  }
};

// @desc    Get group payments (manager only)
// @route   GET /api/payments/group/:groupId
// @access  Private (group manager only)
export const getGroupPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { period } = req.query;
    const managerId = req.user.id;

    // Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'گروه یافت نشد',
      });
    }

    // Check if user is the group manager
    if (group.manager.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیر گروه می‌تواند پرداخت‌های گروه را مشاهده کند',
      });
    }

    // Build query
    const query = { group: groupId };
    if (period) {
      query.period = period;
    }

    const payments = await Payment.find(query)
      .populate('user', 'username firstName lastName')
      .populate('processedBy', 'username firstName lastName')
      .sort({ paymentDate: -1 });

    // Calculate summary
    const totalAmount = payments.reduce((sum, payment) => sum + payment.finalPayment, 0);
    const totalHours = payments.reduce((sum, payment) => sum + payment.totalHours, 0);

    res.json({
      success: true,
      group: {
        id: group._id,
        name: group.name,
        rate: group.rate,
        currency: group.currency,
      },
      period: period || 'all',
      count: payments.length,
      totalAmount,
      totalHours,
      payments,
    });
  } catch (error) {
    logger.error('Error getting group payments', { error: error.message });
    next(error);
  }
};

// @desc    Get payment report for group members (manager to user)
// @route   GET /api/payments/report/group/:groupId/user/:userId
// @access  Private (group manager can view any member, users can view themselves)
export const getPaymentReport = async (req, res, next) => {
  try {
    const { groupId, userId } = req.params;
    const { period } = req.query;
    const requestingUserId = req.user.id;

    // Find group
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'گروه یافت نشد',
      });
    }

    // Check permissions
    const isGroupManager = group.manager.toString() === requestingUserId;
    const isSelf = requestingUserId === userId;
    const isGroupMember = group.members.includes(requestingUserId);

    if (!isGroupManager && !isSelf && !isGroupMember) {
      return res.status(403).json({
        success: false,
        message: 'شما به این گزارش دسترسی ندارید',
      });
    }

    // Build query
    const query = {
      group: groupId,
      user: userId,
    };
    if (period) {
      query.period = period;
    }

    const payments = await Payment.find(query)
      .populate('user', 'username firstName lastName')
      .populate('processedBy', 'username firstName lastName')
      .sort({ paymentDate: -1 });

    // Get user's time entries for the period
    const startDate = period ? new Date(`${period}-01T00:00:00.000Z`) : undefined;
    const endDate = period ? new Date(new Date(startDate).setMonth(startDate.getMonth() + 1)) : undefined;

    const timeEntries = await TimeEntry.find({
      group: groupId,
      user: userId,
      ...(startDate && endDate && {
        date: { $gte: startDate, $lt: endDate },
      }),
    }).sort({ date: -1 });

    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const userRate = group.rate;
    const expectedPayment = totalHours * userRate;

    res.json({
      success: true,
      requestedBy: requestingUserId,
      isManager: isGroupManager,
      group: {
        id: group._id,
        name: group.name,
        rate: group.rate,
        currency: group.currency,
      },
      user: {
        id: userId,
      },
      period: period || 'all',
      payments,
      timeEntries,
      summary: {
        totalHours,
        userRate,
        expectedPayment,
      },
    });
  } catch (error) {
    logger.error('Error getting payment report', { error: error.message });
    next(error);
  }
};

// @desc    Update payment status (manager only)
// @route   PUT /api/payments/:id/status
// @access  Private (group manager only)
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, transactionId } = req.body;
    const processedBy = req.user.id;

    // Find payment
    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'پرداخت یافت نشد',
      });
    }

    // Check if user is the group manager
    const group = await Group.findById(payment.group);
    if (!group || group.manager.toString() !== processedBy) {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیر گروه می‌تواند وضعیت پرداخت را به‌روزرسانی کند',
      });
    }

    // Update payment
    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;

    await payment.save();

    logger.info('Payment status updated', {
      paymentId: id,
      processedBy,
      status,
      transactionId,
    });

    res.json({
      success: true,
      message: 'وضعیت پرداخت با موفقیت به‌روزرسانی شد',
      payment,
    });
  } catch (error) {
    logger.error('Error updating payment status', { error: error.message });
    next(error);
  }
};