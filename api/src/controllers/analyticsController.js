import TimeEntry from '../models/timeEntry.model.js';
import Group from '../models/group.model.js';
import User from '../models/user.model.js';
import Payment from '../models/payment.model.js';
import logger from '../config/logger.js';

// @desc    Get analytics data for dashboard
// @route   GET /api/analytics/dashboard
// @access  Private (manager only)
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's groups
    const userGroups = await Group.find({ members: userId });

    // Calculate total statistics
    let totalTimeEntries = 0;
    let totalHours = 0;
    let totalGroups = userGroups.length;
    let pendingApprovals = 0;
    let completedPayments = 0;

    for (const group of userGroups) {
      // Get time entries for this group
      const groupTimeEntries = await TimeEntry.find({ group: group._id });
      totalTimeEntries += groupTimeEntries.length;
      totalHours += groupTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);

      // Count pending approvals for group
      pendingApprovals += groupTimeEntries.filter((entry) => entry.status === 'pending').length;

      // Check if payments exist for current month
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const payments = await Payment.find({
        group: group._id,
        period: currentMonth,
        status: 'paid',
      });

      if (payments.length > 0) {
        completedPayments += payments.length;
      }
    }

    res.json({
      success: true,
      analytics: {
        totalTimeEntries,
        totalHours,
        totalGroups,
        pendingApprovals,
        completedPayments,
      },
    });
  } catch (error) {
    logger.error('Error getting dashboard analytics', { error: error.message });
    next(error);
  }
};

// @desc    Get time analytics for period
// @route   GET /api/analytics/time/:period
// @access  Private (manager only)
export const getTimeAnalytics = async (req, res, next) => {
  try {
    const { period } = req.params;
    const userId = req.user.id;

    // Get user's groups
    const userGroups = await Group.find({ members: userId });

    // Calculate analytics for each group
    const groupAnalytics = await Promise.all(
      userGroups.map(async (group) => {
        const startDate = new Date(`${period}-01T00:00:00.000Z`);
        const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));

        const timeEntries = await TimeEntry.find({
          group: group._id,
          date: { $gte: startDate, $lt: endDate },
          status: 'approved',
        }).populate('user', 'username firstName lastName');

        const userAnalytics = await Promise.all(
          group.members.map(async (memberId) => {
            const memberTimeEntries = timeEntries.filter((entry) => entry.user._id.toString() === memberId.toString());
            const totalHours = memberTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);

            return {
              userId: memberId,
              totalHours,
              entryCount: memberTimeEntries.length,
            };
          })
        );

        return {
          groupId: group._id,
          groupName: group.name,
          rate: group.rate,
          totalHours: timeEntries.reduce((sum, entry) => sum + entry.hours, 0),
          entryCount: timeEntries.length,
          userAnalytics,
        };
      })
    );

    res.json({
      success: true,
      period,
      analytics: groupAnalytics,
    });
  } catch (error) {
    logger.error('Error getting time analytics', { error: error.message });
    next(error);
  }
};