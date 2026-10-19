import Group from '../models/Group.js';
import User from '../models/User.js';
import TimeLog from '../models/TimeLog.js';
import Invitation from '../models/Invitation.js';
import Payment from '../models/Payment.js';
import ApiFeatures from 'vanta-api';
import { catchAsync } from 'vanta-api';
import mongoose from 'mongoose';

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
  const { name, hourlyRate, hourlyRateCurrency, budget } = req.body;

  const group = await Group.create({
    name,
    hourlyRate,
    hourlyRateCurrency: hourlyRateCurrency || 'usd',
    budget: budget || 0,
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

  if (user._id.toString() === req.user.id) {
    return res.status(400).json({
      success: false,
      message: 'You already manage this group'
    });
  }

  // ObjectId comparison must go through equals(); a plain includes() compares
  // references and silently reports "not a member" for the same id.
  if (group.members.some((m) => m.equals(user._id))) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this group'
    });
  }

  const pending = await Invitation.findOne({
    group: groupId,
    toUser: user._id,
    status: 'pending'
  });
  if (pending) {
    return res.status(409).json({
      success: false,
      message: 'An invitation is already pending for this email'
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

  if (invitation.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `Invitation was already ${invitation.status}`
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
    // members stores ObjectIds, so the filter must be an ObjectId too
    .addManualFilters({ members: new mongoose.Types.ObjectId(req.user.id) })
    .filter()
    .sort()
    .paginate();

  const result = await features.execute();

  // The client needs to know which groups it manages without parsing
  // ObjectIds, so expose a plain boolean next to every group.
  const data = result.data.map((group) => {
    const view = group.toObject ? group.toObject() : group;
    return {
      ...view,
      isManager: String(view.manager) === req.user.id
    };
  });

  res.status(200).json({
    success: true,
    count: result.count,
    data
  });
});

/**
 * @swagger
 * /api/groups/{id}/members:
 *   get:
 *     summary: Get group members (Members only)
 *     description: Lists all members of a group. Visible to the manager and to members; only the manager can change the list.
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
 *         description: Forbidden - not a member of this group
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

  const isManager = group.manager.toString() === req.user.id;
  const isMember = group.members.some((m) => m.toString() === req.user.id);

  // Everyone in the group can see who else is in it; only the manager can
  // change the list. Non-members are not allowed to enumerate it.
  if (!isManager && !isMember) {
    return res.status(403).json({
      success: false,
      message: 'You are not a member of this group'
    });
  }

  const members = await User.find({ _id: { $in: group.members } })
    .select('username email personalRate personalRateCurrency')
    .sort('username');

  res.status(200).json({
    success: true,
    data: {
      members,
      manager: String(group.manager),
      isManager
    }
  });
});

/**
 * @swagger
 * /api/groups/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a group (Manager only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member removed
 *       400:
 *         description: The manager cannot remove themselves
 *       403:
 *         description: Forbidden - only managers can remove members
 */
export const removeGroupMember = catchAsync(async (req, res, next) => {
  const { id, userId } = req.params;

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  if (group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can remove members'
    });
  }

  if (group.manager.toString() === userId) {
    return res.status(400).json({
      success: false,
      message: 'The manager cannot be removed from the group'
    });
  }

  if (!group.members.some((m) => m.toString() === userId)) {
    return res.status(404).json({
      success: false,
      message: 'That user is not a member of this group'
    });
  }

  group.members = group.members.filter((m) => m.toString() !== userId);
  await group.save();

  // A removed member should not keep a stale pending invitation around.
  await Invitation.deleteMany({ group: id, toUser: userId, status: 'pending' });

  res.status(200).json({ success: true, data: { group } });
});

/**
 * @swagger
 * /api/groups/{id}/invitations:
 *   get:
 *     summary: List pending invitations for a group (Manager only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending invitations with the invitee's name and email
 */
export const getGroupInvitations = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  if (group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can see pending invitations'
    });
  }

  const invitations = await Invitation.find({
    group: req.params.id,
    status: 'pending'
  })
    .populate('toUser', 'username email')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: { invitations } });
});

/**
 * @swagger
 * /api/groups/{id}/invitations/{invitationId}:
 *   delete:
 *     summary: Cancel a pending invitation (Manager only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invitation cancelled
 *       404:
 *         description: Pending invitation not found in this group
 */
export const cancelGroupInvitation = catchAsync(async (req, res, next) => {
  const { id, invitationId } = req.params;

  const group = await Group.findById(id);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  if (group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can cancel invitations'
    });
  }

  const deleted = await Invitation.findOneAndDelete({
    _id: invitationId,
    group: id,
    status: 'pending'
  });

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: 'Pending invitation not found'
    });
  }

  res.status(200).json({ success: true });
});

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group details
 *     description: Returns the group. Visible to the manager and to members.
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
 *         description: Group fetched successfully
 *       403:
 *         description: Forbidden - not a member of this group
 *       404:
 *         description: Group not found
 *   patch:
 *     summary: Update group settings (Manager only)
 *     description: Allows the manager to change the name, hourly rate and the budget (total money committed for the period).
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: '650c9876543210fedcba4321' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: 'Engineering Team' }
 *               hourlyRate: { type: number, example: 45 }
 *               budget: { type: number, example: 5000 }
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       403:
 *         description: Forbidden - only the group manager can update
 */
export const getGroupById = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  const isMember = group.manager.toString() === req.user.id ||
    group.members.some((m) => m.toString() === req.user.id);

  if (!isMember) {
    return res.status(403).json({
      success: false,
      message: 'You are not a member of this group'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      group,
      isManager: group.manager.toString() === req.user.id
    }
  });
});

export const updateGroup = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id);

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  if (group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can update the group'
    });
  }

  const allowed = {};
  for (const field of ['name', 'hourlyRate', 'hourlyRateCurrency', 'budget']) {
    if (req.body[field] !== undefined) allowed[field] = req.body[field];
  }

  Object.assign(group, allowed);
  await group.save();

  res.status(200).json({
    success: true,
    data: { group }
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
/**
 * @swagger
 * /api/groups/{id}/report:
 *   get:
 *     summary: Get payment report for group (Manager only)
 *     description: Generates a report for a specific date range showing total hours, amount owed, and amount paid by each member.
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, example: '650c9876543210fedcba4321' }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date, example: '2026-10-01' }
 *         required: true
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date, example: '2026-10-31' }
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
 *                     startDate: { type: string, example: '2026-10-01' }
 *                     endDate: { type: string, example: '2026-10-31' }
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
 * */
export const getGroupReport = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const groupId = req.params.id;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide startDate and endDate (YYYY-MM-DD)'
    });
  }

  const group = await Group.findById(groupId);
  if (!group || group.manager.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Only the group manager can access the report'
    });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const logs = await TimeLog.find({
    group: groupId,
    date: { $gte: start, $lte: end }
  });

  // Start from every member so people with zero logs still appear in the report
  const reports = {};
  group.members.forEach((memberId) => {
    const userId = memberId.toString();
    reports[userId] = {
      userId,
      totalHours: 0,
      totalAmount: 0,
      paidAmount: 0
    };
  });

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
      date: { $gte: start, $lte: end }
    });

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      ...report,
      totalHours: Math.round(report.totalHours * 100) / 100,
      totalAmount: Math.round(report.totalAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      remainingAmount: Math.round((report.totalAmount - paidAmount) * 100) / 100,
      username: user ? user.username : 'Unknown',
      email: user ? user.email : '',
      status: paidAmount < report.totalAmount ? 'Underpaid' : paidAmount > report.totalAmount ? 'Overpaid' : 'Exact'
    };
  }));

  const totals = reportArray.reduce((acc, r) => ({
    totalHours: Math.round((acc.totalHours + r.totalHours) * 100) / 100,
    totalAmount: Math.round((acc.totalAmount + r.totalAmount) * 100) / 100,
    paidAmount: Math.round((acc.paidAmount + r.paidAmount) * 100) / 100
  }), { totalHours: 0, totalAmount: 0, paidAmount: 0 });
  totals.remainingAmount = Math.round((totals.totalAmount - totals.paidAmount) * 100) / 100;

  // Logs inside one group all use the group's rate currency, so the report
  // totals are safe to sum - the client just needs to know the unit.
  const currency = group.hourlyRateCurrency || 'usd';

  res.status(200).json({
    success: true,
    data: {
      group: group.name,
      hourlyRate: group.hourlyRate,
      hourlyRateCurrency: currency,
      budget: group.budget,
      startDate,
      endDate,
      totals,
      reports: reportArray
    }
  });
});


