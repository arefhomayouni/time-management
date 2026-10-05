import Group from '../models/group.model.js';
import User from '../models/user.model.js';
import TimeEntry from '../models/timeEntry.model.js';
import Payment from '../models/payment.model.js';
import logger from '../config/logger.js';

// @desc    Create a new group
// @route   POST /api/groups/create
// @access  Private (manager only)
export const createGroup = async (req, res, next) => {
  try {
    const { name, description, rate, currency } = req.body;
    const managerId = req.user.id;

    // Check if group already exists
    const existingGroup = await Group.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      manager: managerId,
    });

    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'این گروه توسط شما ایجاد شده است',
      });
    }

    // Create group
    const group = await Group.create({
      name,
      description,
      rate,
      currency,
      manager: managerId,
      members: [managerId],
    });

    logger.info('Group created successfully', { groupId: group._id, managerId });

    res.status(201).json({
      success: true,
      message: 'گروه با موفقیت ایجاد شد',
      group,
    });
  } catch (error) {
    logger.error('Error creating group', { error: error.message });
    next(error);
  }
};

// @desc    Get user's groups
// @route   GET /api/groups/user
// @access  Private
export const getUserGroups = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find groups where user is a member
    const groups = await Group.find({ members: userId }).select('-manager');

    // For each group, get additional info
    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        const memberCount = group.memberCount;
        const timeEntries = await TimeEntry.find({ group: group._id, user: userId }).sort({ date: -1 });
        const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

        return {
          ...group.toJSON(),
          memberCount,
          totalHours,
        };
      })
    );

    res.json({
      success: true,
      count: groupsWithDetails.length,
      groups: groupsWithDetails,
    });
  } catch (error) {
    logger.error('Error getting user groups', { error: error.message });
    next(error);
  }
};

// @desc    Get group details
// @route   GET /api/groups/:id
// @access  Private (group members only)
export const getGroupDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'گروه یافت نشد',
      });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'شما به این گروه دسترسی ندارید',
      });
    }

    // For managers, get all members info
    let members = [];
    let memberStats = [];

    if (group.manager.toString() === userId) {
      members = await User.find({ _id: { $in: group.members } }).select('-password');

      // Get stats for each member
      memberStats = await Promise.all(
        group.members.map(async (memberId) => {
          const timeEntries = await TimeEntry.find({ group: group._id, user: memberId }).sort({ date: -1 });
          const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);

          return {
            memberId,
            totalHours,
            timeEntries: timeEntries.slice(0, 5), // Last 5 entries
          };
        })
      );
    }

    res.json({
      success: true,
      group: {
        ...group.toJSON(),
        isManager: group.manager.toString() === userId,
        members: members,
        memberStats: memberStats,
      },
    });
  } catch (error) {
    logger.error('Error getting group details', { error: error.message });
    next(error);
  }
};

// @desc    Invite user to group
// @route   POST /api/groups/:id/invite
// @access  Private (group manager only)
export const inviteToGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const managerId = req.user.id;

    // Find group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'گروه یافت نشد',
      });
    }

    // Check if user is the manager
    if (group.manager.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیر گروه می‌تواند کاربران را دعوت کند',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
      });
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'این کاربر قبلاً در گروه است',
      });
    }

    // Add user to group
    group.members.push(userId);
    await group.save();

    logger.info('User invited to group', { userId, groupId: id, managerId });

    res.json({
      success: true,
      message: 'کاربر با موفقیت به گروه دعوت شد',
      group,
    });
  } catch (error) {
    logger.error('Error inviting user to group', { error: error.message });
    next(error);
  }
};

// @desc    Remove user from group
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private (group manager only)
export const removeFromGroup = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const managerId = req.user.id;

    // Find group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'گروه یافت نشد',
      });
    }

    // Check if user is the manager
    if (group.manager.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیر گروه می‌تواند کاربران را حذف کند',
      });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'این کاربر در گروه نیست',
      });
    }

    // Remove user from group
    group.members = group.members.filter((member) => member.toString() !== userId);
    await group.save();

    logger.info('User removed from group', { userId, groupId: id, managerId });

    res.json({
      success: true,
      message: 'کاربر از گروه حذف شد',
      group,
    });
  } catch (error) {
    logger.error('Error removing user from group', { error: error.message });
    next(error);
  }
};

// @desc    Update group rate
// @route   PUT /api/groups/:id/rate
// @access  Private (group manager only)
export const updateGroupRate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rate, currency } = req.body;
    const managerId = req.user.id;

    // Find group
    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'گروه یافت نشد',
      });
    }

    // Check if user is the manager
    if (group.manager.toString() !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'فقط مدیر گروه می‌تواند نرخ را به‌روزرسانی کند',
      });
    }

    // Update rate and currency
    if (rate !== undefined) group.rate = rate;
    if (currency) group.currency = currency;

    await group.save();

    logger.info('Group rate updated', { groupId: id, managerId, rate });

    res.json({
      success: true,
      message: 'نرخ گروه با موفقیت به‌روزرسانی شد',
      group,
    });
  } catch (error) {
    logger.error('Error updating group rate', { error: error.message });
    next(error);
  }
};