const Circle = require('../models/Circle');
const CirclePost = require('../models/CirclePost');
const Notification = require('../models/Notification');
const Profile = require('../models/Profile');
const Block = require('../models/Block');
const { getSocketIO } = require('../sockets/chatSocket');

// ============================================================================
// @desc    Create a new Campus Circle
// @route   POST /api/circles
// @access  Private
// ============================================================================
const createCircle = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const {
      name,
      description,
      category,
      tags,
      visibility = 'public',
      avatar,
      coverColor,
    } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim() || name.trim().length < 3 || name.trim().length > 80) {
      return res.status(400).json({
        success: false,
        message: 'Circle name is required and must be between 3 and 80 characters',
      });
    }

    if (!description || typeof description !== 'string' || !description.trim() || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Description is required and must be at least 10 characters',
      });
    }

    const validCategories = [
      'Coding & DSA',
      'AI & Technology',
      'Academic Study',
      'Sports',
      'Gaming',
      'Photography',
      'Music',
      'Entrepreneurship',
      'Other',
    ];

    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${validCategories.join(', ')}`,
      });
    }

    // 2. Uniqueness check
    const existing = await Circle.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A circle with this name already exists. Please choose a distinctive name.',
      });
    }

    // 3. Create Circle
    const circle = await Circle.create({
      name: name.trim(),
      description: description.trim(),
      category,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      visibility: visibility === 'private' ? 'private' : 'public',
      creator: currentUserId,
      moderators: [currentUserId],
      members: [
        {
          user: currentUserId,
          role: 'owner',
          joinedAt: new Date(),
        },
      ],
      avatar: avatar || null,
      coverColor: coverColor || '#8B5CF6',
      status: 'active',
    });

    const populated = await Circle.findById(circle._id)
      .populate('creator', 'firstName lastName email isVerified role')
      .populate('members.user', 'firstName lastName email isVerified role');

    return res.status(201).json({
      success: true,
      message: 'Campus Circle created successfully! 🌟',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Discover and search Campus Circles
// @route   GET /api/circles
// @access  Private
// ============================================================================
const getCircles = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { category, search, filter, page = 1, limit = 20 } = req.query;

    const query = { status: 'active' };

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

    // 2. Membership filters
    if (filter === 'mine') {
      query['members.user'] = currentUserId;
    } else if (filter === 'created') {
      query.creator = currentUserId;
    } else {
      // General discovery: include public circles OR private circles where user is a member
      query.$or = [
        { visibility: 'public' },
        { visibility: 'private', 'members.user': currentUserId },
      ];
    }

    // 3. Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // 4. Search query
    if (search && search.trim()) {
      const q = search.trim();
      const searchCriteria = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCriteria }];
        delete query.$or;
      } else {
        query.$or = searchCriteria;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await Circle.countDocuments(query);
    const circles = await Circle.find(query)
      .populate('creator', 'firstName lastName email isVerified role')
      .populate('members.user', 'firstName lastName email isVerified role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Collect user IDs for profile fetching
    const userIds = [];
    circles.forEach((c) => {
      if (c.creator?._id) userIds.push(c.creator._id);
      c.members.forEach((m) => {
        if (m.user?._id) userIds.push(m.user._id);
      });
    });

    const profiles = await Profile.find({ user: { $in: userIds } }).select('user photos program year');
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.user.toString(), p));

    // Format output
    const formatted = circles.map((c) => {
      const isOwner = c.creator?._id?.toString() === currentUserId.toString();
      const currentMember = c.members.find(
        (m) => m.user?._id?.toString() === currentUserId.toString()
      );
      const isMember = Boolean(currentMember);
      const isModerator = isOwner || currentMember?.role === 'moderator';

      const creatorProfile = c.creator?._id ? profileMap.get(c.creator._id.toString()) : null;

      const memberSummaries = c.members.map((m) => {
        const u = m.user;
        const pr = u?._id ? profileMap.get(u._id.toString()) : null;
        return {
          id: u?._id,
          name: u ? `${u.firstName} ${u.lastName}` : 'Student',
          firstName: u?.firstName || 'Student',
          avatar: pr?.photos?.[0] || null,
          program: pr?.program || 'MIT-WPU Student',
          role: m.role,
          joinedAt: m.joinedAt,
        };
      });

      return {
        id: c._id,
        _id: c._id,
        name: c.name,
        description: c.description,
        category: c.category,
        tags: c.tags || [],
        visibility: c.visibility,
        avatar: c.avatar,
        coverColor: c.coverColor,
        status: c.status,
        memberCount: c.members.length,
        isMember,
        isOwner,
        isModerator,
        role: currentMember?.role || null,
        creator: {
          id: c.creator?._id,
          name: c.creator ? `${c.creator.firstName} ${c.creator.lastName}` : 'Student',
          firstName: c.creator?.firstName || 'Student',
          avatar: creatorProfile?.photos?.[0] || null,
          program: creatorProfile?.program || 'MIT-WPU Student',
        },
        members: memberSummaries,
        createdAt: c.createdAt,
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
// @desc    Get details of a specific Campus Circle
// @route   GET /api/circles/:id
// @access  Private
// ============================================================================
const getCircleById = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const circle = await Circle.findById(id)
      .populate('creator', 'firstName lastName email isVerified role')
      .populate('members.user', 'firstName lastName email isVerified role');

    if (!circle || circle.status === 'archived') {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found or has been archived',
      });
    }

    // Check block rules
    if (circle.creator?._id) {
      const isBlocked = await Block.findOne({
        $or: [
          { blocker: currentUserId, blockedUser: circle.creator._id },
          { blocker: circle.creator._id, blockedUser: currentUserId },
        ],
      });

      if (isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Cannot access this circle due to block settings',
        });
      }
    }

    // Check private circle visibility
    const isMember = circle.members.some(
      (m) => m.user?._id?.toString() === currentUserId.toString()
    );

    if (circle.visibility === 'private' && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'This is a private circle. Access is restricted to invited members.',
      });
    }

    const isOwner = circle.creator?._id?.toString() === currentUserId.toString();
    const currentMember = circle.members.find(
      (m) => m.user?._id?.toString() === currentUserId.toString()
    );
    const isModerator = isOwner || currentMember?.role === 'moderator';

    // Fetch member profiles
    const userIds = [circle.creator._id, ...circle.members.map((m) => m.user?._id)].filter(Boolean);
    const profiles = await Profile.find({ user: { $in: userIds } }).select('user photos program year');
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.user.toString(), p));

    const creatorProfile = profileMap.get(circle.creator._id.toString());
    const memberSummaries = circle.members.map((m) => {
      const u = m.user;
      const pr = u?._id ? profileMap.get(u._id.toString()) : null;
      return {
        id: u?._id,
        name: u ? `${u.firstName} ${u.lastName}` : 'Student',
        firstName: u?.firstName || 'Student',
        avatar: pr?.photos?.[0] || null,
        program: pr?.program || 'MIT-WPU Student',
        role: m.role,
        joinedAt: m.joinedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        id: circle._id,
        _id: circle._id,
        name: circle.name,
        description: circle.description,
        category: circle.category,
        tags: circle.tags || [],
        visibility: circle.visibility,
        avatar: circle.avatar,
        coverColor: circle.coverColor,
        status: circle.status,
        memberCount: circle.members.length,
        isMember,
        isOwner,
        isModerator,
        role: currentMember?.role || null,
        creator: {
          id: circle.creator._id,
          name: `${circle.creator.firstName} ${circle.creator.lastName}`,
          firstName: circle.creator.firstName,
          avatar: creatorProfile?.photos?.[0] || null,
          program: creatorProfile?.program || 'MIT-WPU Student',
        },
        members: memberSummaries,
        createdAt: circle.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Join a Campus Circle
// @route   POST /api/circles/:id/join
// @access  Private
// ============================================================================
const joinCircle = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const existingCircle = await Circle.findById(id);
    if (!existingCircle || existingCircle.status === 'archived') {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found or is archived',
      });
    }

    if (existingCircle.members.some((m) => m.user.toString() === currentUserId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this circle',
      });
    }

    // Check block against creator
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: currentUserId, blockedUser: existingCircle.creator },
        { blocker: existingCircle.creator, blockedUser: currentUserId },
      ],
    });
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot join this circle due to block settings',
      });
    }

    // Atomic join
    const updatedCircle = await Circle.findOneAndUpdate(
      {
        _id: id,
        status: 'active',
        'members.user': { $ne: currentUserId },
      },
      {
        $push: {
          members: {
            user: currentUserId,
            role: 'member',
            joinedAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedCircle) {
      return res.status(400).json({
        success: false,
        message: 'Unable to join circle at this time',
      });
    }

    // Notify circle owner
    if (updatedCircle.creator.toString() !== currentUserId.toString()) {
      await Notification.create({
        recipient: updatedCircle.creator,
        sender: currentUserId,
        type: 'circle',
        title: 'New Member in Circle! ✨',
        message: `${req.user.firstName} joined your circle: "${updatedCircle.name}".`,
        data: { circleId: updatedCircle._id },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Welcome to ${updatedCircle.name}! 🎉`,
      data: {
        id: updatedCircle._id,
        memberCount: updatedCircle.members.length,
        isMember: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Leave a Campus Circle
// @route   POST /api/circles/:id/leave
// @access  Private
// ============================================================================
const leaveCircle = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const circle = await Circle.findById(id);
    if (!circle) {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found',
      });
    }

    if (circle.creator.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Circle owner cannot leave. You can transfer ownership or archive the circle.',
      });
    }

    const isMember = circle.members.some(
      (m) => m.user.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this circle',
      });
    }

    const updatedCircle = await Circle.findOneAndUpdate(
      { _id: id },
      { $pull: { members: { user: currentUserId } } },
      { returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: `You left ${circle.name}`,
      data: {
        id: updatedCircle._id,
        memberCount: updatedCircle.members.length,
        isMember: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Update Campus Circle details (Owner or Moderator only)
// @route   PUT /api/circles/:id
// @access  Private
// ============================================================================
const updateCircle = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const {
      name,
      description,
      category,
      tags,
      visibility,
      avatar,
      coverColor,
    } = req.body;

    const circle = await Circle.findById(id);
    if (!circle || circle.status === 'archived') {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found or archived',
      });
    }

    const isOwner = circle.creator.toString() === currentUserId.toString();
    const isModerator = circle.moderators.some(
      (m) => m.toString() === currentUserId.toString()
    );

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only circle owners or moderators can edit details',
      });
    }

    if (name && name.trim() !== circle.name) {
      const existing = await Circle.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Another circle already has this name',
        });
      }
      circle.name = name.trim();
    }

    if (description && description.trim().length >= 10) circle.description = description.trim();
    if (category) circle.category = category;
    if (Array.isArray(tags)) circle.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    if (visibility) circle.visibility = visibility === 'private' ? 'private' : 'public';
    if (avatar !== undefined) circle.avatar = avatar;
    if (coverColor) circle.coverColor = coverColor;

    await circle.save();

    return res.status(200).json({
      success: true,
      message: 'Circle updated successfully',
      data: circle,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Archive / Delete Campus Circle (Owner only)
// @route   POST /api/circles/:id/archive
// @access  Private
// ============================================================================
const archiveCircle = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const circle = await Circle.findById(id);
    if (!circle) {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found',
      });
    }

    if (circle.creator.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the circle owner can archive this community',
      });
    }

    circle.status = 'archived';
    await circle.save();

    return res.status(200).json({
      success: true,
      message: 'Circle has been archived',
      data: { id: circle._id, status: 'archived' },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Remove member from Circle (Owner or Moderator only)
// @route   POST /api/circles/:id/remove-member
// @access  Private
// ============================================================================
const removeMember = async (req, res, next) => {
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

    const circle = await Circle.findById(id);
    if (!circle) {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found',
      });
    }

    const isOwner = circle.creator.toString() === currentUserId.toString();
    const isModerator = circle.moderators.some(
      (m) => m.toString() === currentUserId.toString()
    );

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only owners or moderators can remove members',
      });
    }

    if (targetUserId.toString() === circle.creator.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the circle owner',
      });
    }

    const updatedCircle = await Circle.findOneAndUpdate(
      { _id: id },
      { $pull: { members: { user: targetUserId } } },
      { returnDocument: 'after' }
    );

    await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: 'circle',
      title: 'Removed from Circle',
      message: `You were removed from the circle "${circle.name}".`,
      data: { circleId: circle._id },
    });

    return res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: {
        id: updatedCircle._id,
        memberCount: updatedCircle.members.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Fetch Community Feed Posts for a Circle
// @route   GET /api/circles/:id/posts
// @access  Private
// ============================================================================
const getCirclePosts = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const circle = await Circle.findById(id);
    if (!circle || circle.status === 'archived') {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found or is archived',
      });
    }

    // If private, verify membership
    if (circle.visibility === 'private') {
      const isMember = circle.members.some(
        (m) => m.user.toString() === currentUserId.toString()
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access restricted: You must be a member of this private circle to view posts',
        });
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await CirclePost.countDocuments({ circle: id });
    const posts = await CirclePost.find({ circle: id })
      .populate('author', 'firstName lastName email isVerified role')
      .populate('comments.author', 'firstName lastName email isVerified role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Profile lookup for author avatars
    const authorIds = [];
    posts.forEach((p) => {
      if (p.author?._id) authorIds.push(p.author._id);
      p.comments.forEach((cm) => {
        if (cm.author?._id) authorIds.push(cm.author._id);
      });
    });

    const profiles = await Profile.find({ user: { $in: authorIds } }).select('user photos program year');
    const profileMap = new Map();
    profiles.forEach((pr) => profileMap.set(pr.user.toString(), pr));

    const formatted = posts.map((p) => {
      const isAuthor = p.author?._id?.toString() === currentUserId.toString();
      const isLiked = p.likes.some((uid) => uid.toString() === currentUserId.toString());
      const authorProfile = p.author?._id ? profileMap.get(p.author._id.toString()) : null;

      const formattedComments = p.comments.map((cm) => {
        const u = cm.author;
        const pr = u?._id ? profileMap.get(u._id.toString()) : null;
        return {
          id: cm._id,
          _id: cm._id,
          author: {
            id: u?._id,
            name: u ? `${u.firstName} ${u.lastName}` : 'Student',
            avatar: pr?.photos?.[0] || null,
          },
          text: cm.text,
          createdAt: cm.createdAt,
          isAuthor: u?._id?.toString() === currentUserId.toString(),
        };
      });

      return {
        id: p._id,
        _id: p._id,
        circleId: p.circle,
        content: p.content,
        mediaUrl: p.mediaUrl,
        author: {
          id: p.author?._id,
          name: p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Student',
          firstName: p.author?.firstName || 'Student',
          avatar: authorProfile?.photos?.[0] || null,
          program: authorProfile?.program || 'MIT-WPU Student',
          isVerified: p.author?.isVerified,
        },
        likesCount: p.likes.length,
        isLiked,
        commentsCount: p.comments.length,
        comments: formattedComments,
        isAuthor,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
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
// @desc    Create a Post in Circle Feed (Members only)
// @route   POST /api/circles/:id/posts
// @access  Private
// ============================================================================
const createCirclePost = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { content, mediaUrl } = req.body;

    const circle = await Circle.findById(id);
    if (!circle || circle.status === 'archived') {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found or archived',
      });
    }

    const isMember = circle.members.some(
      (m) => m.user.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only confirmed members can post in this circle. Please join first!',
      });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot be empty',
      });
    }

    if (content.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Post cannot exceed 2000 characters',
      });
    }

    const post = await CirclePost.create({
      circle: id,
      author: currentUserId,
      content: content.trim(),
      mediaUrl: mediaUrl || null,
      likes: [],
      comments: [],
    });

    const populated = await CirclePost.findById(post._id).populate(
      'author',
      'firstName lastName email isVerified role'
    );

    const userProfile = await Profile.findOne({ user: currentUserId }).select('photos program');

    return res.status(201).json({
      success: true,
      message: 'Post published to circle! 💬',
      data: {
        id: populated._id,
        _id: populated._id,
        circleId: id,
        content: populated.content,
        mediaUrl: populated.mediaUrl,
        author: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          avatar: userProfile?.photos?.[0] || null,
          program: userProfile?.program || 'MIT-WPU Student',
        },
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        comments: [],
        isAuthor: true,
        createdAt: populated.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Update a Circle Post (Author only)
// @route   PUT /api/circles/:id/posts/:postId
// @access  Private
// ============================================================================
const updateCirclePost = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id, postId } = req.params;
    const { content } = req.body;

    const post = await CirclePost.findOne({ _id: postId, circle: id });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own posts',
      });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content cannot be empty',
      });
    }

    post.content = content.trim();
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post updated',
      data: post,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Delete a Circle Post (Author or Circle Owner/Moderator)
// @route   DELETE /api/circles/:id/posts/:postId
// @access  Private
// ============================================================================
const deleteCirclePost = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id, postId } = req.params;

    const circle = await Circle.findById(id);
    const post = await CirclePost.findOne({ _id: postId, circle: id });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isAuthor = post.author.toString() === currentUserId.toString();
    const isCircleOwner = circle?.creator?.toString() === currentUserId.toString();
    const isCircleMod = circle?.moderators?.some(
      (m) => m.toString() === currentUserId.toString()
    );

    if (!isAuthor && !isCircleOwner && !isCircleMod) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to delete this post',
      });
    }

    await CirclePost.deleteOne({ _id: postId });

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Toggle Reaction / Like on Circle Post
// @route   POST /api/circles/:id/posts/:postId/react
// @access  Private
// ============================================================================
const toggleReaction = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id, postId } = req.params;

    const circle = await Circle.findById(id);
    if (!circle || circle.status === 'archived') {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found',
      });
    }

    const isMember = circle.members.some(
      (m) => m.user.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this circle to react to posts',
      });
    }

    const post = await CirclePost.findOne({ _id: postId, circle: id });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const alreadyLiked = post.likes.some(
      (uid) => uid.toString() === currentUserId.toString()
    );

    let updatedPost;
    if (alreadyLiked) {
      // Remove reaction
      updatedPost = await CirclePost.findByIdAndUpdate(
        postId,
        { $pull: { likes: currentUserId } },
        { returnDocument: 'after' }
      );
    } else {
      // Add reaction (duplicate safe)
      updatedPost = await CirclePost.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: currentUserId } },
        { returnDocument: 'after' }
      );
    }

    return res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      isLiked: !alreadyLiked,
      likesCount: updatedPost.likes.length,
      data: {
        postId: updatedPost._id,
        isLiked: !alreadyLiked,
        liked: !alreadyLiked,
        likesCount: updatedPost.likes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Add a comment to Circle Post
// @route   POST /api/circles/:id/posts/:postId/comments
// @access  Private
// ============================================================================
const addComment = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id, postId } = req.params;
    const { text } = req.body;

    const circle = await Circle.findById(id);
    if (!circle || circle.status === 'archived') {
      return res.status(404).json({
        success: false,
        message: 'Campus Circle not found',
      });
    }

    const isMember = circle.members.some(
      (m) => m.user.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You must be a member of this circle to comment',
      });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty',
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters',
      });
    }

    const updatedPost = await CirclePost.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            author: currentUserId,
            text: text.trim(),
          },
        },
      },
      { returnDocument: 'after' }
    ).populate('comments.author', 'firstName lastName email isVerified role');

    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];
    const userProfile = await Profile.findOne({ user: currentUserId }).select('photos program');

    return res.status(201).json({
      success: true,
      message: 'Comment added',
      data: {
        id: addedComment._id,
        _id: addedComment._id,
        text: addedComment.text,
        author: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          avatar: userProfile?.photos?.[0] || null,
        },
        createdAt: addedComment.createdAt,
        commentsCount: updatedPost.comments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Delete comment from Circle Post
// @route   DELETE /api/circles/:id/posts/:postId/comments/:commentId
// @access  Private
// ============================================================================
const deleteComment = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id, postId, commentId } = req.params;

    const circle = await Circle.findById(id);
    const post = await CirclePost.findOne({ _id: postId, circle: id });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const isCommentAuthor = comment.author.toString() === currentUserId.toString();
    const isPostAuthor = post.author.toString() === currentUserId.toString();
    const isCircleOwner = circle?.creator?.toString() === currentUserId.toString();
    const isCircleMod = circle?.moderators?.some(
      (m) => m.toString() === currentUserId.toString()
    );

    if (!isCommentAuthor && !isPostAuthor && !isCircleOwner && !isCircleMod) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to delete this comment',
      });
    }

    await CirclePost.findByIdAndUpdate(postId, {
      $pull: { comments: { _id: commentId } },
    });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCircle,
  getCircles,
  getCircleById,
  joinCircle,
  leaveCircle,
  updateCircle,
  archiveCircle,
  removeMember,
  getCirclePosts,
  createCirclePost,
  updateCirclePost,
  deleteCirclePost,
  toggleReaction,
  addComment,
  deleteComment,
};
