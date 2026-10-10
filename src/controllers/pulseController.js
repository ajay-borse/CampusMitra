const PulsePost = require('../models/PulsePost');
const Circle = require('../models/Circle');
const Plan = require('../models/Plan');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const Block = require('../models/Block');

// Helper to format poll data with accurate counts and user voting state
const formatPollData = (poll, currentUserId) => {
  if (!poll || !poll.options || poll.options.length === 0) return null;

  const totalVotes = poll.votes ? poll.votes.length : 0;
  const userVote = poll.votes
    ? poll.votes.find((v) => v.user.toString() === currentUserId.toString())
    : null;

  const isExpired = poll.expiresAt ? new Date(poll.expiresAt) < new Date() : false;

  const optionsWithCounts = poll.options.map((opt, idx) => {
    const voteCount = poll.votes
      ? poll.votes.filter((v) => v.optionIndex === idx).length
      : 0;
    const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    return {
      _id: opt._id,
      text: opt.text,
      votes: voteCount,
      percentage,
    };
  });

  return {
    question: poll.question,
    options: optionsWithCounts,
    totalVotes,
    hasVoted: !!userVote,
    userVotedOption: userVote ? userVote.optionIndex : null,
    isExpired,
    expiresAt: poll.expiresAt,
  };
};

// Helper to format post with profile info
const formatPost = async (post, currentUserId, profileMap = new Map()) => {
  const authorId = post.author._id ? post.author._id.toString() : post.author.toString();
  let authorProfile = profileMap.get(authorId);
  if (!authorProfile) {
    authorProfile = await Profile.findOne({ user: authorId }).select('photos program department');
    if (authorProfile) profileMap.set(authorId, authorProfile);
  }

  const isLiked = (post.likes || []).some(
    (u) => (u._id || u).toString() === currentUserId.toString()
  );
  const isBookmarked = (post.bookmarks || []).some(
    (u) => (u._id || u).toString() === currentUserId.toString()
  );

  return {
    _id: post._id,
    id: post._id,
    content: post.content,
    category: post.category,
    tags: post.tags || [],
    mediaUrl: post.mediaUrl,
    visibility: post.visibility,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isEdited: post.isEdited,
    author: {
      _id: post.author._id || post.author,
      firstName: post.author.firstName,
      lastName: post.author.lastName,
      email: post.author.email,
      role: post.author.role,
      isVerified: post.author.isVerified,
      avatar: authorProfile?.photos?.[0] || null,
      program: authorProfile?.program || 'MIT-WPU Student',
      department: authorProfile?.department || null,
    },
    circle: post.circle
      ? {
          _id: post.circle._id || post.circle,
          name: post.circle.name,
          category: post.circle.category,
          visibility: post.circle.visibility,
        }
      : null,
    plan: post.plan
      ? {
          _id: post.plan._id || post.plan,
          title: post.plan.title,
          category: post.plan.category,
          date: post.plan.date,
          time: post.plan.time,
          location: post.plan.location,
          capacity: post.plan.capacity,
          participantsCount: post.plan.participants ? post.plan.participants.length : 1,
          status: post.plan.status,
        }
      : null,
    poll: formatPollData(post.poll, currentUserId),
    likesCount: post.likes ? post.likes.length : 0,
    isLiked,
    bookmarksCount: post.bookmarks ? post.bookmarks.length : 0,
    isBookmarked,
    commentsCount: post.comments ? post.comments.length : 0,
    comments: (post.comments || []).map((c) => ({
      _id: c._id,
      text: c.text,
      createdAt: c.createdAt,
      author: {
        _id: c.author?._id || c.author,
        firstName: c.author?.firstName || 'Student',
        lastName: c.author?.lastName || '',
      },
    })),
  };
};

// ============================================================================
// @desc    Get Personalized Campus Pulse Feed
// @route   GET /api/pulse
// @access  Private
// ============================================================================
const getPulseFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { filter = 'for-you', category, search, tag, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // 1. Get blocked users to hide their posts
    const blocks = await Block.find({
      $or: [{ blocker: currentUserId }, { blockedUser: currentUserId }],
    });
    const blockedUserIds = blocks.map((b) =>
      b.blocker.toString() === currentUserId.toString() ? b.blockedUser : b.blocker
    );

    // 2. Get user's joined circles
    const userCircles = await Circle.find({
      'members.user': currentUserId,
      status: 'active',
    }).select('_id');
    const joinedCircleIds = userCircles.map((c) => c._id);

    // 3. Construct Query based on filter
    const query = {
      author: { $nin: blockedUserIds },
    };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search && search.trim()) {
      query.content = { $regex: search.trim(), $options: 'i' };
    }

    if (filter === 'bookmarks') {
      // Only user's saved/bookmarked posts
      query.bookmarks = currentUserId;
    } else if (filter === 'circles') {
      // Only posts from user's joined circles
      query.circle = { $in: joinedCircleIds };
    } else if (filter === 'plans') {
      // Only posts with linked Campus Plans
      query.plan = { $ne: null };
    } else if (filter === 'questions') {
      // Only student questions & discussion prompts
      query.category = 'question';
    } else {
      // 'for-you' or default: public posts OR circle posts user has access to
      query.$or = [
        { visibility: 'public' },
        { circle: { $in: joinedCircleIds } },
        { author: currentUserId },
      ];
    }

    // Fetch posts
    const [posts, totalPosts] = await Promise.all([
      PulsePost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('author', 'firstName lastName email role isVerified')
        .populate('circle', 'name category visibility')
        .populate('plan', 'title category date time location capacity participants status')
        .populate('comments.author', 'firstName lastName'),
      PulsePost.countDocuments(query),
    ]);

    const profileMap = new Map();
    const formattedPosts = await Promise.all(
      posts.map((p) => formatPost(p, currentUserId, profileMap))
    );

    return res.status(200).json({
      success: true,
      data: formattedPosts,
      pagination: {
        total: totalPosts,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalPosts / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Create a Campus Pulse Post
// @route   POST /api/pulse
// @access  Private
// ============================================================================
const createPulsePost = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const {
      content,
      category = 'general',
      tags = [],
      mediaUrl = null,
      circleId = null,
      planId = null,
      poll = null,
    } = req.body;

    // Validate Category
    const allowedCategories = ['general', 'question', 'announcement', 'poll'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${allowedCategories.join(', ')}`,
      });
    }

    // Validate Content
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required and cannot be empty.',
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Post content cannot exceed 2000 characters.',
      });
    }

    // Validate mediaUrl
    if (mediaUrl && typeof mediaUrl === 'string') {
      if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
        return res.status(400).json({
          success: false,
          message: 'Image attachment must be a valid HTTP or HTTPS URL.',
        });
      }
    }

    // Validate Circle association and privacy
    let circleDoc = null;
    let postVisibility = 'public';
    if (circleId) {
      circleDoc = await Circle.findById(circleId);
      if (!circleDoc || circleDoc.status === 'archived') {
        return res.status(404).json({
          success: false,
          message: 'Associated Campus Circle not found or archived.',
        });
      }

      const isMember = circleDoc.members.some(
        (m) => m.user.toString() === currentUserId.toString()
      );
      if (circleDoc.visibility === 'private' && !isMember) {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of this private circle to post to it.',
        });
      }
      postVisibility = circleDoc.visibility;
    }

    // Validate Plan association
    let planDoc = null;
    if (planId) {
      planDoc = await Plan.findById(planId);
      if (!planDoc || planDoc.status === 'cancelled') {
        return res.status(404).json({
          success: false,
          message: 'Associated Campus Plan not found or cancelled.',
        });
      }
    }

    // Validate Poll if provided
    let pollPayload = null;
    if (category === 'poll' || poll) {
      if (!poll || !poll.options || !Array.isArray(poll.options)) {
        return res.status(400).json({
          success: false,
          message: 'Polls require at least 2 options.',
        });
      }

      const cleanOptions = poll.options
        .map((opt) => (typeof opt === 'string' ? opt.trim() : opt?.text?.trim()))
        .filter(Boolean);

      if (cleanOptions.length < 2 || cleanOptions.length > 6) {
        return res.status(400).json({
          success: false,
          message: 'Polls must contain between 2 and 6 valid options.',
        });
      }

      pollPayload = {
        question: poll.question?.trim() || content.trim(),
        options: cleanOptions.map((text) => ({ text })),
        votes: [],
        expiresAt: poll.expiresInHours
          ? new Date(Date.now() + Number(poll.expiresInHours) * 3600000)
          : null,
      };
    }

    const cleanTags = Array.isArray(tags)
      ? tags.map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean)
      : [];

    const newPost = await PulsePost.create({
      author: currentUserId,
      content: content.trim(),
      category: pollPayload ? 'poll' : category,
      tags: cleanTags,
      mediaUrl: mediaUrl?.trim() || null,
      circle: circleDoc ? circleDoc._id : null,
      plan: planDoc ? planDoc._id : null,
      visibility: postVisibility,
      poll: pollPayload,
    });

    const populated = await PulsePost.findById(newPost._id)
      .populate('author', 'firstName lastName email role isVerified')
      .populate('circle', 'name category visibility')
      .populate('plan', 'title category date time location capacity participants status');

    const formatted = await formatPost(populated, currentUserId);

    return res.status(201).json({
      success: true,
      message: 'Campus Pulse post published successfully! 🚀',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Get Single Pulse Post
// @route   GET /api/pulse/:id
// @access  Private
// ============================================================================
const getPulsePostById = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const post = await PulsePost.findById(id)
      .populate('author', 'firstName lastName email role isVerified')
      .populate('circle', 'name category visibility members')
      .populate('plan', 'title category date time location capacity participants status')
      .populate('comments.author', 'firstName lastName');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Pulse post not found.',
      });
    }

    // Check private circle permissions
    if (post.circle && post.circle.visibility === 'private') {
      const isMember = (post.circle.members || []).some(
        (m) => (m.user?._id || m.user).toString() === currentUserId.toString()
      );
      if (!isMember && post.author._id.toString() !== currentUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: This post belongs to a private circle.',
        });
      }
    }

    const formatted = await formatPost(post, currentUserId);

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Update Pulse Post
// @route   PUT /api/pulse/:id
// @access  Private (Author Only)
// ============================================================================
const updatePulsePost = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { content, tags } = req.body;

    const post = await PulsePost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Pulse post not found.',
      });
    }

    if (post.author.toString() !== currentUserId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own posts.',
      });
    }

    if (content !== undefined) {
      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Post content cannot be empty.',
        });
      }
      if (content.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Post content cannot exceed 2000 characters.',
        });
      }
      post.content = content.trim();
      post.isEdited = true;
    }

    if (tags !== undefined && Array.isArray(tags)) {
      post.tags = tags.map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
    }

    await post.save();

    const populated = await PulsePost.findById(id)
      .populate('author', 'firstName lastName email role isVerified')
      .populate('circle', 'name category visibility')
      .populate('plan', 'title category date time location capacity participants status')
      .populate('comments.author', 'firstName lastName');

    const formatted = await formatPost(populated, currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully.',
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Delete Pulse Post
// @route   DELETE /api/pulse/:id
// @access  Private (Author, Circle Mod, or Admin)
// ============================================================================
const deletePulsePost = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const post = await PulsePost.findById(id).populate('circle', 'creator moderators');
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Pulse post not found.',
      });
    }

    const isAuthor = post.author.toString() === currentUserId.toString();
    const isCircleOwner = post.circle?.creator?.toString() === currentUserId.toString();
    const isCircleMod = post.circle?.moderators?.some(
      (m) => m.toString() === currentUserId.toString()
    );
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isCircleOwner && !isCircleMod && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to delete this post.',
      });
    }

    await PulsePost.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Toggle Like on Pulse Post (Duplicate-safe)
// @route   POST /api/pulse/:id/like
// @access  Private
// ============================================================================
const toggleLikePost = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const post = await PulsePost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Pulse post not found.',
      });
    }

    const alreadyLiked = post.likes.some(
      (uid) => uid.toString() === currentUserId.toString()
    );

    let updatedPost;
    if (alreadyLiked) {
      updatedPost = await PulsePost.findByIdAndUpdate(
        id,
        { $pull: { likes: currentUserId } },
        { returnDocument: 'after' }
      );
    } else {
      updatedPost = await PulsePost.findByIdAndUpdate(
        id,
        { $addToSet: { likes: currentUserId } },
        { returnDocument: 'after' }
      );

      // Notify post author if someone else liked
      if (post.author.toString() !== currentUserId.toString()) {
        try {
          await Notification.create({
            recipient: post.author,
            sender: currentUserId,
            type: 'pulse',
            title: 'New Like on Campus Pulse',
            message: `${req.user.firstName} liked your post.`,
            data: { postId: post._id },
          });
        } catch {
          // Silent notification catch
        }
      }
    }

    return res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      isLiked: !alreadyLiked,
      likesCount: updatedPost.likes.length,
      data: {
        postId: updatedPost._id,
        isLiked: !alreadyLiked,
        likesCount: updatedPost.likes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Toggle Bookmark on Pulse Post (Duplicate-safe)
// @route   POST /api/pulse/:id/bookmark
// @access  Private
// ============================================================================
const toggleBookmarkPost = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;

    const post = await PulsePost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Pulse post not found.',
      });
    }

    const alreadyBookmarked = post.bookmarks.some(
      (uid) => uid.toString() === currentUserId.toString()
    );

    let updatedPost;
    if (alreadyBookmarked) {
      updatedPost = await PulsePost.findByIdAndUpdate(
        id,
        { $pull: { bookmarks: currentUserId } },
        { returnDocument: 'after' }
      );
    } else {
      updatedPost = await PulsePost.findByIdAndUpdate(
        id,
        { $addToSet: { bookmarks: currentUserId } },
        { returnDocument: 'after' }
      );
    }

    return res.status(200).json({
      success: true,
      bookmarked: !alreadyBookmarked,
      isBookmarked: !alreadyBookmarked,
      bookmarksCount: updatedPost.bookmarks.length,
      data: {
        postId: updatedPost._id,
        isBookmarked: !alreadyBookmarked,
        bookmarksCount: updatedPost.bookmarks.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Vote in Poll (Strict 1-Vote Enforcement)
// @route   POST /api/pulse/:id/vote
// @access  Private
// ============================================================================
const votePoll = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { optionIndex } = req.body;

    if (optionIndex === undefined || typeof optionIndex !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Valid optionIndex number is required.',
      });
    }

    const post = await PulsePost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Pulse post not found.',
      });
    }

    if (!post.poll || !post.poll.options || post.poll.options.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This post does not contain an active poll.',
      });
    }

    if (optionIndex < 0 || optionIndex >= post.poll.options.length) {
      return res.status(400).json({
        success: false,
        message: `Option index out of range (0 to ${post.poll.options.length - 1}).`,
      });
    }

    // Check expiration
    if (post.poll.expiresAt && new Date(post.poll.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This poll has closed and no longer accepts votes.',
      });
    }

    // Check duplicate vote
    const hasVoted = post.poll.votes.some(
      (v) => v.user.toString() === currentUserId.toString()
    );
    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this poll. Multiple votes are prohibited.',
      });
    }

    // Atomic vote push
    const updatedPost = await PulsePost.findOneAndUpdate(
      {
        _id: id,
        'poll.votes.user': { $ne: currentUserId },
      },
      {
        $push: {
          'poll.votes': {
            user: currentUserId,
            optionIndex,
            votedAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (!updatedPost) {
      return res.status(400).json({
        success: false,
        message: 'Vote could not be registered (possible duplicate vote).',
      });
    }

    const formattedPoll = formatPollData(updatedPost.poll, currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Vote cast successfully!',
      data: formattedPoll,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Add Comment to Pulse Post
// @route   POST /api/pulse/:id/comments
// @access  Private
// ============================================================================
const addComment = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.',
      });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters.',
      });
    }

    const post = await PulsePost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Pulse post not found.',
      });
    }

    const updatedPost = await PulsePost.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            author: currentUserId,
            text: text.trim(),
          },
        },
      },
      { returnDocument: 'after' }
    ).populate('comments.author', 'firstName lastName');

    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];

    // Notify author if not commenting on own post
    if (post.author.toString() !== currentUserId.toString()) {
      try {
        await Notification.create({
          recipient: post.author,
          sender: currentUserId,
          type: 'pulse',
          title: 'New Comment on Campus Pulse',
          message: `${req.user.firstName} commented on your post: "${text.trim().slice(0, 40)}..."`,
          data: { postId: post._id },
        });
      } catch {
        // Silent notification catch
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added.',
      data: {
        _id: addedComment._id,
        text: addedComment.text,
        createdAt: addedComment.createdAt,
        author: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
        },
        commentsCount: updatedPost.comments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// @desc    Delete Comment from Pulse Post
// @route   DELETE /api/pulse/:id/comments/:commentId
// @access  Private (Comment Author, Post Author, or Admin)
// ============================================================================
const deleteComment = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id, commentId } = req.params;

    const post = await PulsePost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Pulse post not found.',
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    const isCommentAuthor = comment.author.toString() === currentUserId.toString();
    const isPostAuthor = post.author.toString() === currentUserId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You do not have permission to delete this comment.',
      });
    }

    await PulsePost.findByIdAndUpdate(id, {
      $pull: { comments: { _id: commentId } },
    });

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPulseFeed,
  createPulsePost,
  getPulsePostById,
  updatePulsePost,
  deletePulsePost,
  toggleLikePost,
  toggleBookmarkPost,
  votePoll,
  addComment,
  deleteComment,
};
