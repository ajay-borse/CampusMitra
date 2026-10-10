import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Trash2,
  Edit3,
  BookOpen,
  Gamepad2,
  Trophy,
  Code,
  Compass,
  ArrowRight,
  ShieldAlert,
  Globe,
  Lock,
  Heart,
  Image as ImageIcon,
  Send,
  Calendar,
  Sparkles,
  Cpu,
  Camera,
  Music,
  Briefcase,
  Layers,
  Crown,
  Shield,
  UserX,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { circleApi } from '../api/circleApi';
import { planApi } from '../api/planApi';

const CATEGORIES = [
  { id: 'all', label: 'All Circles', icon: Compass },
  { id: 'Coding & DSA', label: 'Coding & DSA', icon: Code },
  { id: 'AI & Technology', label: 'AI & Tech', icon: Cpu },
  { id: 'Academic Study', label: 'Academic Study', icon: BookOpen },
  { id: 'Sports', label: 'Sports & Turf', icon: Trophy },
  { id: 'Gaming', label: 'Gaming & Esports', icon: Gamepad2 },
  { id: 'Photography', label: 'Photography', icon: Camera },
  { id: 'Music', label: 'Music & Audio', icon: Music },
  { id: 'Entrepreneurship', label: 'Startups & Business', icon: Briefcase },
  { id: 'Other', label: 'Other Vibe', icon: Layers },
];

export default function CirclesPage() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Circles List State
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'mine'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active Circle Detail View
  const [createCircleModalOpen, setCreateCircleModalOpen] = useState(false);
  const [editCircleModalOpen, setEditCircleModalOpen] = useState(false);
  const [activeCircle, setActiveCircle] = useState(null);
  const [activeCircleTab, setActiveCircleTab] = useState('feed'); // 'feed', 'plans', 'members'
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);

  // Circle Posts Feed State
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: true/false }
  const [commentInputs, setCommentInputs] = useState({}); // { [postId]: string }

  // Circle Linked Plans State
  const [circlePlans, setCirclePlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  // Action Loading
  const [actionLoading, setActionLoading] = useState(false);

  // Form State: Circle Create / Edit
  const [circleFormData, setCircleFormData] = useState({
    name: '',
    description: '',
    category: 'Coding & DSA',
    tags: '',
    visibility: 'public',
  });
  const [circleFormErrors, setCircleFormErrors] = useState({});

  // Form State: Circle Plan Creation
  const [planFormData, setPlanFormData] = useState({
    title: '',
    description: '',
    category: 'Study',
    date: new Date().toISOString().slice(0, 10),
    time: '17:00',
    duration: '1.5 hours',
    capacity: 6,
    location: '',
    tags: '',
  });
  const [planFormErrors, setPlanFormErrors] = useState({});

  // Fetch Circles
  const fetchCircles = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (activeTab === 'mine') params.filter = 'mine';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await circleApi.getCircles(params);
      if (res?.success) {
        setCircles(res.data || []);
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Your session has expired. Please log in again.');
        return;
      }
      setError(err.message || err.response?.data?.message || 'Failed to load Campus Circles.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedCategory, activeTab, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCircles();
    }
  }, [fetchCircles, isAuthenticated]);

  // Load active circle posts
  const loadCirclePosts = useCallback(async (circleId) => {
    setPostsLoading(true);
    try {
      const res = await circleApi.getCirclePosts(circleId);
      if (res?.success) {
        setPosts(res.data || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load circle posts.', 'error');
    } finally {
      setPostsLoading(false);
    }
  }, [showToast]);

  // Load active circle plans
  const loadCirclePlans = useCallback(async (circleId) => {
    setPlansLoading(true);
    try {
      const res = await planApi.getPlans({ circleId });
      if (res?.success) {
        setCirclePlans(res.data || []);
      }
    } catch {
      // silently handle plan error
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // When activeCircle is set, refresh data
  useEffect(() => {
    if (activeCircle?._id) {
      if (activeCircleTab === 'feed') {
        loadCirclePosts(activeCircle._id);
      } else if (activeCircleTab === 'plans') {
        loadCirclePlans(activeCircle._id);
      }
    }
  }, [activeCircle?._id, activeCircleTab, loadCirclePosts, loadCirclePlans]);

  // Open Circle Hub View
  const handleOpenCircle = async (circle) => {
    try {
      const res = await circleApi.getCircleById(circle._id);
      if (res?.success) {
        setActiveCircle(res.data);
        setActiveCircleTab('feed');
      } else {
        setActiveCircle(circle);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch circle details.', 'error');
    }
  };

  // Helper check: Is user a member of active circle?
  const isUserMember = (circle) => {
    if (!circle || !user?._id) return false;
    return circle.members?.some(
      (m) => (m.user?._id || m.user) === user._id
    );
  };

  // Helper check: Is user owner/moderator of active circle?
  const isUserOwnerOrMod = (circle) => {
    if (!circle || !user?._id) return false;
    const memberObj = circle.members?.find(
      (m) => (m.user?._id || m.user) === user._id
    );
    return memberObj?.role === 'owner' || memberObj?.role === 'moderator' || (circle.creator?._id || circle.creator) === user._id;
  };

  // Helper check: Is user owner of active circle?
  const isUserOwner = (circle) => {
    if (!circle || !user?._id) return false;
    const memberObj = circle.members?.find(
      (m) => (m.user?._id || m.user) === user._id
    );
    return memberObj?.role === 'owner' || (circle.creator?._id || circle.creator) === user._id;
  };

  // Join Circle
  const handleJoinCircle = async (circleId) => {
    setActionLoading(true);
    try {
      const res = await circleApi.joinCircle(circleId);
      if (res?.success) {
        showToast(res.message || 'Joined circle successfully! 🎉', 'success');
        fetchCircles();
        if (activeCircle?._id === circleId) {
          const fresh = await circleApi.getCircleById(circleId);
          if (fresh?.success) setActiveCircle(fresh.data);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join circle.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Leave Circle
  const handleLeaveCircle = async (circleId) => {
    if (!window.confirm('Are you sure you want to leave this circle?')) return;
    setActionLoading(true);
    try {
      const res = await circleApi.leaveCircle(circleId);
      if (res?.success) {
        showToast(res.message || 'Left circle.', 'info');
        fetchCircles();
        if (activeCircle?._id === circleId) {
          const fresh = await circleApi.getCircleById(circleId);
          if (fresh?.success) setActiveCircle(fresh.data);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to leave circle.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Archive / Delete Circle
  const handleArchiveCircle = async (circleId) => {
    if (!window.confirm('Are you sure you want to archive this circle? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      const res = await circleApi.archiveCircle(circleId);
      if (res?.success) {
        showToast('Circle archived successfully.', 'success');
        setActiveCircle(null);
        fetchCircles();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to archive circle.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (circleId, targetUserId) => {
    if (!window.confirm('Remove this student from the circle?')) return;
    setActionLoading(true);
    try {
      const res = await circleApi.removeMember(circleId, targetUserId);
      if (res?.success) {
        showToast('Member removed from circle.', 'info');
        const fresh = await circleApi.getCircleById(circleId);
        if (fresh?.success) setActiveCircle(fresh.data);
        fetchCircles();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove member.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Validate Circle Form
  const validateCircleForm = () => {
    const errs = {};
    if (!circleFormData.name.trim() || circleFormData.name.trim().length < 3 || circleFormData.name.trim().length > 80) {
      errs.name = 'Circle name must be between 3 and 80 characters.';
    }
    if (!circleFormData.description.trim() || circleFormData.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters.';
    }
    setCircleFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Circle (Create)
  const handleCreateCircle = async (e) => {
    e.preventDefault();
    if (!validateCircleForm()) return;

    setActionLoading(true);
    try {
      const payload = {
        name: circleFormData.name.trim(),
        description: circleFormData.description.trim(),
        category: circleFormData.category,
        visibility: circleFormData.visibility,
        tags: circleFormData.tags ? circleFormData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const res = await circleApi.createCircle(payload);
      if (res?.success) {
        showToast('Circle created successfully! 🌟', 'success');
        setCreateCircleModalOpen(false);
        setCircleFormData({
          name: '',
          description: '',
          category: 'Coding & DSA',
          tags: '',
          visibility: 'public',
        });
        fetchCircles();
        handleOpenCircle(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create circle.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditCircle = () => {
    if (!activeCircle) return;
    setCircleFormData({
      name: activeCircle.name,
      description: activeCircle.description,
      category: activeCircle.category,
      visibility: activeCircle.visibility || 'public',
      tags: (activeCircle.tags || []).join(', '),
    });
    setCircleFormErrors({});
    setEditCircleModalOpen(true);
  };

  // Submit Edit Circle
  const handleUpdateCircle = async (e) => {
    e.preventDefault();
    if (!validateCircleForm() || !activeCircle) return;

    setActionLoading(true);
    try {
      const payload = {
        name: circleFormData.name.trim(),
        description: circleFormData.description.trim(),
        category: circleFormData.category,
        visibility: circleFormData.visibility,
        tags: circleFormData.tags ? circleFormData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const res = await circleApi.updateCircle(activeCircle._id, payload);
      if (res?.success) {
        showToast('Circle updated successfully! ✨', 'success');
        setEditCircleModalOpen(false);
        setActiveCircle(res.data);
        fetchCircles();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update circle.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // Community Feed Actions
  // ==========================================

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() || !activeCircle) return;

    setActionLoading(true);
    try {
      const payload = {
        content: postContent.trim(),
        mediaUrl: postMediaUrl.trim() || undefined,
      };
      const res = await circleApi.createCirclePost(activeCircle._id, payload);
      if (res?.success) {
        showToast('Post shared to circle! 🚀', 'success');
        setPostContent('');
        setPostMediaUrl('');
        loadCirclePosts(activeCircle._id);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to publish post.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Reaction
  const handleToggleReaction = async (postId) => {
    if (!activeCircle) return;
    try {
      const res = await circleApi.toggleReaction(activeCircle._id, postId);
      if (res?.success) {
        // Optimistically or synchronously update post likes
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              const alreadyLiked = p.likes?.some((l) => (l._id || l) === user._id);
              let newLikes;
              if (alreadyLiked) {
                newLikes = p.likes.filter((l) => (l._id || l) !== user._id);
              } else {
                newLikes = [...(p.likes || []), user._id];
              }
              return { ...p, likes: newLikes };
            }
            return p;
          })
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to react to post.', 'error');
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const res = await circleApi.deleteCirclePost(activeCircle._id, postId);
      if (res?.success) {
        showToast('Post deleted.', 'info');
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete post.', 'error');
    }
  };

  // Submit Post Edit
  const handleSavePostEdit = async (postId) => {
    if (!editPostContent.trim()) return;
    try {
      const res = await circleApi.updateCirclePost(activeCircle._id, postId, { content: editPostContent.trim() });
      if (res?.success) {
        showToast('Post updated.', 'success');
        setEditingPostId(null);
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, content: editPostContent.trim(), isEdited: true } : p)));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to edit post.', 'error');
    }
  };

  // Add Comment
  const handleAddComment = async (postId) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !activeCircle) return;

    try {
      const res = await circleApi.addComment(activeCircle._id, postId, text);
      if (res?.success) {
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        // Refresh posts to get new comments populated
        loadCirclePosts(activeCircle._id);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit comment.', 'error');
    }
  };

  // Delete Comment
  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await circleApi.deleteComment(activeCircle._id, postId, commentId);
      if (res?.success) {
        showToast('Comment deleted.', 'info');
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return { ...p, comments: p.comments.filter((c) => c._id !== commentId) };
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
  // Circle Plan Creation
  // ==========================================

  const handleCreateCirclePlan = async (e) => {
    e.preventDefault();
    if (!planFormData.title.trim() || !planFormData.description.trim() || !planFormData.location.trim()) {
      showToast('Please fill in title, description, and location.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        title: planFormData.title.trim(),
        description: planFormData.description.trim(),
        category: planFormData.category,
        date: planFormData.date,
        time: planFormData.time,
        duration: planFormData.duration,
        capacity: Number(planFormData.capacity),
        location: planFormData.location.trim(),
        tags: planFormData.tags ? planFormData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        circleId: activeCircle._id,
      };

      const res = await planApi.createPlan(payload);
      if (res?.success) {
        showToast('Circle plan hosted successfully! 📅', 'success');
        setCreatePlanModalOpen(false);
        loadCirclePlans(activeCircle._id);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to host circle plan.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="circles-page-wrapper">
      {/* Hero Header */}
      <div className="circles-hero-section">
        <div className="circles-hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-violet" />
            <span>Campus Communities</span>
          </div>
          <h1 className="circles-hero-title">
            Discover & Build <span className="gradient-text">Campus Circles</span>
          </h1>
          <p className="circles-hero-sub">
            Join interest communities, discuss ideas in student feeds, share projects, and host circle meetups on campus.
          </p>
        </div>

        <div className="circles-hero-actions">
          {/* Search Box */}
          <div className="circles-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search circles by name, topics or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Create Circle Button */}
          <button
            className="btn btn-primary create-circle-btn"
            onClick={() => setCreateCircleModalOpen(true)}
          >
            <Plus size={18} />
            <span>Create Circle</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="circles-main-container">
        {/* Navigation Tabs */}
        <div className="circles-tabs-bar">
          <div className="circles-nav-tabs">
            <button
              className={`circle-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <Compass size={16} />
              <span>Explore Circles</span>
            </button>
            <button
              className={`circle-tab-btn ${activeTab === 'mine' ? 'active' : ''}`}
              onClick={() => setActiveTab('mine')}
            >
              <Users size={16} />
              <span>My Circles</span>
            </button>
          </div>

          <div className="circles-count-badge">
            {circles.length} {circles.length === 1 ? 'Circle' : 'Circles'} available
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="category-scroll-wrapper">
          <div className="category-pills-row">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`category-pill ${isSelected ? 'category-pill-active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="circles-cards-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="circle-card skeleton-card">
                <div className="skeleton-bar title-bar" />
                <div className="skeleton-bar text-bar" />
                <div className="skeleton-bar meta-bar" />
                <div className="skeleton-bar button-bar" />
              </div>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {!loading && error && (
          <div className="error-banner">
            <AlertCircle size={20} className="text-danger" />
            <span>{error}</span>
            <button className="btn btn-sm btn-ghost" onClick={fetchCircles}>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && circles.length === 0 && (
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <Users size={48} className="text-muted" />
            </div>
            <h3 className="empty-state-title">No Circles Found</h3>
            <p className="empty-state-text">
              {searchQuery
                ? `No communities matching "${searchQuery}". Try different keywords or browse all categories.`
                : activeTab === 'mine'
                ? "You haven't joined or created any circles yet. Explore and join one today!"
                : 'No circles currently in this category. Be the first to start a campus community!'}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setCreateCircleModalOpen(true)}
            >
              <Plus size={16} /> Create First Circle
            </button>
          </div>
        )}

        {/* Circles Cards Grid */}
        {!loading && !error && circles.length > 0 && (
          <div className="circles-cards-grid">
            {circles.map((circle) => {
              const joined = isUserMember(circle);
              const isOwner = isUserOwner(circle);
              const isPrivate = circle.visibility === 'private';

              return (
                <div key={circle._id} className="circle-card">
                  {/* Card Header */}
                  <div className="circle-card-header">
                    <div className="circle-cat-tag">
                      <span className="cat-badge">{circle.category}</span>
                      <span className={`visibility-badge ${isPrivate ? 'private' : 'public'}`}>
                        {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
                        <span>{isPrivate ? 'Private' : 'Public'}</span>
                      </span>
                    </div>

                    <div className="circle-members-pill">
                      <Users size={13} />
                      <span>{circle.membersCount || circle.members?.length || 1} members</span>
                    </div>
                  </div>

                  {/* Card Title & Description */}
                  <h3 className="circle-card-title">{circle.name}</h3>
                  <p className="circle-card-desc">{circle.description}</p>

                  {/* Tags */}
                  {circle.tags && circle.tags.length > 0 && (
                    <div className="circle-tags-list">
                      {circle.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="circle-tag-item">
                          #{tag}
                        </span>
                      ))}
                      {circle.tags.length > 3 && (
                        <span className="circle-tag-more">+{circle.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Card Footer / Actions */}
                  <div className="circle-card-footer">
                    <button
                      className="btn btn-outline circle-view-btn"
                      onClick={() => handleOpenCircle(circle)}
                    >
                      <span>Explore Hub</span>
                      <ArrowRight size={15} />
                    </button>

                    {joined ? (
                      <span className="joined-indicator">
                        <Check size={14} /> Joined
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm join-circle-btn"
                        disabled={actionLoading}
                        onClick={() => handleJoinCircle(circle._id)}
                      >
                        Join Circle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* CIRCLE HUB DETAIL VIEW MODAL                            */}
      {/* ======================================================== */}
      {activeCircle && (
        <div className="modal-overlay" onClick={() => setActiveCircle(null)}>
          <div
            className="modal-content circle-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="circle-detail-header">
              <div className="circle-detail-header-top">
                <div className="circle-detail-badges">
                  <span className="cat-badge">{activeCircle.category}</span>
                  <span
                    className={`visibility-badge ${
                      activeCircle.visibility === 'private' ? 'private' : 'public'
                    }`}
                  >
                    {activeCircle.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                    <span>{activeCircle.visibility === 'private' ? 'Private Community' : 'Public Community'}</span>
                  </span>
                  <span className="members-badge">
                    <Users size={13} />
                    <span>{activeCircle.membersCount || activeCircle.members?.length || 1} Students</span>
                  </span>
                </div>

                <div className="header-actions">
                  {isUserOwnerOrMod(activeCircle) && (
                    <button
                      className="icon-btn"
                      title="Edit Circle Details"
                      onClick={handleOpenEditCircle}
                    >
                      <Edit3 size={18} />
                    </button>
                  )}
                  {isUserOwner(activeCircle) && (
                    <button
                      className="icon-btn text-danger"
                      title="Archive Circle"
                      onClick={() => handleArchiveCircle(activeCircle._id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button
                    className="modal-close-btn"
                    onClick={() => setActiveCircle(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <h2 className="circle-detail-title">{activeCircle.name}</h2>
              <p className="circle-detail-desc">{activeCircle.description}</p>

              {/* Tags */}
              {activeCircle.tags && activeCircle.tags.length > 0 && (
                <div className="circle-tags-list mt-2">
                  {activeCircle.tags.map((tag, idx) => (
                    <span key={idx} className="circle-tag-item">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Join / Leave Button in Header */}
              <div className="circle-membership-actions mt-4">
                {isUserMember(activeCircle) ? (
                  <div className="flex items-center gap-3">
                    <span className="joined-indicator">
                      <Check size={16} /> Member
                    </span>
                    {!isUserOwner(activeCircle) && (
                      <button
                        className="btn btn-sm btn-ghost text-muted"
                        disabled={actionLoading}
                        onClick={() => handleLeaveCircle(activeCircle._id)}
                      >
                        Leave Circle
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={actionLoading}
                    onClick={() => handleJoinCircle(activeCircle._id)}
                  >
                    <Plus size={16} /> Join this Circle
                  </button>
                )}
              </div>

              {/* Sub-tabs: Community Feed | Circle Plans | Members */}
              <div className="circle-subtabs-row">
                <button
                  className={`subtab-btn ${activeCircleTab === 'feed' ? 'active' : ''}`}
                  onClick={() => setActiveCircleTab('feed')}
                >
                  <MessageSquare size={16} />
                  <span>Community Feed</span>
                </button>
                <button
                  className={`subtab-btn ${activeCircleTab === 'plans' ? 'active' : ''}`}
                  onClick={() => setActiveCircleTab('plans')}
                >
                  <Calendar size={16} />
                  <span>Circle Plans ({circlePlans.length})</span>
                </button>
                <button
                  className={`subtab-btn ${activeCircleTab === 'members' ? 'active' : ''}`}
                  onClick={() => setActiveCircleTab('members')}
                >
                  <Users size={16} />
                  <span>Members ({activeCircle.members?.length || 1})</span>
                </button>
              </div>
            </div>

            {/* Modal Body Based on Active Sub-Tab */}
            <div className="circle-detail-body">
              {/* TAB 1: COMMUNITY FEED */}
              {activeCircleTab === 'feed' && (
                <div className="circle-feed-wrapper">
                  {/* Create Post Box (Available if member or public circle) */}
                  {isUserMember(activeCircle) ? (
                    <form className="feed-composer-box" onSubmit={handleCreatePost}>
                      <textarea
                        className="composer-textarea"
                        placeholder={`Share an update, question, or resource with ${activeCircle.name}...`}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        maxLength={2000}
                        rows={3}
                      />

                      <div className="composer-footer">
                        <div className="media-url-input-box">
                          <ImageIcon size={16} className="text-muted" />
                          <input
                            type="url"
                            placeholder="Optional image attachment URL..."
                            value={postMediaUrl}
                            onChange={(e) => setPostMediaUrl(e.target.value)}
                            className="media-url-input"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted">
                            {postContent.length}/2000
                          </span>
                          <button
                            type="submit"
                            className="btn btn-primary btn-sm composer-send-btn"
                            disabled={actionLoading || !postContent.trim()}
                          >
                            <Send size={15} />
                            <span>Post</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="feed-join-prompt">
                      <Lock size={20} className="text-violet" />
                      <div>
                        <strong>Join this circle to join the conversation!</strong>
                        <p className="text-xs text-muted">
                          Members can post questions, share code, and discuss topics with fellow students.
                        </p>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleJoinCircle(activeCircle._id)}
                      >
                        Join Now
                      </button>
                    </div>
                  )}

                  {/* Posts List */}
                  {postsLoading && (
                    <div className="py-6 text-center text-muted">Loading circle community feed...</div>
                  )}

                  {!postsLoading && posts.length === 0 && (
                    <div className="feed-empty-state">
                      <MessageSquare size={36} className="text-muted" />
                      <p>No posts in this community yet. Be the first to spark a conversation!</p>
                    </div>
                  )}

                  {!postsLoading && posts.length > 0 && (
                    <div className="feed-posts-list">
                      {posts.map((post) => {
                        const isLiked = post.likes?.some((l) => (l._id || l) === user._id);
                        const isAuthor = (post.author?._id || post.author) === user._id;
                        const canDelete = isAuthor || isUserOwnerOrMod(activeCircle);
                        const isCommentsOpen = !!expandedComments[post._id];

                        return (
                          <div key={post._id} className="feed-post-card">
                            {/* Post Header */}
                            <div className="post-header-row">
                              <div className="post-author-info">
                                <div className="post-avatar">
                                  {post.author?.profile?.photos?.[0] ? (
                                    <img
                                      src={post.author.profile.photos[0]}
                                      alt={post.author.firstName}
                                    />
                                  ) : (
                                    <span>{post.author?.firstName?.[0] || 'U'}</span>
                                  )}
                                </div>
                                <div>
                                  <div className="post-author-name">
                                    {post.author?.firstName} {post.author?.lastName}
                                    {isAuthor && <span className="author-badge">You</span>}
                                  </div>
                                  <div className="post-timestamp">
                                    {new Date(post.createdAt).toLocaleDateString()} at{' '}
                                    {new Date(post.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {post.isEdited && <span className="text-xs text-muted"> (edited)</span>}
                                  </div>
                                </div>
                              </div>

                              {/* Author/Mod Controls */}
                              <div className="post-actions-right">
                                {isAuthor && (
                                  <button
                                    className="post-icon-btn"
                                    title="Edit Post"
                                    onClick={() => {
                                      setEditingPostId(post._id);
                                      setEditPostContent(post.content);
                                    }}
                                  >
                                    <Edit3 size={15} />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    className="post-icon-btn text-danger"
                                    title="Delete Post"
                                    onClick={() => handleDeletePost(post._id)}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Post Content */}
                            {editingPostId === post._id ? (
                              <div className="post-edit-box">
                                <textarea
                                  className="form-input"
                                  value={editPostContent}
                                  onChange={(e) => setEditPostContent(e.target.value)}
                                  rows={3}
                                />
                                <div className="flex gap-2 justify-end mt-2">
                                  <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => setEditingPostId(null)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => handleSavePostEdit(post._id)}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="post-content-text">{post.content}</p>
                            )}

                            {/* Media Attachment */}
                            {post.mediaUrl && (
                              <div className="post-media-attachment">
                                <img
                                  src={post.mediaUrl}
                                  alt="Post attachment"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            {/* Post Stats & Reactions Row */}
                            <div className="post-interactions-row">
                              <button
                                className={`reaction-btn ${isLiked ? 'active' : ''}`}
                                onClick={() => handleToggleReaction(post._id)}
                              >
                                <Heart size={16} className={isLiked ? 'fill-pink text-pink' : ''} />
                                <span>{post.likes?.length || 0}</span>
                              </button>

                              <button
                                className="reaction-btn"
                                onClick={() =>
                                  setExpandedComments((prev) => ({
                                    ...prev,
                                    [post._id]: !prev[post._id],
                                  }))
                                }
                              >
                                <MessageSquare size={16} />
                                <span>{post.comments?.length || 0} Comments</span>
                              </button>
                            </div>

                            {/* Expandable Comments Section */}
                            {isCommentsOpen && (
                              <div className="post-comments-container">
                                {/* Comments List */}
                                {post.comments && post.comments.length > 0 ? (
                                  <div className="comments-list">
                                    {post.comments.map((comment) => {
                                      const isCommentAuthor =
                                        (comment.author?._id || comment.author) === user._id;
                                      const canDeleteComment =
                                        isCommentAuthor || isUserOwnerOrMod(activeCircle);

                                      return (
                                        <div key={comment._id} className="comment-item">
                                          <div className="comment-author-avatar">
                                            {comment.author?.profile?.photos?.[0] ? (
                                              <img
                                                src={comment.author.profile.photos[0]}
                                                alt={comment.author.firstName}
                                              />
                                            ) : (
                                              <span>{comment.author?.firstName?.[0] || 'U'}</span>
                                            )}
                                          </div>
                                          <div className="comment-body">
                                            <div className="comment-header">
                                              <span className="comment-author-name">
                                                {comment.author?.firstName} {comment.author?.lastName}
                                              </span>
                                              <span className="comment-time">
                                                {new Date(comment.createdAt).toLocaleTimeString([], {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                })}
                                              </span>
                                              {canDeleteComment && (
                                                <button
                                                  className="comment-delete-btn"
                                                  title="Delete Comment"
                                                  onClick={() =>
                                                    handleDeleteComment(post._id, comment._id)
                                                  }
                                                >
                                                  <Trash2 size={12} />
                                                </button>
                                              )}
                                            </div>
                                            <p className="comment-text">{comment.text}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted py-2">
                                    No comments yet. Write the first response!
                                  </div>
                                )}

                                {/* Add Comment Input */}
                                {isUserMember(activeCircle) && (
                                  <div className="comment-composer-row">
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
                                      className="btn btn-sm btn-primary"
                                      disabled={!commentInputs[post._id]?.trim()}
                                      onClick={() => handleAddComment(post._id)}
                                    >
                                      Reply
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CIRCLE PLANS */}
              {activeCircleTab === 'plans' && (
                <div className="circle-plans-wrapper">
                  <div className="circle-plans-header">
                    <div>
                      <h4 className="font-semibold text-lg">Circle Activities & Meetups</h4>
                      <p className="text-sm text-muted">
                        Campus Plans organized exclusively by members of {activeCircle.name}.
                      </p>
                    </div>

                    {isUserMember(activeCircle) && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setCreatePlanModalOpen(true)}
                      >
                        <Plus size={16} /> Host Circle Plan
                      </button>
                    )}
                  </div>

                  {plansLoading && (
                    <div className="py-6 text-center text-muted">Loading circle meetups...</div>
                  )}

                  {!plansLoading && circlePlans.length === 0 && (
                    <div className="empty-state-card mt-4">
                      <Calendar size={36} className="text-muted" />
                      <h4 className="font-semibold mt-2">No Plans Hosted Yet</h4>
                      <p className="text-sm text-muted">
                        Be the first to organize a study session, code sprint, or meetup for this circle!
                      </p>
                      {isUserMember(activeCircle) && (
                        <button
                          className="btn btn-primary btn-sm mt-3"
                          onClick={() => setCreatePlanModalOpen(true)}
                        >
                          <Plus size={15} /> Host First Plan
                        </button>
                      )}
                    </div>
                  )}

                  {!plansLoading && circlePlans.length > 0 && (
                    <div className="circle-plans-grid mt-4">
                      {circlePlans.map((plan) => (
                        <div key={plan._id} className="circle-plan-card">
                          <div className="plan-category-badge">{plan.category}</div>
                          <h4 className="font-bold text-base mt-2">{plan.title}</h4>
                          <p className="text-xs text-muted line-clamp-2 mt-1">{plan.description}</p>

                          <div className="plan-meta-items mt-3">
                            <div className="meta-item">
                              <Calendar size={13} />
                              <span>{plan.date} at {plan.time}</span>
                            </div>
                            <div className="meta-item">
                              <MapPin size={13} />
                              <span>{plan.location}</span>
                            </div>
                            <div className="meta-item">
                              <Users size={13} />
                              <span>{plan.participants?.length || 1} / {plan.capacity} students</span>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-between items-center">
                            <span className="text-xs text-violet font-medium">
                              Host: {plan.creator?.firstName}
                            </span>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => navigate('/plans')}
                            >
                              View in Plans <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MEMBERS ROSTER */}
              {activeCircleTab === 'members' && (
                <div className="circle-members-wrapper">
                  <div className="circle-members-header">
                    <h4 className="font-semibold text-lg">Circle Roster</h4>
                    <span className="text-xs text-muted">
                      {activeCircle.members?.length || 1} Total Student Members
                    </span>
                  </div>

                  <div className="members-grid mt-4">
                    {activeCircle.members?.map((member) => {
                      const memberUser = member.user || {};
                      const isOwnerMember = member.role === 'owner';
                      const isModMember = member.role === 'moderator';
                      const isSelf = memberUser._id === user._id;
                      const canRemove = isUserOwnerOrMod(activeCircle) && !isOwnerMember && !isSelf;

                      return (
                        <div key={memberUser._id || member._id} className="member-roster-card">
                          <div className="member-avatar">
                            {memberUser.profile?.photos?.[0] ? (
                              <img
                                src={memberUser.profile.photos[0]}
                                alt={memberUser.firstName}
                              />
                            ) : (
                              <span>{memberUser.firstName?.[0] || 'U'}</span>
                            )}
                          </div>

                          <div className="member-info">
                            <div className="member-name-row">
                              <span className="member-name">
                                {memberUser.firstName} {memberUser.lastName}
                              </span>
                              {isOwnerMember && (
                                <span className="role-badge owner">
                                  <Crown size={12} /> Owner
                                </span>
                              )}
                              {isModMember && (
                                <span className="role-badge moderator">
                                  <Shield size={12} /> Mod
                                </span>
                              )}
                            </div>
                            <div className="member-subtext">
                              {memberUser.profile?.department || 'Student'} • Joined{' '}
                              {new Date(member.joinedAt || activeCircle.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          {canRemove && (
                            <button
                              className="member-remove-btn"
                              title="Remove member from circle"
                              onClick={() => handleRemoveMember(activeCircle._id, memberUser._id)}
                            >
                              <UserX size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE CIRCLE MODAL                                      */}
      {/* ======================================================== */}
      {createCircleModalOpen && (
        <div className="modal-overlay" onClick={() => setCreateCircleModalOpen(false)}>
          <div
            className="modal-content circle-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Create Campus Circle</h2>
              <button
                className="modal-close-btn"
                onClick={() => setCreateCircleModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCircle} className="circle-form">
              <div className="form-group">
                <label className="form-label">Circle Name *</label>
                <input
                  type="text"
                  className={`form-input ${circleFormErrors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Competitive Programmers Club, AI Research Hub..."
                  value={circleFormData.name}
                  onChange={(e) =>
                    setCircleFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  maxLength={80}
                />
                {circleFormErrors.name && (
                  <span className="error-text">{circleFormErrors.name}</span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={circleFormData.category}
                    onChange={(e) =>
                      setCircleFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Visibility *</label>
                  <select
                    className="form-input"
                    value={circleFormData.visibility}
                    onChange={(e) =>
                      setCircleFormData((prev) => ({ ...prev, visibility: e.target.value }))
                    }
                  >
                    <option value="public">Public (Open for all campus students)</option>
                    <option value="private">Private (Restricted community)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className={`form-input ${circleFormErrors.description ? 'input-error' : ''}`}
                  placeholder="Explain what this circle is about, activities, weekly meets, goals..."
                  rows={4}
                  value={circleFormData.description}
                  onChange={(e) =>
                    setCircleFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  maxLength={1000}
                />
                {circleFormErrors.description && (
                  <span className="error-text">{circleFormErrors.description}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. leetcode, python, hackathons, web3"
                  value={circleFormData.tags}
                  onChange={(e) =>
                    setCircleFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setCreateCircleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Creating Circle...' : 'Launch Circle 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT CIRCLE MODAL                                        */}
      {/* ======================================================== */}
      {editCircleModalOpen && (
        <div className="modal-overlay" onClick={() => setEditCircleModalOpen(false)}>
          <div
            className="modal-content circle-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Edit Circle Details</h2>
              <button
                className="modal-close-btn"
                onClick={() => setEditCircleModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCircle} className="circle-form">
              <div className="form-group">
                <label className="form-label">Circle Name *</label>
                <input
                  type="text"
                  className={`form-input ${circleFormErrors.name ? 'input-error' : ''}`}
                  value={circleFormData.name}
                  onChange={(e) =>
                    setCircleFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  maxLength={80}
                />
                {circleFormErrors.name && (
                  <span className="error-text">{circleFormErrors.name}</span>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={circleFormData.category}
                    onChange={(e) =>
                      setCircleFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Visibility *</label>
                  <select
                    className="form-input"
                    value={circleFormData.visibility}
                    onChange={(e) =>
                      setCircleFormData((prev) => ({ ...prev, visibility: e.target.value }))
                    }
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className={`form-input ${circleFormErrors.description ? 'input-error' : ''}`}
                  rows={4}
                  value={circleFormData.description}
                  onChange={(e) =>
                    setCircleFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  maxLength={1000}
                />
                {circleFormErrors.description && (
                  <span className="error-text">{circleFormErrors.description}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={circleFormData.tags}
                  onChange={(e) =>
                    setCircleFormData((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setEditCircleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* HOST CIRCLE PLAN MODAL                                   */}
      {/* ======================================================== */}
      {createPlanModalOpen && activeCircle && (
        <div className="modal-overlay" onClick={() => setCreatePlanModalOpen(false)}>
          <div
            className="modal-content circle-form-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title">Host Plan for {activeCircle.name}</h2>
              <button
                className="modal-close-btn"
                onClick={() => setCreatePlanModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCirclePlan} className="circle-form">
              <div className="form-group">
                <label className="form-label">Activity Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Graph Algorithms Whiteboard Session"
                  value={planFormData.title}
                  onChange={(e) =>
                    setPlanFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={planFormData.date}
                    onChange={(e) =>
                      setPlanFormData((prev) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={planFormData.time}
                    onChange={(e) =>
                      setPlanFormData((prev) => ({ ...prev, time: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Capacity *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="2"
                    max="50"
                    value={planFormData.capacity}
                    onChange={(e) =>
                      setPlanFormData((prev) => ({ ...prev, capacity: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Meeting Location *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Library 2nd Floor Discussion Pod B"
                  value={planFormData.location}
                  onChange={(e) =>
                    setPlanFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plan Description *</label>
                <textarea
                  className="form-input"
                  placeholder="What will members do together during this session?"
                  rows={3}
                  value={planFormData.description}
                  onChange={(e) =>
                    setPlanFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setCreatePlanModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Scheduling...' : 'Schedule Circle Plan 📅'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
