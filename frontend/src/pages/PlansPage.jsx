import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Check,
  X,
  MessageSquare,
  AlertCircle,
  Trash2,
  Edit3,
  Coffee,
  BookOpen,
  Gamepad2,
  Trophy,
  Code,
  Utensils,
  PartyPopper,
  Compass,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { planApi } from '../api/planApi';

const CATEGORIES = [
  { id: 'all', label: 'All Plans', icon: Compass },
  { id: 'Study', label: 'Study & Library', icon: BookOpen },
  { id: 'Coding', label: 'Coding & Hack', icon: Code },
  { id: 'Coffee', label: 'Coffee Breaks', icon: Coffee },
  { id: 'Sports', label: 'Sports & Turf', icon: Trophy },
  { id: 'Gaming', label: 'Gaming Sessions', icon: Gamepad2 },
  { id: 'Food', label: 'Food & Cafeteria', icon: Utensils },
  { id: 'Events', label: 'Campus Events', icon: PartyPopper },
];

export default function PlansPage() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Feed State
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'mine'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);
  const [editPlan, setEditPlan] = useState(null);
  const [cancellingPlanId, setCancellingPlanId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Study',
    date: new Date().toISOString().slice(0, 10),
    time: '16:00',
    duration: '1 hour',
    capacity: 4,
    location: '',
    locationType: 'campus',
    tags: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (activeTab === 'today') params.filter = 'today';
      if (activeTab === 'mine') params.filter = 'mine';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await planApi.getPlans(params);
      if (res?.success) {
        setPlans(res.data || []);
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Your session has expired. Please log in again.');
        return;
      }
      setError(err.message || err.response?.data?.message || 'Failed to load campus plans.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedCategory, activeTab, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlans();
    }
  }, [fetchPlans, isAuthenticated]);

  // Form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters.';
    }
    if (!formData.description.trim()) {
      errs.description = 'Description is required.';
    }
    if (!formData.date) {
      errs.date = 'Date is required.';
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (formData.date < todayStr) {
        errs.date = 'Date cannot be in the past.';
      }
    }
    if (!formData.time.trim()) {
      errs.time = 'Start time is required.';
    }
    if (!formData.duration.trim()) {
      errs.duration = 'Approximate duration is required.';
    }
    const cap = Number(formData.capacity);
    if (isNaN(cap) || cap < 2 || cap > 50) {
      errs.capacity = 'Capacity must be between 2 and 50 participants.';
    }
    if (!formData.location.trim()) {
      errs.location = 'Meeting location is required.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Plan (Create or Edit)
  const handleSubmitPlan = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        tags: typeof formData.tags === 'string'
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : formData.tags,
      };

      if (editPlan) {
        await planApi.updatePlan(editPlan.id || editPlan._id, payload);
        showToast('Plan updated successfully! ✨', 'success');
        setEditPlan(null);
      } else {
        await planApi.createPlan(payload);
        showToast('Campus plan created! Students can now discover and join 🚀', 'success');
      }

      setCreateModalOpen(false);
      resetForm();
      fetchPlans();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving plan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Study',
      date: new Date().toISOString().slice(0, 10),
      time: '16:00',
      duration: '1 hour',
      capacity: 4,
      location: '',
      locationType: 'campus',
      tags: '',
    });
    setFormErrors({});
  };

  const openEditModal = (p) => {
    setEditPlan(p);
    setFormData({
      title: p.title,
      description: p.description,
      category: p.category,
      date: p.date,
      time: p.time,
      duration: p.duration,
      capacity: p.capacity,
      location: p.location,
      locationType: p.locationType || 'campus',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
    });
    setDetailPlan(null);
    setCreateModalOpen(true);
  };

  // Join Plan
  const handleJoinPlan = async (planId) => {
    setActionLoading(true);
    try {
      const res = await planApi.joinPlan(planId);
      showToast(res.message || 'Joined plan! See you there 🎉', 'success');
      fetchPlans();
      if (detailPlan && (detailPlan.id === planId || detailPlan._id === planId)) {
        const updated = await planApi.getPlanById(planId);
        if (updated?.success) setDetailPlan(updated.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to join plan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Leave Plan
  const handleLeavePlan = async (planId) => {
    setActionLoading(true);
    try {
      const res = await planApi.leavePlan(planId);
      showToast(res.message || 'You left the plan', 'info');
      fetchPlans();
      if (detailPlan && (detailPlan.id === planId || detailPlan._id === planId)) {
        const updated = await planApi.getPlanById(planId);
        if (updated?.success) setDetailPlan(updated.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to leave plan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Plan
  const handleConfirmCancel = async () => {
    if (!cancellingPlanId) return;
    setActionLoading(true);
    try {
      await planApi.cancelPlan(cancellingPlanId);
      showToast('Plan has been cancelled.', 'info');
      setCancellingPlanId(null);
      setDetailPlan(null);
      fetchPlans();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel plan', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Participant (Host only)
  const handleRemoveParticipant = async (planId, targetUserId) => {
    setActionLoading(true);
    try {
      await planApi.removeParticipant(planId, targetUserId);
      showToast('Participant removed from plan.', 'info');
      fetchPlans();
      if (detailPlan) {
        const updated = await planApi.getPlanById(planId);
        if (updated?.success) setDetailPlan(updated.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove participant', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Study': return BookOpen;
      case 'Coding': return Code;
      case 'Coffee': return Coffee;
      case 'Sports': return Trophy;
      case 'Gaming': return Gamepad2;
      case 'Food': return Utensils;
      case 'Events': return PartyPopper;
      default: return Compass;
    }
  };

  return (
    <div className="plans-page-container">
      {/* Hero Banner */}
      <header className="plans-hero-section">
        <div className="plans-hero-content">
          <div className="plans-badge">
            <Calendar size={14} className="text-secondary" />
            <span>CAMPUS ACTIVITIES &bull; REAL PEER CONNECTIONS</span>
          </div>
          <h1 className="plans-hero-title">
            Campus <span className="text-gradient">Plans</span>
          </h1>
          <p className="plans-hero-desc">
            Organize study sessions, coffee breaks, coding jams, turf sports and campus outings with fellow students.
          </p>

          <div className="plans-hero-actions">
            <button
              id="btn-create-plan-hero"
              className="btn btn-primary"
              onClick={() => {
                setEditPlan(null);
                resetForm();
                setCreateModalOpen(true);
              }}
            >
              <Plus size={18} /> Create a Plan
            </button>
            <div className="plans-search-box">
              <Search size={16} className="text-muted" />
              <input
                id="input-plans-search"
                type="text"
                placeholder="Search plans by keyword, topic, venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-icon-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs & Category Filter Bar */}
      <section className="plans-filter-controls">
        <div className="plans-scope-tabs">
          <button
            id="tab-plans-all"
            className={`scope-tab ${activeTab === 'all' ? 'scope-tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Upcoming
          </button>
          <button
            id="tab-plans-today"
            className={`scope-tab ${activeTab === 'today' ? 'scope-tab-active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            Happening Today 🔥
          </button>
          <button
            id="tab-plans-mine"
            className={`scope-tab ${activeTab === 'mine' ? 'scope-tab-active' : ''}`}
            onClick={() => setActiveTab('mine')}
          >
            My Plans ({plans.filter((p) => p.isJoined || p.isCreator).length})
          </button>
        </div>

        <div className="plans-categories-scroll">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id.toLowerCase()}`}
                className={`category-chip ${isSelected ? 'category-chip-active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content Feed */}
      <main className="plans-grid-viewport">
        {loading ? (
          <div className="plans-skeleton-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="plan-card skeleton-card">
                <div className="skeleton-bar title-bar" />
                <div className="skeleton-bar text-bar" />
                <div className="skeleton-bar meta-bar" />
                <div className="skeleton-bar button-bar" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="plans-empty-card">
            <AlertCircle size={44} className="text-secondary mb-3" />
            <h3>Unable to load plans</h3>
            <p className="text-muted">{error}</p>
            <button className="btn btn-secondary mt-3" onClick={fetchPlans}>
              Retry Connection
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="plans-empty-card">
            <Calendar size={48} className="text-primary mb-3" />
            <h3>No campus plans found</h3>
            <p className="text-muted">
              {searchQuery || selectedCategory !== 'all' || activeTab !== 'all'
                ? 'Try broadening your filters or clearing search terms.'
                : 'No student activities scheduled yet. Be the first to start a session!'}
            </p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => {
                setEditPlan(null);
                resetForm();
                setCreateModalOpen(true);
              }}
            >
              <Plus size={16} /> Host a Plan
            </button>
          </div>
        ) : (
          <div className="plans-cards-grid">
            {plans.map((p) => {
              const CatIcon = getCategoryIcon(p.category);
              const isPast = p.date < new Date().toISOString().slice(0, 10);
              const spotsPercentage = Math.min(
                100,
                Math.round((p.participantCount / p.capacity) * 100)
              );

              return (
                <article key={p.id || p._id} className="plan-card">
                  {/* Card Header: Category & Status */}
                  <div className="plan-card-header">
                    <span className="plan-category-badge">
                      <CatIcon size={14} /> {p.category}
                    </span>
                    <span
                      className={`plan-status-pill ${
                        p.status === 'cancelled'
                          ? 'status-cancelled'
                          : p.status === 'full'
                          ? 'status-full'
                          : isPast
                          ? 'status-completed'
                          : 'status-upcoming'
                      }`}
                    >
                      {p.status === 'cancelled'
                        ? 'Cancelled'
                        : p.status === 'full'
                        ? 'Full'
                        : isPast
                        ? 'Past'
                        : 'Upcoming'}
                    </span>
                  </div>

                  {/* Card Title & Description */}
                  <h3
                    className="plan-card-title cursor-pointer"
                    onClick={() => setDetailPlan(p)}
                  >
                    {p.title}
                  </h3>
                  <p className="plan-card-desc">
                    {p.description.length > 120
                      ? `${p.description.slice(0, 120)}...`
                      : p.description}
                  </p>

                  {/* Meta Details: Date, Time, Venue */}
                  <div className="plan-meta-stack">
                    <div className="plan-meta-item">
                      <Calendar size={14} className="text-primary" />
                      <span>{p.date} &bull; {p.time}</span>
                    </div>
                    <div className="plan-meta-item">
                      <Clock size={14} className="text-muted" />
                      <span>{p.duration}</span>
                    </div>
                    <div className="plan-meta-item">
                      <MapPin size={14} className="text-secondary" />
                      <span className="truncate">{p.location}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="plan-capacity-section">
                    <div className="capacity-meta">
                      <span className="text-xs text-muted">
                        <Users size={12} className="inline mr-1" />
                        {p.participantCount} / {p.capacity} Confirmed
                      </span>
                      <span className="text-xs font-semibold text-lilac">
                        {p.spotsRemaining > 0
                          ? `${p.spotsRemaining} spots left`
                          : 'Capacity reached'}
                      </span>
                    </div>
                    <div className="capacity-track">
                      <div
                        className={`capacity-fill ${
                          spotsPercentage >= 100
                            ? 'fill-full'
                            : spotsPercentage >= 75
                            ? 'fill-warning'
                            : 'fill-ok'
                        }`}
                        style={{ width: `${spotsPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Host and Participant Preview */}
                  <div className="plan-host-row">
                    <div className="host-info">
                      <div className="avatar-chip">
                        {p.creator?.avatar ? (
                          <img src={p.creator.avatar} alt={p.creator.firstName} />
                        ) : (
                          <span className="avatar-fallback">
                            {p.creator?.firstName?.[0] || 'S'}
                          </span>
                        )}
                      </div>
                      <div className="host-text">
                        <span className="host-name">{p.creator?.name}</span>
                        <span className="host-label">
                          {p.isCreator ? 'You (Host)' : 'Host'}
                        </span>
                      </div>
                    </div>

                    {/* Participant Avatars stack */}
                    {p.participants && p.participants.length > 1 && (
                      <div className="participants-stack" title={`${p.participants.length} students joined`}>
                        {p.participants.slice(0, 3).map((part, idx) => (
                          <div
                            key={part.id || idx}
                            className="stack-avatar"
                            style={{ zIndex: 3 - idx }}
                          >
                            {part.avatar ? (
                              <img src={part.avatar} alt={part.firstName} />
                            ) : (
                              <span>{part.firstName?.[0] || 'U'}</span>
                            )}
                          </div>
                        ))}
                        {p.participants.length > 3 && (
                          <div className="stack-avatar stack-more">
                            +{p.participants.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="plan-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setDetailPlan(p)}
                    >
                      Details
                    </button>

                    {p.isCreator ? (
                      <div className="creator-actions-group">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openEditModal(p)}
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        {p.status !== 'cancelled' && (
                          <button
                            className="btn btn-danger-soft btn-sm"
                            onClick={() => setCancellingPlanId(p.id || p._id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ) : p.isJoined ? (
                      <div className="joined-actions-group">
                        <span className="joined-badge">
                          <Check size={14} /> Joined
                        </span>
                        {p.conversationId && (
                          <button
                            className="btn btn-icon-chat"
                            title="Group Chat"
                            onClick={() => navigate('/chat')}
                          >
                            <MessageSquare size={16} />
                          </button>
                        )}
                        <button
                          className="btn btn-text text-muted text-xs hover-underline"
                          onClick={() => handleLeavePlan(p.id || p._id)}
                          disabled={actionLoading}
                        >
                          Leave
                        </button>
                      </div>
                    ) : p.status === 'full' ? (
                      <button className="btn btn-disabled btn-sm" disabled>
                        Plan Full
                      </button>
                    ) : p.status === 'cancelled' ? (
                      <button className="btn btn-disabled btn-sm" disabled>
                        Cancelled
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleJoinPlan(p.id || p._id)}
                        disabled={actionLoading}
                      >
                        Join Plan 🚀
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE / EDIT PLAN MODAL */}
      {createModalOpen && (
        <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div
            className="modal-card plan-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editPlan ? 'Edit Campus Plan' : 'Host a Campus Plan ✨'}</h2>
              <button
                className="modal-close-btn"
                onClick={() => setCreateModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPlan} className="plan-form-stack">
              {/* Title */}
              <div className="form-group">
                <label htmlFor="plan-title">Plan Title *</label>
                <input
                  id="plan-title"
                  type="text"
                  name="title"
                  placeholder="e.g. End-sem DSA Practice & Doubt Clearing"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={formErrors.title ? 'input-error' : ''}
                />
                {formErrors.title && (
                  <span className="form-error">{formErrors.title}</span>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="plan-desc">Description & Agenda *</label>
                <textarea
                  id="plan-desc"
                  name="description"
                  rows={3}
                  placeholder="What's the plan? What should students bring or expect?"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={formErrors.description ? 'input-error' : ''}
                />
                {formErrors.description && (
                  <span className="form-error">{formErrors.description}</span>
                )}
              </div>

              {/* Category & Location Type */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="plan-category">Activity Category *</label>
                  <select
                    id="plan-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="Study">Study & Library</option>
                    <option value="Coding">Coding & Hack</option>
                    <option value="Coffee">Coffee Breaks</option>
                    <option value="Sports">Sports & Turf</option>
                    <option value="Gaming">Gaming Sessions</option>
                    <option value="Food">Food & Cafeteria</option>
                    <option value="Events">Campus Events</option>
                    <option value="Other">Other Outings</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="plan-loc-type">Location Type</label>
                  <select
                    id="plan-loc-type"
                    name="locationType"
                    value={formData.locationType}
                    onChange={handleInputChange}
                  >
                    <option value="campus">On-Campus Venue</option>
                    <option value="public">Nearby Public Cafe / Turf</option>
                    <option value="online">Virtual / Discord Call</option>
                  </select>
                </div>
              </div>

              {/* Date, Time & Duration */}
              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="plan-date">Date *</label>
                  <input
                    id="plan-date"
                    type="date"
                    name="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={formData.date}
                    onChange={handleInputChange}
                    className={formErrors.date ? 'input-error' : ''}
                  />
                  {formErrors.date && (
                    <span className="form-error">{formErrors.date}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="plan-time">Start Time *</label>
                  <input
                    id="plan-time"
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className={formErrors.time ? 'input-error' : ''}
                  />
                  {formErrors.time && (
                    <span className="form-error">{formErrors.time}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="plan-duration">Duration *</label>
                  <input
                    id="plan-duration"
                    type="text"
                    name="duration"
                    placeholder="e.g. 1 hour, 90 mins"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className={formErrors.duration ? 'input-error' : ''}
                  />
                  {formErrors.duration && (
                    <span className="form-error">{formErrors.duration}</span>
                  )}
                </div>
              </div>

              {/* Capacity & Location */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="plan-capacity">Max Participants (2–50) *</label>
                  <input
                    id="plan-capacity"
                    type="number"
                    name="capacity"
                    min="2"
                    max="50"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className={formErrors.capacity ? 'input-error' : ''}
                  />
                  {formErrors.capacity && (
                    <span className="form-error">{formErrors.capacity}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="plan-location">Meeting Location *</label>
                  <input
                    id="plan-location"
                    type="text"
                    name="location"
                    placeholder="e.g. World Peace Dome Library Floor 2"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={formErrors.location ? 'input-error' : ''}
                  />
                  {formErrors.location && (
                    <span className="form-error">{formErrors.location}</span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label htmlFor="plan-tags">Tags & Topics (comma-separated)</label>
                <input
                  id="plan-tags"
                  type="text"
                  name="tags"
                  placeholder="e.g. DSA, Python, Exam Prep, Casual"
                  value={formData.tags}
                  onChange={handleInputChange}
                />
              </div>

              {/* Submit Buttons */}
              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? 'Saving...'
                    : editPlan
                    ? 'Save Changes'
                    : 'Publish Plan 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLAN DETAILS MODAL */}
      {detailPlan && (
        <div className="modal-backdrop" onClick={() => setDetailPlan(null)}>
          <div
            className="modal-card plan-modal-card plan-detail-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="header-category-stack">
                <span className="plan-category-badge">
                  {detailPlan.category}
                </span>
                <h2>{detailPlan.title}</h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setDetailPlan(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="plan-detail-body">
              {/* Description */}
              <div className="detail-section">
                <h4>About This Plan</h4>
                <p className="detail-description-text">{detailPlan.description}</p>
              </div>

              {/* Schedule and Location info grid */}
              <div className="detail-meta-grid">
                <div className="detail-meta-box">
                  <Calendar size={18} className="text-primary mb-1" />
                  <span className="meta-box-label">Date & Time</span>
                  <span className="meta-box-val">
                    {detailPlan.date} &bull; {detailPlan.time}
                  </span>
                </div>
                <div className="detail-meta-box">
                  <Clock size={18} className="text-secondary mb-1" />
                  <span className="meta-box-label">Duration</span>
                  <span className="meta-box-val">{detailPlan.duration}</span>
                </div>
                <div className="detail-meta-box">
                  <MapPin size={18} className="text-lilac mb-1" />
                  <span className="meta-box-label">Meeting Point</span>
                  <span className="meta-box-val">{detailPlan.location}</span>
                </div>
                <div className="detail-meta-box">
                  <Users size={18} className="text-primary mb-1" />
                  <span className="meta-box-label">Capacity</span>
                  <span className="meta-box-val">
                    {detailPlan.participantCount} / {detailPlan.capacity} Confirmed
                  </span>
                </div>
              </div>

              {/* Tags */}
              {detailPlan.tags && detailPlan.tags.length > 0 && (
                <div className="detail-tags-stack">
                  {detailPlan.tags.map((t, idx) => (
                    <span key={idx} className="tag-pill">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Confirmed Participants Roster */}
              <div className="detail-participants-roster">
                <div className="roster-header">
                  <h4>
                    Confirmed Participants ({detailPlan.participants?.length || 0})
                  </h4>
                  {detailPlan.spotsRemaining > 0 && (
                    <span className="spots-tag">
                      {detailPlan.spotsRemaining} spots remaining
                    </span>
                  )}
                </div>

                <div className="roster-grid">
                  {detailPlan.participants?.map((p) => {
                    const isHost = p.role === 'creator';
                    return (
                      <div key={p.id} className="roster-item">
                        <div className="roster-avatar">
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.firstName} />
                          ) : (
                            <span>{p.firstName?.[0] || 'U'}</span>
                          )}
                        </div>
                        <div className="roster-info">
                          <span className="roster-name">
                            {p.name} {isHost && <strong className="text-secondary">(Host)</strong>}
                          </span>
                          <span className="roster-program">{p.program}</span>
                        </div>

                        {/* Host can remove a participant */}
                        {detailPlan.isCreator && !isHost && (
                          <button
                            className="btn-icon-danger"
                            title="Remove from plan"
                            onClick={() => handleRemoveParticipant(detailPlan.id || detailPlan._id, p.id)}
                            disabled={actionLoading}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="modal-actions-bar">
              <button
                className="btn btn-secondary"
                onClick={() => setDetailPlan(null)}
              >
                Close
              </button>

              {detailPlan.isCreator ? (
                <div className="creator-actions-group">
                  <button
                    className="btn btn-outline"
                    onClick={() => openEditModal(detailPlan)}
                  >
                    <Edit3 size={16} /> Edit Details
                  </button>
                  {detailPlan.status !== 'cancelled' && (
                    <button
                      className="btn btn-danger-soft"
                      onClick={() => {
                        setCancellingPlanId(detailPlan.id || detailPlan._id);
                      }}
                    >
                      Cancel Plan
                    </button>
                  )}
                </div>
              ) : detailPlan.isJoined ? (
                <div className="joined-actions-group">
                  {detailPlan.conversationId && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate('/chat')}
                    >
                      <MessageSquare size={16} /> Open Group Chat
                    </button>
                  )}
                  <button
                    className="btn btn-danger-soft"
                    onClick={() => handleLeavePlan(detailPlan.id || detailPlan._id)}
                    disabled={actionLoading}
                  >
                    Leave Plan
                  </button>
                </div>
              ) : detailPlan.status === 'full' ? (
                <button className="btn btn-disabled" disabled>
                  Plan Full
                </button>
              ) : detailPlan.status === 'cancelled' ? (
                <button className="btn btn-disabled" disabled>
                  Plan Cancelled
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => handleJoinPlan(detailPlan.id || detailPlan._id)}
                  disabled={actionLoading}
                >
                  Join This Plan 🚀
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancellingPlanId && (
        <div className="modal-backdrop" onClick={() => setCancellingPlanId(null)}>
          <div
            className="modal-card confirm-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon-box">
              <ShieldAlert size={36} className="text-secondary" />
            </div>
            <h3>Cancel This Plan?</h3>
            <p className="text-muted">
              Are you sure you want to cancel this plan? Confirmed participants will receive a notification that the event was cancelled.
            </p>
            <div className="modal-actions-bar">
              <button
                className="btn btn-secondary"
                onClick={() => setCancellingPlanId(null)}
              >
                Never mind
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmCancel}
                disabled={actionLoading}
              >
                Yes, Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
