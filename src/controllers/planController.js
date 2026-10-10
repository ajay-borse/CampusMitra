const Plan = require('../models/Plan');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const Block = require('../models/Block');
const { getSocketIO } = require('../sockets/chatSocket');

// ============================================================================
// @desc    Create a new Campus Plan
// @route   POST /api/plans
// @access  Private
// ============================================================================
const createPlan = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const {
      title,
      description,
      category,
      date,
      time,
      duration,
      capacity,
      location,
      locationType,
      tags,
      circleId,
    } = req.body;

    let linkedCircleId = null;
    if (circleId) {
      const Circle = require('../models/Circle');
      const circle = await Circle.findById(circleId);
      if (!circle) {
        return res.status(404).json({
          success: false,
          message: 'Referenced Campus Circle not found',
        });
      }
      const isMember = circle.members.some(
        (m) => m.user.toString() === currentUserId.toString()
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of this circle to create a plan for it',
        });
      }
      linkedCircleId = circle._id;
    }

    // 1. Validation
    if (!title || typeof title !== 'string' || !title.trim() || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Plan title is required and must be at least 3 characters',
      });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Plan description is required',
      });
    }

    const validCategories = ['Study', 'Coffee', 'Sports', 'Coding', 'Gaming', 'Food', 'Events', 'Other'];
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`,
      });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Valid date is required in YYYY-MM-DD format',
      });
    }

    // Reject past dates before today
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Plan date cannot be in the past',
      });
    }

    if (!time || typeof time !== 'string' || !time.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Start time is required',
      });
    }

    if (!duration || typeof duration !== 'string' || !duration.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Approximate duration is required',
      });
    }

    const parsedCapacity = Number(capacity);
    if (isNaN(parsedCapacity) || parsedCapacity < 2 || parsedCapacity > 50) {
      return res.status(400).json({
        success: false,
        message: 'Participant capacity must be a number between 2 and 50',
      });
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting location is required',
      });
    }

    // 2. Create Plan document
    const plan = await Plan.create({
      creator: currentUserId,
      title: title.trim(),
      description: description.trim(),
      category,
      date,
      time: time.trim(),
      duration: duration.trim(),
      capacity: parsedCapacity,
      location: location.trim(),
      locationType: locationType || 'campus',
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      circle: linkedCircleId,
      status: 'upcoming',
      participants: [
        {
          user: currentUserId,
          role: 'creator',
          joinedAt: new Date(),
        },
      ],
    });

    // 3. Create Plan Group Conversation atomically
    const conversation = await Conversation.create({
      type: 'plan_group',
      plan: plan._id,
      participants: [currentUserId],
    });

    plan.conversation = conversation._id;
    await plan.save();

    // 4. Fetch populated plan with creator profile
    const populated = await Plan.findById(plan._id)
      .populate('creator', 'firstName lastName email isVerified role')
      .populate('participants.user', 'firstName lastName email isVerified role');

    return res.status(201).json({
      success: true,
      message: 'Campus plan created successfully! 🎉',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Discover all eligible Campus Plans
// @route   GET /api/plans
// @access  Private
// ============================================================================
const getPlans = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { category, search, filter, date, circleId, page = 1, limit = 20 } = req.query;

    const todayStr = new Date().toISOString().slice(0, 10);
    const query = {};

    // Filter by linked circle
    if (circleId) {
      query.circle = circleId;
    }

    // 1. Identify users blocked in either direction
    const blocks = await Block.find({
      $or: [{ blocker: currentUserId }, { blockedUser: currentUserId }],
    });
    const blockedUserIds = blocks.map((b) =>
      b.blocker.toString() === currentUserId.toString()
        ? b.blockedUser.toString()
        : b.blocker.toString()
    );

    if (blockedUserIds.length > 0) {
      query.creator = { $nin: blockedUserIds };
    }

    // 2. Filter by status & timing
    if (filter === 'mine') {
      query['participants.user'] = currentUserId;
    } else if (filter === 'created') {
      query.creator = currentUserId;
    } else {
      // General discovery: show upcoming and full plans, hide cancelled unless explicitly searching mine
      query.status = { $in: ['upcoming', 'full'] };
      query.date = { $gte: todayStr };
    }

    // 3. Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // 4. Date filter
    if (filter === 'today') {
      query.date = todayStr;
    } else if (date) {
      query.date = date;
    }

    // 5. Search filter
    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Plan.countDocuments(query);
    const plans = await Plan.find(query)
      .populate('creator', 'firstName lastName email isVerified role')
      .populate('participants.user', 'firstName lastName email isVerified role')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limitNum);

    // Get profiles for participants and creator
    const userIds = [];
    plans.forEach((p) => {
      if (p.creator?._id) userIds.push(p.creator._id);
      p.participants.forEach((part) => {
        if (part.user?._id) userIds.push(part.user._id);
      });
    });

    const profiles = await Profile.find({ user: { $in: userIds } }).select('user photos program year');
    const profileMap = new Map();
    profiles.forEach((pr) => {
      profileMap.set(pr.user.toString(), pr);
    });

    // Format plans with participation state & avatars
    const formatted = plans.map((p) => {
      const isCreator = p.creator?._id?.toString() === currentUserId.toString();
      const isJoined = p.participants.some(
        (part) => part.user?._id?.toString() === currentUserId.toString()
      );
      const spotsRemaining = Math.max(0, p.capacity - p.participants.length);
      const creatorProfile = p.creator?._id ? profileMap.get(p.creator._id.toString()) : null;

      const participantSummaries = p.participants.map((part) => {
        const u = part.user;
        const pr = u?._id ? profileMap.get(u._id.toString()) : null;
        return {
          id: u?._id,
          name: u ? `${u.firstName} ${u.lastName}` : 'Student',
          firstName: u?.firstName || 'Student',
          avatar: pr?.photos?.[0] || null,
          program: pr?.program || 'MIT-WPU Student',
          role: part.role,
          joinedAt: part.joinedAt,
        };
      });

      return {
        id: p._id,
        _id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        date: p.date,
        time: p.time,
        duration: p.duration,
        capacity: p.capacity,
        location: p.location,
        locationType: p.locationType,
        tags: p.tags || [],
        status: p.status,
        conversationId: p.conversation,
        spotsRemaining,
        isCreator,
        isJoined,
        participantCount: p.participants.length,
        creator: {
          id: p.creator?._id,
          name: p.creator ? `${p.creator.firstName} ${p.creator.lastName}` : 'Student',
          firstName: p.creator?.firstName || 'Student',
          avatar: creatorProfile?.photos?.[0] || null,
          program: creatorProfile?.program || 'MIT-WPU Student',
          isVerified: p.creator?.isVerified,
        },
        participants: participantSummaries,
        createdAt: p.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get full details of a specific Campus Plan
// @route   GET /api/plans/:id
// @access  Private
// ============================================================================
const getPlanById = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const plan = await Plan.findById(id)
      .populate('creator', 'firstName lastName email isVerified role')
      .populate('participants.user', 'firstName lastName email isVerified role');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Campus plan not found',
      });
    }

    // Check block rules
    if (plan.creator?._id) {
      const isBlocked = await Block.findOne({
        $or: [
          { blocker: currentUserId, blockedUser: plan.creator._id },
          { blocker: plan.creator._id, blockedUser: currentUserId },
        ],
      });

      if (isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Cannot view this plan due to privacy or block settings',
        });
      }
    }

    // Get profiles for creator & participants
    const userIds = [plan.creator._id, ...plan.participants.map((p) => p.user?._id)].filter(Boolean);
    const profiles = await Profile.find({ user: { $in: userIds } }).select('user photos program year');
    const profileMap = new Map();
    profiles.forEach((pr) => profileMap.set(pr.user.toString(), pr));

    const isCreator = plan.creator?._id?.toString() === currentUserId.toString();
    const isJoined = plan.participants.some(
      (part) => part.user?._id?.toString() === currentUserId.toString()
    );
    const spotsRemaining = Math.max(0, plan.capacity - plan.participants.length);
    const creatorProfile = profileMap.get(plan.creator._id.toString());

    const participantSummaries = plan.participants.map((part) => {
      const u = part.user;
      const pr = u?._id ? profileMap.get(u._id.toString()) : null;
      return {
        id: u?._id,
        name: u ? `${u.firstName} ${u.lastName}` : 'Student',
        firstName: u?.firstName || 'Student',
        avatar: pr?.photos?.[0] || null,
        program: pr?.program || 'MIT-WPU Student',
        role: part.role,
        joinedAt: part.joinedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        id: plan._id,
        _id: plan._id,
        title: plan.title,
        description: plan.description,
        category: plan.category,
        date: plan.date,
        time: plan.time,
        duration: plan.duration,
        capacity: plan.capacity,
        location: plan.location,
        locationType: plan.locationType,
        tags: plan.tags || [],
        status: plan.status,
        conversationId: plan.conversation,
        spotsRemaining,
        isCreator,
        isJoined,
        participantCount: plan.participants.length,
        creator: {
          id: plan.creator._id,
          name: `${plan.creator.firstName} ${plan.creator.lastName}`,
          firstName: plan.creator.firstName,
          avatar: creatorProfile?.photos?.[0] || null,
          program: creatorProfile?.program || 'MIT-WPU Student',
          isVerified: plan.creator.isVerified,
        },
        participants: participantSummaries,
        createdAt: plan.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Join a Campus Plan (atomic with capacity checks)
// @route   POST /api/plans/:id/join
// @access  Private
// ============================================================================
const joinPlan = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const existingPlan = await Plan.findById(id);
    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Campus plan not found',
      });
    }

    if (existingPlan.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This plan has been cancelled and cannot be joined',
      });
    }

    if (existingPlan.participants.some((p) => p.user.toString() === currentUserId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this plan',
      });
    }

    // Check block against creator
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: currentUserId, blockedUser: existingPlan.creator },
        { blocker: existingPlan.creator, blockedUser: currentUserId },
      ],
    });
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot join this plan due to block settings',
      });
    }

    // Atomic join query: ensures plan is upcoming, capacity not exceeded, user not duplicate
    const updatedPlan = await Plan.findOneAndUpdate(
      {
        _id: id,
        status: { $in: ['upcoming'] },
        'participants.user': { $ne: currentUserId },
        $expr: { $lt: [{ $size: '$participants' }, '$capacity'] },
      },
      {
        $push: {
          participants: {
            user: currentUserId,
            joinedAt: new Date(),
            role: 'participant',
          },
        },
      },
      { new: true }
    );

    if (!updatedPlan) {
      // Re-query to determine specific cause
      const checkPlan = await Plan.findById(id);
      if (checkPlan.participants.length >= checkPlan.capacity) {
        return res.status(400).json({
          success: false,
          message: 'This plan is already full and has reached its participant capacity',
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Unable to join plan at this time',
      });
    }

    // If capacity reached, update status to full
    if (updatedPlan.participants.length >= updatedPlan.capacity) {
      updatedPlan.status = 'full';
      await updatedPlan.save();
    }

    // Add user to the plan's group conversation
    if (updatedPlan.conversation) {
      await Conversation.findByIdAndUpdate(updatedPlan.conversation, {
        $addToSet: { participants: currentUserId },
      });
    }

    // Notify plan creator
    if (updatedPlan.creator.toString() !== currentUserId.toString()) {
      await Notification.create({
        recipient: updatedPlan.creator,
        sender: currentUserId,
        type: 'plan',
        title: 'New Student Joined Your Plan! ✨',
        message: `${req.user.firstName} joined your plan: "${updatedPlan.title}".`,
        data: { planId: updatedPlan._id, conversationId: updatedPlan.conversation },
      });

      // Emit real-time notification via Socket.IO
      const io = getSocketIO();
      if (io) {
        io.to(updatedPlan.creator.toString()).emit('plan_updated', {
          planId: updatedPlan._id,
          message: `${req.user.firstName} joined your plan!`,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully joined the plan! See you there 🚀',
      data: {
        id: updatedPlan._id,
        participantCount: updatedPlan.participants.length,
        status: updatedPlan.status,
        conversationId: updatedPlan.conversation,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Leave a Campus Plan
// @route   POST /api/plans/:id/leave
// @access  Private
// ============================================================================
const leavePlan = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Campus plan not found',
      });
    }

    if (plan.creator.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Plan creator cannot leave their own plan. You can cancel the plan instead.',
      });
    }

    const isMember = plan.participants.some(
      (p) => p.user.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant in this plan',
      });
    }

    // Atomically pull participant
    const updatedPlan = await Plan.findOneAndUpdate(
      {
        _id: id,
        'participants.user': currentUserId,
      },
      {
        $pull: { participants: { user: currentUserId } },
      },
      { new: true }
    );

    // If plan was full and now has space, revert to upcoming
    if (updatedPlan.status === 'full' && updatedPlan.participants.length < updatedPlan.capacity) {
      updatedPlan.status = 'upcoming';
      await updatedPlan.save();
    }

    // Remove user from the plan's group conversation
    if (updatedPlan.conversation) {
      await Conversation.findByIdAndUpdate(updatedPlan.conversation, {
        $pull: { participants: currentUserId },
      });
    }

    // Notify creator
    await Notification.create({
      recipient: updatedPlan.creator,
      sender: currentUserId,
      type: 'plan',
      title: 'Participant Left Plan',
      message: `${req.user.firstName} left your plan: "${updatedPlan.title}".`,
      data: { planId: updatedPlan._id },
    });

    return res.status(200).json({
      success: true,
      message: 'You have left the plan',
      data: {
        id: updatedPlan._id,
        participantCount: updatedPlan.participants.length,
        status: updatedPlan.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Update a Campus Plan (Creator only)
// @route   PUT /api/plans/:id
// @access  Private
// ============================================================================
const updatePlan = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const {
      title,
      description,
      location,
      locationType,
      date,
      time,
      duration,
      capacity,
      tags,
    } = req.body;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Campus plan not found',
      });
    }

    if (plan.creator.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the plan creator can edit plan details',
      });
    }

    if (plan.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a cancelled plan',
      });
    }

    if (title && (typeof title !== 'string' || title.trim().length < 3)) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 3 characters',
      });
    }

    if (capacity !== undefined) {
      const capNum = Number(capacity);
      if (isNaN(capNum) || capNum < 2 || capNum > 50) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be between 2 and 50',
        });
      }
      if (capNum < plan.participants.length) {
        return res.status(400).json({
          success: false,
          message: `Capacity cannot be lower than current confirmed participants (${plan.participants.length})`,
        });
      }
      plan.capacity = capNum;
    }

    if (title) plan.title = title.trim();
    if (description) plan.description = description.trim();
    if (location) plan.location = location.trim();
    if (locationType) plan.locationType = locationType;
    if (date) plan.date = date;
    if (time) plan.time = time.trim();
    if (duration) plan.duration = duration.trim();
    if (Array.isArray(tags)) plan.tags = tags.map((t) => String(t).trim()).filter(Boolean);

    // Recheck status based on capacity
    if (plan.status === 'full' && plan.participants.length < plan.capacity) {
      plan.status = 'upcoming';
    } else if (plan.participants.length >= plan.capacity) {
      plan.status = 'full';
    }

    await plan.save();

    // Notify other participants about updates
    const otherParticipantIds = plan.participants
      .map((p) => p.user.toString())
      .filter((uid) => uid !== currentUserId.toString());

    if (otherParticipantIds.length > 0) {
      const notifs = otherParticipantIds.map((uid) => ({
        recipient: uid,
        sender: currentUserId,
        type: 'plan',
        title: 'Plan Details Updated 📝',
        message: `The host updated details for "${plan.title}".`,
        data: { planId: plan._id, conversationId: plan.conversation },
      }));
      await Notification.insertMany(notifs);
    }

    return res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Cancel a Campus Plan (Creator only)
// @route   POST /api/plans/:id/cancel
// @access  Private
// ============================================================================
const cancelPlan = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Campus plan not found',
      });
    }

    if (plan.creator.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the creator can cancel this plan',
      });
    }

    plan.status = 'cancelled';
    await plan.save();

    // Notify all other confirmed participants
    const otherParticipantIds = plan.participants
      .map((p) => p.user.toString())
      .filter((uid) => uid !== currentUserId.toString());

    if (otherParticipantIds.length > 0) {
      const notifs = otherParticipantIds.map((uid) => ({
        recipient: uid,
        sender: currentUserId,
        type: 'plan',
        title: 'Plan Cancelled ⚠️',
        message: `The plan "${plan.title}" has been cancelled by the host.`,
        data: { planId: plan._id },
      }));
      await Notification.insertMany(notifs);
    }

    return res.status(200).json({
      success: true,
      message: 'Plan has been cancelled',
      data: { id: plan._id, status: 'cancelled' },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Remove a participant from plan (Creator only)
// @route   POST /api/plans/:id/remove-participant
// @access  Private
// ============================================================================
const removeParticipant = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required',
      });
    }

    const plan = await Plan.findById(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Campus plan not found',
      });
    }

    if (plan.creator.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the plan creator can remove participants',
      });
    }

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove creator from their own plan',
      });
    }

    // Pull participant
    const updatedPlan = await Plan.findOneAndUpdate(
      { _id: id },
      { $pull: { participants: { user: targetUserId } } },
      { new: true }
    );

    if (updatedPlan.status === 'full' && updatedPlan.participants.length < updatedPlan.capacity) {
      updatedPlan.status = 'upcoming';
      await updatedPlan.save();
    }

    // Pull from group conversation
    if (updatedPlan.conversation) {
      await Conversation.findByIdAndUpdate(updatedPlan.conversation, {
        $pull: { participants: targetUserId },
      });
    }

    // Notify removed participant
    await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'plan',
      title: 'Removed from Plan',
      message: `You were removed from the plan "${plan.title}" by the host.`,
      data: { planId: plan._id },
    });

    return res.status(200).json({
      success: true,
      message: 'Participant removed successfully',
      data: {
        id: updatedPlan._id,
        participantCount: updatedPlan.participants.length,
        status: updatedPlan.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlan,
  getPlans,
  getPlanById,
  joinPlan,
  leavePlan,
  updatePlan,
  cancelPlan,
  removeParticipant,
};
