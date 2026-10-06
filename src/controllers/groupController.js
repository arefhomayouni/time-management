import Group from '../models/Group.js';
import User from '../models/User.js';
import TimeLog from '../models/TimeLog.js';
import Invitation from '../models/Invitation.js';
import Payment from '../models/Payment.js';
import ApiFeatures from 'vanta-api';
import { catchAsync } from 'vanta-api';

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     description: Creates a new group with a specific hourly rate. The creator becomes the manager.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, hourlyRate]
 *             properties:
 *               name: { type: string, example: 'Engineering Team' }
 *               hourlyRate: { type: number, example: 45 }
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     group: { $ref: '#/components/schemas/Group' }
 */
export const createGroup = catchAsync(async (req, res, next) => {
  const { name, hourlyRate } = req.body;

  const group = await Group.create({
    name,
    hourlyRate,
    manager: req.user.id,
    members: [req.user.id]
  });

  res.status(201).json({
    success: true,
    data: { group }
  });
});

/**
 * @swagger
 * /api/groups/invite:
 *   post:
 *     summary: Invite a user to a group
 *     description: Sends an invitation to a user via email to join a specific group.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, groupId]
 *             properties:
 *               email: { type: string, example: 'member@example.com' }
 *               groupId: { type: string, example: '650c9876543210fedcba4321' }
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     invitation: { type: object }
 *       403:
 *         description: Forbidden - only managers can invite
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const inviteUser = catchAsync(async (req, res, next) => {
  const { email, groupId } = req.body;

  const group = await Group.findById(groupId);
  if (!group || group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can invite users'
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (group.members.includes(user._id)) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this group'
    });
  }

  const invitation = await Invitation.create({
    fromUser: req.user.id,
    toUser: user._id,
    group: groupId
  });

  res.status(201).json({
    success: true,
    data: { invitation }
  });
});

/**
 * @swagger
 * /api/groups/invitation/handle:
 *   post:
 *     summary: Accept or decline a group invitation
 *     description: Updates the status of a group invitation.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invitationId, status]
 *             properties:
 *               invitationId: { type: string, example: '650c55554444333322221111' }
 *               status: { type: string, enum: [accepted, declined], example: 'accepted' }
 *     responses:
 *       200:
 *         description: Invitation handled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Invitation accepted' }
 *       404:
 *         description: Invitation not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const handleInvitation = catchAsync(async (req, res, next) => {
  const { invitationId, status } = req.body;

  const invitation = await Invitation.findById(invitationId);
  if (!invitation || invitation.toUser.toString() !== req.user.id) {
    return res.status(404).json({
      success: false,
      message: 'Invitation not found'
    });
  }

  invitation.status = status;
  await invitation.save();

  if (status === 'accepted') {
    await Group.findByIdAndUpdate(invitation.group, {
      $addToSet: { members: req.user.id }
    });
  }

  res.status(200).json({
    success: true,
    message: `Invitation ${status}`
  });
});

/**
 * @swagger
 * /api/groups/my-groups:
 *   get:
 *     summary: Get groups the user belongs to
 *     description: Returns a list of groups the authenticated user is a member of.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, example: 2 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Group' }
 */
export const getMyGroups = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Group, req.query, req.user.role)
    .addManualFilters({ members: req.user.id })
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
 * /api/groups/{id}/members:
 *   get:
 *     summary: Get group members (Manager only)
 *     description: Lists all members of a group. Restricted to the group manager.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: '650c9876543210fedcba4321' }
 *     responses:
 *       200:
 *         description: Members fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     members:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/User' }
 *       403:
 *         description: Forbidden - only managers can view members
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const getGroupMembers = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  if (group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can see the members list'
    });
  }

  const members = await User.find({ _id: { $in: group.members } });

  res.status(200).json({
    success: true,
    data: { members }
  });
});

/**
 * @swagger
 * /api/groups/{id}/report:
 *   get:
 *     summary: Get monthly payment report for group (Manager only)
 *     description: Generates a report for a specific month/year showing total hours, amount owed, and amount paid by each member.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: '650c9876543210fedcba4321' }
 *       - in: query
 *         name: month
 *         schema: { type: integer, example: 10 }
 *         required: true
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2026 }
 *         required: true
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     group: { type: string, example: 'Project Alpha' }
 *                     month: { type: integer, example: 10 }
 *                     year: { type: integer, example: 2026 }
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId: { type: string }
 *                           username: { type: string }
 *                           totalHours: { type: number }
 *                           totalAmount: { type: number }
 *                           paidAmount: { type: number }
 *                           status: { type: string, enum: [Underpaid, Overpaid, Exact] }
 *       403:
 *         description: Forbidden - only managers can access reports
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       400:
 *         description: Missing parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
export const getGroupReport = catchAsync(async (req, res, next) => {
  const { month, year } = req.query;
  const groupId = req.params.id;

  if (!month || !year) {
    return res.status(400).json({
      success: false,
      message: 'Please provide month and year'
    });
  }

  const group = await Group.findById(groupId);
  if (!group || group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can access the report'
    });
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const logs = await TimeLog.find({
    group: groupId,
    date: { $gte: startDate, $lte: endDate }
  });

  const reports = {};
  logs.forEach(log => {
    const userId = log.user.toString();
    if (!reports[userId]) {
      reports[userId] = {
        userId,
        totalHours: 0,
        totalAmount: 0,
        paidAmount: 0
      };
    }
    reports[userId].totalHours += log.hours;
    reports[userId].totalAmount += log.amount;
  });

  const reportArray = await Promise.all(Object.values(reports).map(async (report) => {
    const user = await User.findById(report.userId);

    const payments = await Payment.find({
      user: report.userId,
      group: groupId,
      date: { $gte: startDate, $lte: endDate }
    });

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      ...report,
      paidAmount,
      username: user ? user.username : 'Unknown',
      status: paidAmount < report.totalAmount ? 'Underpaid' : paidAmount > report.totalAmount ? 'Overpaid' : 'Exact'
    };
  }));

  res.status(200).json({
    success: true,
    data: {
      group: group.name,
      month,
      year,
      reports: reportArray
    }
  });
});

export const getMyGroups = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Group, req.query, req.user.role)
    .addManualFilters({ members: req.user.id })
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
