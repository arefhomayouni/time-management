import TimeEntry from '../models/timeEntry.model.js';
import Group from '../models/group.model.js';
import User from '../models/user.model.js';
import logger from '../config/logger.js';

// @desc    Create a new time entry
// @route   POST /api/time/entries
// @access  Private
export const createTimeEntry = async (req, res, next) => {
  try {
    const { date, hours, description, group } = req.body;
    const userId = req.user.id;

    // Validate date format
    const entryDate = new Date(date);
    if (isNaN(entryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'فرمت تاریخ معتبر نیست',
      });
    }

    // Check if time entry already exists for this user and date
    const existingEntry = await TimeEntry.findOne({
      user: userId,
      date: {
        $gte: new Date(entryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(entryDate.setHours(23, 59, 59, 999)),
      },
    });

    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'شما قبلاً برای این تاریخ ساعات کار ثبت کرده‌اید',
      });
    }

    // Validate group if provided
    let groupData = null;
    if (group) {
      const groupInfo = await Group.findById(group);
      if (!groupInfo) {
        return res.status(404).json({
          success: false,
          message: 'گروه یافت نشد',
        });
      }

      // Check if user is a member of the group
      if (!groupInfo.members.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'شما به این گروه دسترسی ندارید',
        });
      }

      groupData = group;
    }

    // Create time entry
    const timeEntry = await TimeEntry.create({
      user: userId,
      date: entryDate,
      hours,
      description,
      group: groupData,
    });

    logger.info('Time entry created', { userId, timeEntryId: timeEntry._id });

    res.status(201).json({
      success: true,
      message: 'ساعات کار با موفقیت ثبت شد',
      timeEntry,
    });
  } catch (error) {
    logger.error('Error creating time entry', { error: error.message });
    next(error);
  }
};

// @desc    Get user time entries
// @route   GET /api/time/user/:userId
// @access  Private
export const getUserTimeEntries = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, group } = req.query;

    // Check if user is requesting their own data or is admin/manager
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'شما به این داده‌ها دسترسی ندارید',
      });
    }

    // Build query
    const query = { user: userId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (group) {
      query.group = group;
    }

    const timeEntries = await TimeEntry.find(query)
      .populate('user', 'username firstName lastName')
      .populate('group', 'name rate')
      .populate('approvedBy', 'username firstName lastName')
      .sort({ date: -1 });

    // Calculate statistics
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const approvedHours = timeEntries
      .filter((entry) => entry.status === 'approved')
      .reduce((sum, entry) => sum + entry.hours, 0);

    res.json({
      success: true,
      count: timeEntries.length,
      totalHours,
      approvedHours,
      timeEntries,
    });
  } catch (error) {
    logger.error('Error getting user time entries', { error: error.message });
    next(error);
  }
};

// @desc    Get monthly summary for user
// @route   GET /api/time/monthly/:userId/:year-:month
// @access  Private
export const getMonthlySummary = async (req, res, next) => {
  try {
    const { userId, yearMonth } = req.params;
    const [year, month] = yearMonth.split('-');

    // Check permissions
    if (userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'شما به این داده‌ها دسترسی ندارید',
      });
    }

    // Calculate start and end dates for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    const timeEntries = await TimeEntry.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    }).populate('group', 'name rate');

    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

    // Group by group
    const groupedByGroup = {};
    timeEntries.forEach((entry) => {
      if (entry.group) {
        const groupId = entry.group._id;
        if (!groupedByGroup[groupId]) {
          groupedByGroup[groupId] = {
            group: entry.group,
            hours: 0,
          };
        }
        groupedByGroup[groupId].hours += entry.hours;
      }
    });

    res.json({
      success: true,
      yearMonth,
      totalHours,
      groupedByGroup: Object.values(groupedByGroup),
      timeEntries,
    });
  } catch (error) {
    logger.error('Error getting monthly summary', { error: error.message });
    next(error);
  }
};

// @desc    Approve time entry (manager only)
// @route   PUT /api/time/entries/:id/approve
// @access  Private (manager only)
export const approveTimeEntry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'approved', notes } = req.body;
    const userId = req.user.id;

    // Find time entry
    const timeEntry = await TimeEntry.findById(id).populate('user', 'username firstName lastName');

    if (!timeEntry) {
      return res.status(404).json({
        success: false,
        message: 'ورودی زمانی یافت نشد',
      });
    }

    // Check if user is the group manager (if group is assigned)
    if (timeEntry.group) {
      const group = await Group.findById(timeEntry.group);
      if (group && group.manager.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'فقط مدیر گروه می‌تواند این درخواست را تأیید یا رد کند',
        });
      }
    }

    // Update time entry
    timeEntry.status = status;
    timeEntry.approvedBy = userId;
    timeEntry.approvalDate = new Date();

    await timeEntry.save();

    logger.info('Time entry approved/rejected', {
      userId,
      timeEntryId: id,
      status,
      notes,
    });

    res.json({
      success: true,
      message: status === 'approved' ? 'درخواست تأیید شد' : 'درخواست رد شد',
      timeEntry,
    });
  } catch (error) {
    logger.error('Error approving time entry', { error: error.message });
    next(error);
  }
};