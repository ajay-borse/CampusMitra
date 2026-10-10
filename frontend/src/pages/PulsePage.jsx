import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Zap,
  MessageSquare,
  Heart,
  Bookmark,
  Share2,
  MoreVertical,
  Plus,
  Search,
  X,
  Image as ImageIcon,
  BarChart2,
  HelpCircle,
  Megaphone,
  Radio,
  Calendar,
  Check,
  Send,
  Trash2,
  Edit3,
  AlertCircle,
  Flag,
  Clock,
  MapPin,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { pulseApi } from '../api/pulseApi';
import { circleApi } from '../api/circleApi';
import { planApi } from '../api/planApi';
import apiClient from '../api/axiosClient';

const FEED_FILTERS = [
  { id: 'for-you', label: 'For You', icon: Sparkles },
  { id: 'circles', label: 'Joined Circles', icon: Radio },
  { id: 'questions', label: 'Questions & Advice', icon: HelpCircle },
  { id: 'plans', label: 'Campus Meetups', icon: Calendar },
  { id: 'bookmarks', label: 'Saved Posts', icon: Bookmark },
];

export default function PulsePage() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Feed State
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('for-you');
  const [searchQuery, setSearchQuery] = useState('');

  // User's joined circles & active plans for composer association
  const [myCircles, setMyCircles] = useState([]);
  const [myPlans, setMyPlans] = useState([]);

  // Composer Form State
  const [composerContent, setComposerContent] = useState('');
  const [composerCategory, setComposerCategory] = useState('general');
  const [composerMediaUrl, setComposerMediaUrl] = useState('');
  const [composerCircleId, setComposerCircleId] = useState('');
  const [composerPlanId, setComposerPlanId] = useState('');
  const [composerTags, setComposerTags] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiryHours, setPollExpiryHours] = useState('24');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Comments & Engagement State
  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: true/false }
  const [commentInputs, setCommentInputs] = useState({}); // { [postId]: string }
  const [commentLoading, setCommentLoading] = useState({});

  // Edit Post Modal State
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');

  // Report Modal State
  const [reportingItem, setReportingItem] = useState(null); // { type: 'post' | 'comment', id, reportedUserId }
  const [reportReason, setReportReason] = useState('Inappropriate content');
  const [reportDescription, setReportDescription] = useState('');

  // Fetch Feed
  const fetchFeed = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const params = { filter: activeFilter };
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await pulseApi.getFeed(params);
      if (res?.success) {
        setPosts(res.data || []);
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Your session has expired. Please log in again.');
        return;
      }
      setError(err.message || err.response?.data?.message || 'Failed to load Campus Pulse feed.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeFilter, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
    }
  }, [fetchFeed, isAuthenticated]);

  // Load user's circles and plans for composer
  useEffect(() => {
    if (!isAuthenticated) return;
    const loadUserContext = async () => {
      try {
        const [circlesRes, plansRes] = await Promise.all([
          circleApi.getCircles({ filter: 'mine' }),
          planApi.getPlans({ filter: 'mine' }),
        ]);
        if (circlesRes?.success) setMyCircles(circlesRes.data || []);
        if (plansRes?.success) setMyPlans(plansRes.data || []);
      } catch {
        // Silently catch auxiliary options
      }
    };
    loadUserContext();
  }, [isAuthenticated]);

  // ==========================================
  // Post Creation
  // ==========================================
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!composerContent.trim()) {
      showToast('Please write something to share on Campus Pulse.', 'error');
      return;
    }

    if (composerCategory === 'poll') {
      const validOptions = pollOptions.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        showToast('Please provide at least 2 valid poll options.', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        content: composerContent.trim(),
        category: composerCategory,
        mediaUrl: composerMediaUrl.trim() || undefined,
        circleId: composerCircleId || undefined,
        planId: composerPlanId || undefined,
        tags: composerTags ? composerTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      if (composerCategory === 'poll') {
        payload.poll = {
          question: composerContent.trim(),
          options: pollOptions.filter((opt) => opt.trim()).map((text) => ({ text: text.trim() })),
          expiresInHours: Number(pollExpiryHours),
        };
      }

      const res = await pulseApi.createPost(payload);
      if (res?.success) {
        showToast('Shared to Campus Pulse! 🌟', 'success');
        setComposerContent('');
        setComposerCategory('general');
        setComposerMediaUrl('');
        setComposerCircleId('');
        setComposerPlanId('');
        setComposerTags('');
        setPollOptions(['', '']);
        setShowMediaInput(false);
        // Refresh feed
        fetchFeed();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish post.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Engagement Actions
  // ==========================================
  const handleToggleLike = async (postId) => {
    try {
      const res = await pulseApi.toggleLike(postId);
      if (res?.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                isLiked: res.liked,
                likesCount: res.likesCount,
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update reaction.', 'error');
    }
  };

  const handleToggleBookmark = async (postId) => {
    try {
      const res = await pulseApi.toggleBookmark(postId);
      if (res?.success) {
        showToast(res.bookmarked ? 'Saved to bookmarks! 🔖' : 'Removed from bookmarks.', 'info');
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                isBookmarked: res.bookmarked,
                bookmarksCount: res.bookmarksCount,
              };
            }
            return p;
          })
        );
        if (activeFilter === 'bookmarks' && !res.bookmarked) {
          setPosts((prev) => prev.filter((p) => p._id !== postId));
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update bookmark.', 'error');
    }
  };

  const handleVotePoll = async (postId, optionIndex) => {
    try {
      const res = await pulseApi.votePoll(postId, optionIndex);
      if (res?.success) {
        showToast('Vote recorded! 📊', 'success');
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                poll: res.data,
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit vote.', 'error');
    }
  };

  const handleSharePost = (post) => {
    const postUrl = `${window.location.origin}/pulse?post=${post._id}`;
    navigator.clipboard.writeText(postUrl);
    showToast('Link copied to clipboard! 📋', 'success');
  };

  // ==========================================
  // Comment Actions
  // ==========================================
  const handleAddComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setCommentLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await pulseApi.addComment(postId, text);
      if (res?.success) {
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                commentsCount: (p.commentsCount || 0) + 1,
                comments: [...(p.comments || []), res.data],
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post comment.', 'error');
    } finally {
      setCommentLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await pulseApi.deleteComment(postId, commentId);
      if (res?.success) {
        showToast('Comment deleted.', 'info');
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                commentsCount: Math.max(0, (p.commentsCount || 1) - 1),
                comments: (p.comments || []).filter((c) => c._id !== commentId),
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete comment.', 'error');
    }
  };

  // ==========================================
  // Post Edit & Delete
  // ==========================================
  const handleOpenEdit = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await pulseApi.updatePost(editingPost._id, { content: editContent.trim() });
      if (res?.success) {
        showToast('Post updated successfully.', 'success');
        setPosts((prev) =>
          prev.map((p) => (p._id === editingPost._id ? { ...p, content: editContent.trim(), isEdited: true } : p))
        );
        setEditingPost(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to edit post.', 'error');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await pulseApi.deletePost(postId);
      if (res?.success) {
        showToast('Post deleted.', 'info');
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete post.', 'error');
    }
  };

  // ==========================================
  // Moderation / Report
  // ==========================================
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingItem) return;
    try {
      await apiClient.post('/api/reports', {
        reportedUserId: reportingItem.reportedUserId,
        reason: reportReason,
        description: `Pulse report (${reportingItem.type} ID: ${reportingItem.id}): ${reportDescription}`,
      });
      showToast('Report submitted to campus moderators for review.', 'success');
      setReportingItem(null);
      setReportDescription('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit report.', 'error');
    }
  };

  return (
    <div className="pulse-page-wrapper">
      {/* Hero Header */}
      <div className="pulse-hero-section">
        <div className="pulse-hero-content">
          <div className="hero-badge">
            <Zap size={14} className="text-violet" />
            <span>Campus Pulse • Real-time Feed</span>
          </div>
          <h1 className="pulse-hero-title">
            The Heartbeat of <span className="gradient-text">MIT-WPU Campus</span>
          </h1>
          <p className="pulse-hero-sub">
            Share discussions, vote on student polls, ask academic questions, and catch meetups happening across campus.
          </p>
        </div>
      </div>

      <div className="pulse-main-container">
        {/* Post Composer Box */}
        <div className="pulse-composer-card">
          <div className="composer-category-tabs">
            <button
              type="button"
              className={`comp-cat-btn ${composerCategory === 'general' ? 'active' : ''}`}
              onClick={() => setComposerCategory('general')}
            >
              <Flame size={14} /> General
            </button>
            <button
              type="button"
              className={`comp-cat-btn ${composerCategory === 'question' ? 'active' : ''}`}
              onClick={() => setComposerCategory('question')}
            >
              <HelpCircle size={14} /> Ask Campus
            </button>
            <button
              type="button"
              className={`comp-cat-btn ${composerCategory === 'poll' ? 'active' : ''}`}
              onClick={() => setComposerCategory('poll')}
            >
              <BarChart2 size={14} /> Create Poll
            </button>
            <button
              type="button"
              className={`comp-cat-btn ${composerCategory === 'announcement' ? 'active' : ''}`}
              onClick={() => setComposerCategory('announcement')}
            >
              <Megaphone size={14} /> Announcement
            </button>
          </div>

          <form onSubmit={handleCreatePost} className="composer-form">
            <textarea
              className="composer-textarea"
              placeholder={
                composerCategory === 'question'
                  ? 'Ask a question to student peers or seniors (e.g. syllabus tips, campus hackathons, lab exams)...'
                  : composerCategory === 'poll'
                  ? 'What question would you like campus students to vote on?'
                  : composerCategory === 'announcement'
                  ? 'Share an official or club announcement with the student body...'
                  : `What's on your mind today, ${user?.firstName || 'Student'}?`
              }
              value={composerContent}
              onChange={(e) => setComposerContent(e.target.value)}
              maxLength={2000}
              rows={3}
            />

            {/* Poll Builder Section if Category is Poll */}
            {composerCategory === 'poll' && (
              <div className="poll-builder-container">
                <span className="text-xs font-semibold text-muted">POLL OPTIONS (2 to 5)</span>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="poll-option-input-row">
                    <span className="option-num-badge">{idx + 1}</span>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      maxLength={100}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        className="poll-remove-opt-btn"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <div className="poll-builder-actions">
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted ml-auto">
                    <Clock size={13} />
                    <span>Closes in:</span>
                    <select
                      className="poll-expiry-select"
                      value={pollExpiryHours}
                      onChange={(e) => setPollExpiryHours(e.target.value)}
                    >
                      <option value="24">24 hours</option>
                      <option value="48">2 days</option>
                      <option value="72">3 days</option>
                      <option value="168">1 week</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Media URL Input */}
            {showMediaInput && (
              <div className="composer-media-row">
                <ImageIcon size={16} className="text-muted" />
                <input
                  type="url"
                  className="form-input composer-media-input"
                  placeholder="Paste image attachment URL (https://...)"
                  value={composerMediaUrl}
                  onChange={(e) => setComposerMediaUrl(e.target.value)}
                />
                {composerMediaUrl && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setComposerMediaUrl('')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* Optional Circle or Plan Association */}
            <div className="composer-associations-row">
              {myCircles.length > 0 && (
                <div className="assoc-select-box">
                  <Radio size={13} className="text-violet" />
                  <select
                    className="assoc-select"
                    value={composerCircleId}
                    onChange={(e) => setComposerCircleId(e.target.value)}
                  >
                    <option value="">Public Campus Feed</option>
                    {myCircles.map((c) => (
                      <option key={c._id} value={c._id}>
                        Circle: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {myPlans.length > 0 && (
                <div className="assoc-select-box">
                  <Calendar size={13} className="text-secondary" />
                  <select
                    className="assoc-select"
                    value={composerPlanId}
                    onChange={(e) => setComposerPlanId(e.target.value)}
                  >
                    <option value="">Link a Campus Plan (Optional)</option>
                    {myPlans.map((p) => (
                      <option key={p._id} value={p._id}>
                        Plan: {p.title} ({p.date})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Composer Footer */}
            <div className="composer-footer-row">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`composer-tool-btn ${showMediaInput ? 'active' : ''}`}
                  onClick={() => setShowMediaInput((prev) => !prev)}
                  title="Add image attachment"
                >
                  <ImageIcon size={16} />
                  <span>Image</span>
                </button>
                <span className="text-xs text-muted">
                  {composerContent.length}/2000
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm composer-submit-btn"
                disabled={submitting || !composerContent.trim()}
              >
                <Send size={15} />
                <span>{submitting ? 'Sharing...' : 'Post to Pulse'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Filter Navigation Bar */}
        <div className="pulse-filters-bar">
          <div className="pulse-filter-pills">
            {FEED_FILTERS.map((f) => {
              const Icon = f.icon;
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  className={`pulse-filter-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f.id)}
                >
                  <Icon size={14} />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="pulse-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search pulse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pulse-search-input"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner mb-4">
            <AlertCircle size={20} className="text-danger" />
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={fetchFeed}>
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="pulse-feed-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pulse-post-card skeleton-card">
                <div className="skeleton-bar title-bar" />
                <div className="skeleton-bar text-bar" />
                <div className="skeleton-bar meta-bar" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && posts.length === 0 && (
          <div className="empty-state-card">
            <Flame size={48} className="text-muted" />
            <h3 className="empty-state-title">Nothing on Pulse Yet</h3>
            <p className="empty-state-text">
              {activeFilter === 'bookmarks'
                ? "You haven't bookmarked any posts yet. Click the bookmark icon on any post to save it for later!"
                : activeFilter === 'circles'
                ? 'No posts from your joined circles yet. Join more circles or share the first post!'
                : 'No conversations matching this view. Start the discussion by posting above!'}
            </p>
          </div>
        )}

        {/* Feed Posts List */}
        {!loading && !error && posts.length > 0 && (
          <div className="pulse-feed-list">
            {posts.map((post) => {
              const isAuthor = (post.author?._id || post.author) === user?._id;
              const isCommentsOpen = !!expandedComments[post._id];

              return (
                <div key={post._id} className="pulse-post-card">
                  {/* Post Header */}
                  <div className="post-header-row">
                    <div className="post-author-info">
                      <div className="post-avatar">
                        {post.author?.avatar ? (
                          <img src={post.author.avatar} alt={post.author.firstName} />
                        ) : (
                          <span>{post.author?.firstName?.[0] || 'U'}</span>
                        )}
                      </div>
                      <div>
                        <div className="post-author-name">
                          {post.author?.firstName} {post.author?.lastName}
                          {post.author?.role === 'admin' && (
                            <span className="badge-admin">Admin</span>
                          )}
                        </div>
                        <div className="post-timestamp">
                          {post.author?.program || 'MIT-WPU Student'} •{' '}
                          {new Date(post.createdAt).toLocaleDateString()} at{' '}
                          {new Date(post.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {post.isEdited && <span className="text-muted"> (edited)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Category & Associations Badges */}
                    <div className="post-badges-right">
                      {post.category === 'question' && (
                        <span className="pulse-tag question">
                          <HelpCircle size={12} /> Question
                        </span>
                      )}
                      {post.category === 'poll' && (
                        <span className="pulse-tag poll">
                          <BarChart2 size={12} /> Poll
                        </span>
                      )}
                      {post.category === 'announcement' && (
                        <span className="pulse-tag announcement">
                          <Megaphone size={12} /> Notice
                        </span>
                      )}

                      {post.circle && (
                        <span
                          className="pulse-tag circle"
                          onClick={() => navigate('/circles')}
                          title="View Circle"
                        >
                          <Radio size={12} /> {post.circle.name}
                        </span>
                      )}

                      {/* Dropdown / Action options */}
                      <div className="relative-box">
                        <button
                          className="post-icon-btn"
                          onClick={() => {
                            if (isAuthor) {
                              if (window.confirm('Delete this post from Campus Pulse?')) {
                                handleDeletePost(post._id);
                              }
                            } else {
                              setReportingItem({
                                type: 'post',
                                id: post._id,
                                reportedUserId: post.author._id,
                              });
                            }
                          }}
                          title={isAuthor ? 'Delete Post' : 'Report Post'}
                        >
                          {isAuthor ? <Trash2 size={15} className="text-danger" /> : <Flag size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Post Content Text */}
                  <p className="post-content-text">{post.content}</p>

                  {/* Optional Media Image Attachment */}
                  {post.mediaUrl && (
                    <div className="post-media-box">
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Interactive Poll Widget */}
                  {post.poll && (
                    <div className="pulse-poll-card">
                      <div className="poll-header-info">
                        <span className="poll-total-votes">
                          <BarChart2 size={14} /> {post.poll.totalVotes}{' '}
                          {post.poll.totalVotes === 1 ? 'vote' : 'votes'}
                        </span>
                        {post.poll.isExpired ? (
                          <span className="poll-status-closed">Poll closed</span>
                        ) : post.poll.hasVoted ? (
                          <span className="poll-status-voted">
                            <Check size={13} /> You voted
                          </span>
                        ) : (
                          <span className="poll-status-open">Click to cast vote</span>
                        )}
                      </div>

                      <div className="poll-options-list">
                        {post.poll.options?.map((option, optIdx) => {
                          const isSelected = post.poll.userVotedOption === optIdx;
                          const showResults = post.poll.hasVoted || post.poll.isExpired;

                          return (
                            <button
                              key={option._id || optIdx}
                              className={`poll-option-bar ${isSelected ? 'selected' : ''}`}
                              disabled={showResults}
                              onClick={() => handleVotePoll(post._id, optIdx)}
                            >
                              {showResults && (
                                <div
                                  className="poll-bar-fill"
                                  style={{ width: `${option.percentage}%` }}
                                />
                              )}
                              <div className="poll-option-label">
                                <span className="flex items-center gap-2">
                                  {isSelected && <Check size={14} className="text-primary" />}
                                  {option.text}
                                </span>
                                {showResults && (
                                  <span className="poll-percentage font-semibold">
                                    {option.percentage}%
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Linked Campus Plan Embed Card */}
                  {post.plan && (
                    <div className="pulse-plan-embed">
                      <div className="plan-embed-top">
                        <span className="plan-badge">{post.plan.category} Meetup</span>
                        <span className="text-xs text-muted">
                          {post.plan.participantsCount} / {post.plan.capacity} students
                        </span>
                      </div>
                      <h4 className="plan-embed-title">{post.plan.title}</h4>
                      <div className="plan-embed-meta">
                        <span className="meta-item">
                          <Calendar size={13} /> {post.plan.date} at {post.plan.time}
                        </span>
                        <span className="meta-item">
                          <MapPin size={13} /> {post.plan.location}
                        </span>
                      </div>
                      <button
                        className="btn btn-outline btn-sm mt-3"
                        onClick={() => navigate('/plans')}
                      >
                        <span>View Campus Plan</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  )}

                  {/* Interaction Buttons Row */}
                  <div className="post-engagement-bar">
                    <button
                      className={`engagement-btn ${post.isLiked ? 'liked' : ''}`}
                      onClick={() => handleToggleLike(post._id)}
                      title="Like post"
                    >
                      <Heart size={16} className={post.isLiked ? 'fill-pink text-pink' : ''} />
                      <span>{post.likesCount || 0}</span>
                    </button>

                    <button
                      className="engagement-btn"
                      onClick={() =>
                        setExpandedComments((prev) => ({
                          ...prev,
                          [post._id]: !prev[post._id],
                        }))
                      }
                      title="Comments"
                    >
                      <MessageSquare size={16} />
                      <span>{post.commentsCount || 0}</span>
                    </button>

                    <button
                      className={`engagement-btn ${post.isBookmarked ? 'bookmarked' : ''}`}
                      onClick={() => handleToggleBookmark(post._id)}
                      title={post.isBookmarked ? 'Remove Bookmark' : 'Save Post'}
                    >
                      <Bookmark size={16} className={post.isBookmarked ? 'fill-violet text-violet' : ''} />
                      <span>{post.bookmarksCount || 0}</span>
                    </button>

                    <button
                      className="engagement-btn ml-auto"
                      onClick={() => handleSharePost(post)}
                      title="Share / Copy Link"
                    >
                      <Share2 size={16} />
                      <span>Share</span>
                    </button>
                  </div>

                  {/* Expandable Comments Drawer */}
                  {isCommentsOpen && (
                    <div className="post-comments-section">
                      {/* Comments List */}
                      {post.comments && post.comments.length > 0 ? (
                        <div className="comments-list">
                          {post.comments.map((comment) => {
                            const isCommentAuthor = (comment.author?._id || comment.author) === user?._id;

                            return (
                              <div key={comment._id} className="comment-bubble-item">
                                <div className="comment-content-block">
                                  <div className="comment-header-row">
                                    <span className="comment-author-name">
                                      {comment.author?.firstName} {comment.author?.lastName}
                                    </span>
                                    <span className="comment-time">
                                      {new Date(comment.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                    {isCommentAuthor && (
                                      <button
                                        className="comment-delete-icon"
                                        onClick={() => handleDeleteComment(post._id, comment._id)}
                                        title="Delete comment"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                  <p className="comment-body-text">{comment.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-muted py-2">
                          No replies yet. Be the first to spark the conversation!
                        </div>
                      )}

                      {/* Add Comment Input */}
                      <div className="comment-input-row">
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Write a comment..."
                          value={commentInputs[post._id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post._id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post._id);
                            }
                          }}
                        />
                        <button
                          className="btn btn-primary btn-sm comment-submit-btn"
                          disabled={
                            commentLoading[post._id] || !commentInputs[post._id]?.trim()
                          }
                          onClick={() => handleAddComment(post._id)}
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingItem && (
        <div className="modal-overlay" onClick={() => setReportingItem(null)}>
          <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Report Content</h2>
              <button className="modal-close-btn" onClick={() => setReportingItem(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="report-form mt-4">
              <div className="form-group">
                <label className="form-label">Reason *</label>
                <select
                  className="form-input"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="Spam">Spam</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Impersonation">Impersonation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Details (Optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Provide context for our moderation team..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setReportingItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
