import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Radio,
  Sparkles,
  Zap,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  CheckCircle2,
  X,
  MessageSquare,
  UserPlus,
  Coffee,
  BookOpen,
  Code2,
  Trophy,
  ChevronRight,
  Eye,
  RefreshCw,
  Bell,
  Check,
  ShieldCheck,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { radarApi } from '../api/radarApi';
import { planApi } from '../api/planApi';
import { connectionApi } from '../api/connectionApi';

// Visual Category styling helper
const getCategoryBadgeClass = (category) => {
  switch ((category || '').toLowerCase()) {
    case 'coding':
      return 'badge-violet';
    case 'study':
      return 'badge-blue';
    case 'sports':
      return 'badge-emerald';
    case 'coffee':
      return 'badge-amber';
    case 'gaming':
      return 'badge-purple';
    case 'events':
      return 'badge-pink';
    default:
      return 'badge-neutral';
  }
};

const getCategoryIcon = (category) => {
  switch ((category || '').toLowerCase()) {
    case 'coding':
      return <Code2 size={16} className="text-violet-400" />;
    case 'study':
      return <BookOpen size={16} className="text-blue-400" />;
    case 'sports':
      return <Trophy size={16} className="text-emerald-400" />;
    case 'coffee':
      return <Coffee size={16} className="text-amber-400" />;
    default:
      return <Calendar size={16} className="text-pink-400" />;
  }
};

export default function RadarPage() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState(null);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [seatsOnly, setSeatsOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');

  // Availability Modal & Settings
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [myAvailability, setMyAvailability] = useState({
    isActive: false,
    intentions: ['Study'],
    note: '',
    audience: 'everyone',
    durationHours: 2,
    expiresAt: null,
  });
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Interacted states (e.g. joined plans or sent connection requests)
  const [connectingUserIds, setConnectingUserIds] = useState(new Set());
  const [connectedUserIds, setConnectedUserIds] = useState(new Set());
  const [joiningPlanIds, setJoiningPlanIds] = useState(new Set());

  // Categories list
  const categories = ['All', 'Study', 'Coding', 'Sports', 'Coffee', 'Gaming', 'Events'];

  // Fetch Radar Feed
  const fetchRadarFeed = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (seatsOnly) params.availableSeatsOnly = true;
      if (dateFilter !== 'all') params.date = dateFilter;

      const res = await radarApi.getFeed(params);
      if (res.success && res.data) {
        setFeedData(res.data);
        if (res.data.myAvailability) {
          setMyAvailability((prev) => ({
            ...prev,
            ...res.data.myAvailability,
          }));
        }
      }
    } catch (err) {
      if (err.status === 401) {
        setError('Your session has expired. Please log in again.');
        return;
      }
      console.error('Failed to load Campus Radar feed:', err);
      setError(err.message || 'Unable to reach Campus Radar. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, selectedCategory, searchQuery, seatsOnly, dateFilter]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRadarFeed();
    }
  }, [fetchRadarFeed, isAuthenticated]);

  // Handle Availability Toggle & Save
  const handleSaveAvailability = async (newActiveState = null) => {
    try {
      setSavingAvailability(true);
      const activeToSave = newActiveState !== null ? newActiveState : myAvailability.isActive;
      const res = await radarApi.updateAvailability({
        isActive: activeToSave,
        intentions: myAvailability.intentions,
        note: myAvailability.note,
        audience: myAvailability.audience,
        durationHours: myAvailability.durationHours || 2,
      });

      if (res.success && res.data) {
        setMyAvailability((prev) => ({
          ...prev,
          ...res.data,
        }));
        showToast(
          activeToSave ? '⚡ Your availability is now live on Campus Radar!' : 'Availability disabled.',
          'success'
        );
        setIsAvailabilityModalOpen(false);
        // Refresh feed to update own presence and counter
        fetchRadarFeed();
      }
    } catch (err) {
      console.error('Failed to update availability:', err);
      showToast('Could not update availability status. Please try again.', 'error');
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleQuickDisableAvailability = async () => {
    try {
      setSavingAvailability(true);
      const res = await radarApi.disableAvailability();
      if (res.success) {
        setMyAvailability((prev) => ({ ...prev, isActive: false }));
        showToast('Availability status turned off.', 'info');
        fetchRadarFeed();
      }
    } catch (err) {
      console.error('Failed to disable availability:', err);
      showToast('Error turning off availability.', 'error');
    } finally {
      setSavingAvailability(false);
    }
  };

  // Handle Joining a Plan
  const handleJoinPlan = async (planId) => {
    if (joiningPlanIds.has(planId)) return;
    try {
      setJoiningPlanIds((prev) => new Set(prev).add(planId));
      const res = await planApi.joinPlan(planId);
      if (res.success) {
        showToast('🎉 You have joined this campus plan!', 'success');
        fetchRadarFeed();
      }
    } catch (err) {
      console.error('Failed to join plan:', err);
      const msg = err.response?.data?.message || 'Could not join plan.';
      showToast(msg, 'error');
    } finally {
      setJoiningPlanIds((prev) => {
        const next = new Set(prev);
        next.delete(planId);
        return next;
      });
    }
  };

  // Handle Sending Interest / Connect
  const handleConnectStudent = async (targetUserId, name) => {
    if (connectingUserIds.has(targetUserId)) return;
    try {
      setConnectingUserIds((prev) => new Set(prev).add(targetUserId));
      const res = await connectionApi.sendInterest(targetUserId);
      if (res.data?.success) {
        setConnectedUserIds((prev) => new Set(prev).add(targetUserId));
        if (res.data.data?.isMatch) {
          showToast(`🎉 It's a Mutual Vibe with ${name}! You can now chat.`, 'success');
        } else {
          showToast(`Interest sent to ${name}! ✨`, 'success');
        }
      }
    } catch (err) {
      console.error('Failed to send interest:', err);
      showToast('Unable to send connection request.', 'error');
    } finally {
      setConnectingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const isUserJoinedPlan = (plan) => {
    if (!plan || !plan.participants || !user) return false;
    return plan.participants.some(
      (p) => (p.user?._id || p.user)?.toString() === user._id?.toString()
    );
  };

  return (
    <div className="radar-page-container">
      {/* Cinematic Ambient Glow & Backdrop */}
      <div className="radar-ambient-glow" />

      {/* TOP HERO & HEADER */}
      <header className="radar-hero-header">
        <div className="radar-hero-title-row">
          <div className="radar-badge-pill">
            <span className="radar-pulse-dot" />
            <Radio size={14} className="text-pink-400" />
            <span>CAMPUS RADAR LIVE</span>
          </div>

          {/* Quick Availability Status Pill */}
          <div className="radar-availability-status-control">
            {myAvailability.isActive ? (
              <div className="radar-live-status-chip">
                <span className="live-status-pulse" />
                <span className="live-status-text">
                  You are Available for{' '}
                  <strong className="text-violet-300">
                    {myAvailability.intentions?.slice(0, 2).join(', ') || 'Activities'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAvailabilityModalOpen(true)}
                  className="live-status-edit-btn"
                  title="Edit intentions and duration"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleQuickDisableAvailability}
                  className="live-status-off-btn"
                  title="Turn off availability"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(true)}
                className="radar-broadcast-btn"
              >
                <Zap size={15} className="text-violet-400" />
                <span>Broadcast Availability</span>
              </button>
            )}
          </div>
        </div>

        <h1 className="radar-hero-title">
          Discover What&apos;s Happening <span className="text-gradient-violet">Right Now.</span>
        </h1>
        <p className="radar-hero-subtitle">
          Find available study partners, spontaneous coffee meetups, and real student plans on campus.
        </p>

        {/* Real Dynamic Activity Counter Bar */}
        {feedData?.counts && (
          <div className="radar-metrics-ribbon">
            <div className="radar-metric-item">
              <span className="radar-metric-value text-violet-400">{feedData.counts.availableNow}</span>
              <span className="radar-metric-label">Students Available Now</span>
            </div>
            <div className="radar-metric-divider" />
            <div className="radar-metric-item">
              <span className="radar-metric-value text-pink-400">{feedData.counts.upcomingPlans}</span>
              <span className="radar-metric-label">Active Campus Meetups</span>
            </div>
            <div className="radar-metric-divider" />
            <div className="radar-metric-item">
              <span className="radar-metric-value text-lilac">{feedData.counts.recommendedPeople}</span>
              <span className="radar-metric-label">Shared Vibe Peers</span>
            </div>
          </div>
        )}

        {/* CONTROLS & FILTER BAR */}
        <div className="radar-controls-card">
          {/* Category Chips */}
          <div className="radar-categories-scroll">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`radar-category-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                {getCategoryIcon(cat)}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Search & Sub-filters */}
          <div className="radar-filter-inputs">
            <div className="radar-search-wrapper">
              <Search size={17} className="text-muted" />
              <input
                type="text"
                placeholder="Search plans, topics, or campus spots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="radar-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="radar-search-clear"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="radar-filter-actions">
              <button
                type="button"
                onClick={() => setSeatsOnly(!seatsOnly)}
                className={`radar-toggle-filter-btn ${seatsOnly ? 'active' : ''}`}
              >
                <Users size={15} />
                <span>Open Spots Only</span>
              </button>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="radar-date-select"
              >
                <option value="all">Any Date</option>
                <option value="today">Today Only</option>
                <option value="upcoming">Upcoming</option>
              </select>

              <button
                type="button"
                onClick={fetchRadarFeed}
                className="radar-refresh-btn"
                title="Refresh Radar Feed"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="radar-error-banner">
          <p>{error}</p>
          <button type="button" onClick={fetchRadarFeed} className="btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && !feedData && (
        <div className="radar-skeleton-container">
          <div className="skeleton-hero-card" />
          <div className="skeleton-cards-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>
      )}

      {/* MAIN RADAR CONTENT */}
      {feedData && (
        <main className="radar-content-layout">
          {/* FEATURED UPCOMING PLAN HERO CARD */}
          {feedData.featuredPlan && (
            <section className="radar-featured-section" aria-label="Featured Activity">
              <div className="radar-section-header">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-violet-400" />
                  <h2 className="radar-section-heading">Featured Campus Meetup</h2>
                </div>
                <Link to="/plans" className="radar-view-all-link">
                  <span>View All Plans</span>
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="radar-featured-card">
                <div className="featured-card-badge-row">
                  <span className={`featured-category-badge ${getCategoryBadgeClass(feedData.featuredPlan.category)}`}>
                    {getCategoryIcon(feedData.featuredPlan.category)}
                    <span>{feedData.featuredPlan.category}</span>
                  </span>
                  <span className="featured-seats-badge">
                    <Users size={14} className="text-violet-400" />
                    <span>
                      {feedData.featuredPlan.participants?.length || 0} / {feedData.featuredPlan.capacity} Confirmed
                    </span>
                  </span>
                </div>

                <div className="featured-card-body">
                  <h3 className="featured-card-title">{feedData.featuredPlan.title}</h3>
                  <p className="featured-card-desc">{feedData.featuredPlan.description}</p>

                  <div className="featured-meta-grid">
                    <div className="featured-meta-item">
                      <Calendar size={16} className="text-violet-400" />
                      <span>{feedData.featuredPlan.date} at {feedData.featuredPlan.time}</span>
                    </div>
                    <div className="featured-meta-item">
                      <Clock size={16} className="text-pink-400" />
                      <span>{feedData.featuredPlan.duration || '1-2 hrs'}</span>
                    </div>
                    <div className="featured-meta-item">
                      <MapPin size={16} className="text-emerald-400" />
                      <span>{feedData.featuredPlan.location} ({feedData.featuredPlan.locationType || 'Campus'})</span>
                    </div>
                  </div>

                  {/* Creator and Participants */}
                  <div className="featured-footer-row">
                    <div className="featured-creator-info">
                      <div className="creator-avatar-circle">
                        {feedData.featuredPlan.creator?.firstName?.[0] || 'C'}
                      </div>
                      <div>
                        <div className="creator-name">
                          Hosted by {feedData.featuredPlan.creator?.firstName} {feedData.featuredPlan.creator?.lastName}
                          {feedData.featuredPlan.creator?.isVerified && (
                            <ShieldCheck size={14} className="text-violet-400 inline ml-1" />
                          )}
                        </div>
                        <div className="creator-sub">MIT-WPU Campus Plan</div>
                      </div>
                    </div>

                    <div className="featured-actions">
                      {isUserJoinedPlan(feedData.featuredPlan) ? (
                        <div className="joined-badge-pill">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span>You&apos;re Attending</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinPlan(feedData.featuredPlan._id)}
                          disabled={
                            joiningPlanIds.has(feedData.featuredPlan._id) ||
                            (feedData.featuredPlan.participants?.length || 0) >= feedData.featuredPlan.capacity
                          }
                          className="btn-featured-join"
                        >
                          <UserPlus size={16} />
                          <span>
                            {(feedData.featuredPlan.participants?.length || 0) >= feedData.featuredPlan.capacity
                              ? 'Plan Full'
                              : 'Join Meetup'}
                          </span>
                        </button>
                      )}
                      <Link to={`/plans`} className="btn-featured-view">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 1: AVAILABLE NOW (STUDENTS) */}
          <section className="radar-section" aria-label="Available Students">
            <div className="radar-section-header">
              <div>
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-pink-400" />
                  <h2 className="radar-section-heading">Available Now on Campus</h2>
                </div>
                <p className="radar-section-sub">
                  Students who explicitly shared their availability for study, coffee, sports, or conversation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(true)}
                className="radar-secondary-action-btn"
              >
                <span>Set Your Status</span>
              </button>
            </div>

            {feedData.availableStudents && feedData.availableStudents.length > 0 ? (
              <div className="radar-cards-scroll-wrapper">
                {feedData.availableStudents.map((student) => (
                  <div key={student._id} className="radar-student-card">
                    <div className="student-card-header">
                      <div className="student-avatar-wrapper">
                        {student.avatar ? (
                          <img src={student.avatar} alt={student.firstName} className="student-avatar-img" />
                        ) : (
                          <div className="student-avatar-fallback">
                            {student.firstName?.[0] || 'S'}
                          </div>
                        )}
                        <span className="student-active-dot" title="Available now" />
                      </div>

                      <div className="student-name-block">
                        <div className="student-name">
                          {student.firstName} {student.lastName}
                          {student.isVerified && <ShieldCheck size={14} className="text-violet-400 inline ml-1" />}
                        </div>
                        <div className="student-program">
                          {student.program || 'MIT-WPU Student'} {student.year ? `• ${student.year}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Intentions Badges */}
                    <div className="student-intentions-row">
                      {student.intentions?.map((intent, idx) => (
                        <span key={idx} className="intention-tag-chip">
                          {intent}
                        </span>
                      ))}
                    </div>

                    {/* Optional Campus Note */}
                    {student.note && (
                      <div className="student-note-bubble">
                        <MapPin size={13} className="text-pink-400 inline mr-1 shrink-0" />
                        <span>&quot;{student.note}&quot;</span>
                      </div>
                    )}

                    {/* Factual Shared Vibe Snippet */}
                    {student.sharedVibe?.hasSharedVibe && (
                      <div className="student-vibe-snippet">
                        <Sparkles size={13} className="text-violet-400 shrink-0" />
                        <span>{student.sharedVibe.explanations?.[0] || 'Common campus vibe'}</span>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="student-card-actions">
                      {student.isConnected ? (
                        <Link to="/chat" className="btn-student-action btn-chat">
                          <MessageSquare size={14} />
                          <span>Chat</span>
                        </Link>
                      ) : connectedUserIds.has(student._id) ? (
                        <button type="button" disabled className="btn-student-action btn-connected">
                          <Check size={14} />
                          <span>Interest Sent</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnectStudent(student._id, student.firstName)}
                          disabled={connectingUserIds.has(student._id)}
                          className="btn-student-action btn-connect"
                        >
                          <UserPlus size={14} />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="radar-empty-card">
                <Zap size={32} className="text-muted mb-2" />
                <h4 className="font-semibold text-lilac">No students available in this category right now</h4>
                <p className="text-sm text-muted mt-1 max-w-md">
                  Be the first to turn on your availability and connect with peers for study sessions or coffee breaks!
                </p>
                <button
                  type="button"
                  onClick={() => setIsAvailabilityModalOpen(true)}
                  className="btn-primary mt-4"
                >
                  Broadcast Your Availability
                </button>
              </div>
            )}
          </section>

          {/* SECTION 2: HAPPENING SOON (ALL UPCOMING PLANS) */}
          <section className="radar-section" aria-label="Upcoming Plans">
            <div className="radar-section-header">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-violet-400" />
                  <h2 className="radar-section-heading">Happening Soon</h2>
                </div>
                <p className="radar-section-sub">
                  Student-organized activities with available capacity.
                </p>
              </div>
              <Link to="/plans" className="radar-view-all-link">
                <span>Browse All Plans</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            {feedData.plans?.all && feedData.plans.all.length > 0 ? (
              <div className="radar-plans-grid">
                {feedData.plans.all.slice(0, 6).map((plan) => (
                  <div key={plan._id} className="radar-plan-card">
                    <div className="plan-card-top">
                      <span className={`featured-category-badge ${getCategoryBadgeClass(plan.category)}`}>
                        {getCategoryIcon(plan.category)}
                        <span>{plan.category}</span>
                      </span>
                      <span className="plan-capacity-chip">
                        {plan.participants?.length || 0} / {plan.capacity}
                      </span>
                    </div>

                    <h4 className="plan-card-title">{plan.title}</h4>
                    <p className="plan-card-desc">{plan.description}</p>

                    <div className="plan-meta-details">
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Calendar size={13} className="text-violet-400" />
                        <span>{plan.date} • {plan.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <MapPin size={13} className="text-emerald-400" />
                        <span>{plan.location}</span>
                      </div>
                    </div>

                    <div className="plan-card-footer">
                      <div className="plan-creator-tag">
                        Hosted by {plan.creator?.firstName || 'Student'}
                      </div>
                      {isUserJoinedPlan(plan) ? (
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 size={13} /> Attending
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinPlan(plan._id)}
                          disabled={joiningPlanIds.has(plan._id) || (plan.participants?.length || 0) >= plan.capacity}
                          className="btn-plan-join-sm"
                        >
                          {(plan.participants?.length || 0) >= plan.capacity ? 'Full' : 'Join'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="radar-empty-card">
                <Calendar size={32} className="text-muted mb-2" />
                <h4 className="font-semibold text-lilac">No plans found matching your filter</h4>
                <p className="text-sm text-muted mt-1">Try resetting the category filter or organize your own activity!</p>
                <Link to="/plans" className="btn-secondary mt-4">
                  Create a Campus Plan
                </Link>
              </div>
            )}
          </section>

          {/* SECTION 3: STUDY & CODING HUB */}
          {feedData.plans?.studyAndCoding && feedData.plans.studyAndCoding.length > 0 && (
            <section className="radar-section" aria-label="Study and Coding">
              <div className="radar-section-header">
                <div className="flex items-center gap-2">
                  <Code2 size={18} className="text-blue-400" />
                  <h2 className="radar-section-heading">Study & Coding Hub</h2>
                </div>
              </div>
              <div className="radar-plans-grid">
                {feedData.plans.studyAndCoding.slice(0, 3).map((plan) => (
                  <div key={plan._id} className="radar-plan-card">
                    <div className="plan-card-top">
                      <span className={`featured-category-badge ${getCategoryBadgeClass(plan.category)}`}>
                        {getCategoryIcon(plan.category)}
                        <span>{plan.category}</span>
                      </span>
                      <span className="plan-capacity-chip">
                        {plan.participants?.length || 0} / {plan.capacity}
                      </span>
                    </div>
                    <h4 className="plan-card-title">{plan.title}</h4>
                    <p className="plan-card-desc">{plan.description}</p>
                    <div className="plan-meta-details">
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <Clock size={13} className="text-violet-400" />
                        <span>{plan.date} at {plan.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted">
                        <MapPin size={13} className="text-emerald-400" />
                        <span>{plan.location}</span>
                      </div>
                    </div>
                    <div className="plan-card-footer">
                      <div className="plan-creator-tag">Hosted by {plan.creator?.firstName}</div>
                      {isUserJoinedPlan(plan) ? (
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 size={13} /> Attending
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoinPlan(plan._id)}
                          className="btn-plan-join-sm"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 4: PEOPLE WITH SIMILAR INTERESTS (DISCOVER PEOPLE) */}
          <section className="radar-section" aria-label="People Discovery">
            <div className="radar-section-header">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-pink-400" />
                  <h2 className="radar-section-heading">People With Shared Interests</h2>
                </div>
                <p className="radar-section-sub">
                  Verified students on campus with compatible interests and connection goals.
                </p>
              </div>
              <Link to="/discover" className="radar-view-all-link">
                <span>Browse Student Profiles</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            {feedData.recommendedPeople && feedData.recommendedPeople.length > 0 ? (
              <div className="radar-people-grid">
                {feedData.recommendedPeople.slice(0, 6).map((person) => (
                  <div key={person._id} className="radar-person-card">
                    <div className="person-card-top">
                      <div className="person-avatar-circle">
                        {person.avatar ? (
                          <img src={person.avatar} alt={person.firstName} className="person-avatar-img" />
                        ) : (
                          <span>{person.firstName?.[0] || 'U'}</span>
                        )}
                      </div>
                      <div className="person-details">
                        <div className="person-name">
                          {person.firstName} {person.lastName}
                          {person.isVerified && <ShieldCheck size={14} className="text-violet-400 inline ml-1" />}
                        </div>
                        <div className="person-program">
                          {person.program || 'MIT-WPU Student'} {person.year ? `• ${person.year}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Shared Vibe Pill */}
                    {person.sharedVibe?.hasSharedVibe ? (
                      <div className="person-shared-vibe-bar">
                        <Sparkles size={13} className="text-violet-400 shrink-0" />
                        <span>{person.sharedVibe.explanations?.[0]}</span>
                      </div>
                    ) : (
                      <p className="person-bio-snippet">{person.bio || 'Verified MIT-WPU student looking to connect.'}</p>
                    )}

                    {/* Interests tags */}
                    <div className="person-tags-row">
                      {person.interests?.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="person-tag-badge">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="person-card-actions">
                      {person.isConnected ? (
                        <Link to="/chat" className="btn-person-chat">
                          <MessageSquare size={14} />
                          <span>Chat</span>
                        </Link>
                      ) : connectedUserIds.has(person._id) ? (
                        <button type="button" disabled className="btn-person-sent">
                          <Check size={14} />
                          <span>Liked</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConnectStudent(person._id, person.firstName)}
                          disabled={connectingUserIds.has(person._id)}
                          className="btn-person-connect"
                        >
                          <UserPlus size={14} />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="radar-empty-card">
                <Users size={32} className="text-muted mb-2" />
                <h4 className="font-semibold text-lilac">No student recommendations available</h4>
                <p className="text-sm text-muted mt-1">Check back soon as more students join campus activities!</p>
              </div>
            )}
          </section>
        </main>
      )}

      {/* AVAILABILITY CONFIGURATION MODAL / DRAWER */}
      {isAvailabilityModalOpen && (
        <div className="radar-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="radar-modal-card">
            <div className="radar-modal-header">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-violet-400" />
                <h3 id="modal-title" className="text-lg font-bold text-white">Broadcast Campus Availability</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="radar-modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="radar-modal-body">
              {/* Toggle Active Switch */}
              <div className="availability-toggle-row">
                <div>
                  <div className="font-semibold text-white">Show as Available on Radar</div>
                  <div className="text-xs text-muted">Let peers know you are open to connect right now</div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={myAvailability.isActive}
                    onChange={(e) =>
                      setMyAvailability((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Intentions Selector */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-lilac uppercase tracking-wider mb-2">
                  What are you open for?
                </label>
                <div className="intentions-grid">
                  {['Study', 'Coffee', 'Sports', 'Coding', 'Campus events', 'Casual conversation'].map((intent) => {
                    const isSelected = myAvailability.intentions?.includes(intent);
                    return (
                      <button
                        key={intent}
                        type="button"
                        onClick={() => {
                          const current = myAvailability.intentions || [];
                          const next = isSelected
                            ? current.filter((i) => i !== intent)
                            : [...current, intent];
                          setMyAvailability((prev) => ({
                            ...prev,
                            intentions: next.length > 0 ? next : ['Study'],
                          }));
                        }}
                        className={`intention-choice-btn ${isSelected ? 'selected' : ''}`}
                      >
                        {intent}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Hours */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-lilac uppercase tracking-wider mb-2">
                  Availability Duration (Server-Enforced Expiration)
                </label>
                <div className="duration-pill-row">
                  {[
                    { label: '1 Hour', hours: 1 },
                    { label: '2 Hours', hours: 2 },
                    { label: '4 Hours', hours: 4 },
                    { label: 'Until Evening', hours: 6 },
                  ].map((d) => (
                    <button
                      key={d.hours}
                      type="button"
                      onClick={() =>
                        setMyAvailability((prev) => ({ ...prev, durationHours: d.hours }))
                      }
                      className={`duration-pill ${
                        myAvailability.durationHours === d.hours ? 'selected' : ''
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Campus Note */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-lilac uppercase tracking-wider mb-2">
                  Campus Spot / Note (Optional, max 120 chars)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Central Library 2nd floor, Canteen 4, Basketball court..."
                  value={myAvailability.note || ''}
                  onChange={(e) =>
                    setMyAvailability((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="radar-modal-input"
                />
              </div>

              {/* Privacy Audience */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-lilac uppercase tracking-wider mb-2">
                  Who can see your availability?
                </label>
                <div className="audience-choice-row">
                  <button
                    type="button"
                    onClick={() => setMyAvailability((prev) => ({ ...prev, audience: 'everyone' }))}
                    className={`audience-btn ${myAvailability.audience === 'everyone' ? 'selected' : ''}`}
                  >
                    <span>Everyone on Campus</span>
                    <small>Verified MIT-WPU students</small>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setMyAvailability((prev) => ({ ...prev, audience: 'connections_only' }))
                    }
                    className={`audience-btn ${
                      myAvailability.audience === 'connections_only' ? 'selected' : ''
                    }`}
                  >
                    <span>Connections Only</span>
                    <small>Only students you have matched with</small>
                  </button>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Preview How You Appear to Others
                </label>
                <div className="radar-preview-card">
                  <div className="flex items-center gap-2">
                    <span className="live-status-pulse" />
                    <span className="text-xs font-semibold text-white">
                      {user?.firstName} {user?.lastName} is Available
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {myAvailability.intentions?.map((i, idx) => (
                      <span key={idx} className="text-2xs bg-violet-950/60 text-violet-300 px-2 py-0.5 rounded border border-violet-800/40">
                        {i}
                      </span>
                    ))}
                  </div>
                  {myAvailability.note && (
                    <div className="text-xs text-muted mt-1 italic">&quot;{myAvailability.note}&quot;</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="radar-modal-footer">
              {myAvailability.isActive && (
                <button
                  type="button"
                  onClick={() => handleSaveAvailability(false)}
                  disabled={savingAvailability}
                  className="btn-modal-turnoff"
                >
                  Turn Off
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSaveAvailability(true)}
                disabled={savingAvailability}
                className="btn-modal-save"
              >
                {savingAvailability ? 'Saving...' : 'Broadcast to Radar ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
