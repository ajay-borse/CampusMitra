import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  X,
  Sparkles,
  GraduationCap,
  Calendar,
  AlertCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Users,
  BookOpen,
  Gamepad2,
  Music,
  Dumbbell,
  Lock,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { discoverApi } from '../api/discoverApi';
import { connectionApi } from '../api/connectionApi';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import ReportModal from '../components/ReportModal';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';

const DISCOVER_CATEGORIES = [
  { id: 'for_you', label: 'For You', icon: '✨' },
  { id: 'all', label: 'Trending', icon: '🔥' },
  { id: 'same_program', label: 'Same Program', icon: '🎓' },
  { id: 'study', label: 'Study Buddies', icon: '📚' },
  { id: 'activities', label: 'Activity Partners', icon: '🏏' },
  { id: 'music', label: 'Music Friends', icon: '🎵' },
  { id: 'gaming', label: 'Gaming Buddies', icon: '🎮' },
  { id: 'dating', label: 'Dating (18+)', icon: '❤️', isDating: true },
  { id: 'new', label: 'New on Campus', icon: '🌟' },
];

export default function DiscoverPage() {
  const { user, profile } = useAuth();
  const { triggerConfetti } = useSocket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('for_you');
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatingCard, setAnimatingCard] = useState(null); // 'swipe-right' | 'swipe-left'
  const [reportingUser, setReportingUser] = useState(null);

  // Mutual Match Modal State
  const [matchModalData, setMatchModalData] = useState(null);

  const userAge = user?.dateOfBirth
    ? Math.floor((new Date() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : profile?.age || 18;
  const isAdult = userAge >= 18;

  const fetchProfiles = async (category = activeCategory) => {
    try {
      setLoading(true);
      const res = await discoverApi.getProfiles({ category });
      if (res?.success) {
        setProfiles(res.data || []);
        setCurrentIndex(0);
        setActivePhotoIndex(0);
      }
    } catch (err) {
      if (err.status === 403 && category === 'dating') {
        showToast('Dating is available only for verified adults 18+.', 'warning');
        setActiveCategory('for_you');
      } else {
        showToast(err.message || 'Failed to fetch candidate profiles', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles(activeCategory);
  }, [activeCategory]);

  const handleCategorySelect = (cat) => {
    if (cat.isDating && !isAdult) {
      showToast('Dating is available only for verified adults 18+.', 'warning');
      return;
    }
    setActiveCategory(cat.id);
  };

  const handleSwipe = async (actionType) => {
    if (currentIndex >= profiles.length) return;
    const candidate = profiles[currentIndex];
    const targetUserId = candidate.userId || candidate.id;

    const isPositive = actionType === 'right' || actionType === 'connect' || actionType === 'dating';
    setAnimatingCard(isPositive ? 'swipe-right' : 'swipe-left');

    setTimeout(async () => {
      try {
        if (isPositive) {
          const res = await connectionApi.sendInterest(targetUserId);
          if (res?.data?.isMatch) {
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {
              // Confetti trigger
            }

            setMatchModalData({
              candidate,
              conversationId: res.data.conversationId,
            });
            showToast(`🎉 Mutual Match with ${candidate.firstName}!`, 'success');
          } else {
            showToast(`Interest sent to ${candidate.firstName} 💜`, 'info');
          }
        } else {
          await connectionApi.sendPass(targetUserId);
        }
      } catch (err) {
        showToast(err.message || 'Action could not be saved', 'error');
      }

      setAnimatingCard(null);
      setCurrentIndex((prev) => prev + 1);
      setActivePhotoIndex(0);
    }, 280);
  };

  const candidate = profiles[currentIndex];
  const photos =
    candidate?.photos && candidate.photos.length > 0
      ? candidate.photos
      : [
          candidate?.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        ];

  return (
    <div className="discover-page-container">
      {/* Category Tabs Pill Bar */}
      <div className="discover-categories-bar">
        {DISCOVER_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.id;
          const isLockedDating = cat.isDating && !isAdult;

          return (
            <button
              key={cat.id}
              type="button"
              className={`discover-cat-pill ${isSelected ? 'active' : ''} ${isLockedDating ? 'opacity-50' : ''}`}
              onClick={() => handleCategorySelect(cat)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              {isLockedDating && <Lock size={12} className="ml-1 text-muted" />}
            </button>
          );
        })}
      </div>

      {/* Main Discover Stage */}
      <div className="discover-deck-stage">
        {loading ? (
          <div className="discover-skeleton-wrap">
            <CardSkeleton />
          </div>
        ) : !candidate ? (
          <div className="discover-empty-wrap">
            <EmptyState
              icon="✨"
              title="You're all caught up for now!"
              description="Your people are out there 💫 Try exploring different categories or updating your interests to improve matches."
              actionLabel="Refresh Deck"
              onAction={() => fetchProfiles(activeCategory)}
            />
          </div>
        ) : (
          <div className={`discover-card-frame ${animatingCard || ''}`}>
            {/* Photo Slideshow Area */}
            <div className="card-photo-viewport">
              <img
                src={photos[activePhotoIndex]}
                alt={candidate.name}
                className="card-main-image"
              />

              {/* Photo Pagination Dots */}
              {photos.length > 1 && (
                <div className="photo-pagination-dots">
                  {photos.map((_, pIdx) => (
                    <span
                      key={pIdx}
                      className={`dot-pill ${pIdx === activePhotoIndex ? 'active' : ''}`}
                      onClick={() => setActivePhotoIndex(pIdx)}
                    />
                  ))}
                </div>
              )}

              {/* Photo Touch Nav (Left / Right halves) */}
              {photos.length > 1 && (
                <>
                  <div
                    className="photo-touch-zone left"
                    onClick={() =>
                      setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                    }
                  />
                  <div
                    className="photo-touch-zone right"
                    onClick={() =>
                      setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                    }
                  />
                </>
              )}

              {/* Top Bar Badges over photo */}
              <div className="card-top-badges">
                {/* Compatibility Vibe Match Badge */}
                <div className="compatibility-badge">
                  <Sparkles size={14} className="text-amber-300" />
                  <span>{candidate.compatibility || 85}% Vibe Match 💫</span>
                </div>

                {/* Report / Safety button */}
                <button
                  type="button"
                  className="report-flag-btn"
                  onClick={() => setReportingUser(candidate)}
                  title="Report student profile"
                >
                  <Flag size={14} />
                </button>
              </div>

              {/* Subtle Gradient Shade over photo */}
              <div className="card-photo-shade" />

              {/* Floating Quick Info on Photo Bottom */}
              <div className="card-floating-intro">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="candidate-name">{candidate.firstName}</h2>
                  {candidate.age && <span className="candidate-age">, {candidate.age}</span>}
                  {candidate.pronouns && (
                    <span className="candidate-pronouns">({candidate.pronouns})</span>
                  )}
                  {candidate.isVerified && (
                    <span className="badge-verified" title="Student Verified">
                      <ShieldCheck size={14} />
                    </span>
                  )}
                </div>

                <div className="candidate-degree">
                  <GraduationCap size={15} />
                  <span>{candidate.program}</span>
                  {candidate.year && <span> • {candidate.year}</span>}
                </div>
              </div>
            </div>

            {/* Scrollable Profile Details Content */}
            <div className="card-details-scroll">
              {/* Vibe Headline */}
              {candidate.vibeHeadline && (
                <div className="candidate-headline">
                  &ldquo;{candidate.vibeHeadline}&rdquo;
                </div>
              )}

              {/* Bio */}
              {candidate.bio && (
                <div className="candidate-section">
                  <p className="candidate-bio">{candidate.bio}</p>
                </div>
              )}

              {/* Common Interests / Shared Passions */}
              {candidate.sharedInterests && candidate.sharedInterests.length > 0 && (
                <div className="candidate-section shared-synergy-box">
                  <span className="section-label text-emerald-400 font-semibold">
                    ✨ Things you both love:
                  </span>
                  <div className="chips-flex-wrap mt-1">
                    {candidate.sharedInterests.map((interest, idx) => (
                      <span key={idx} className="chip-tag active">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* All Interests */}
              {candidate.interests && candidate.interests.length > 0 && (
                <div className="candidate-section">
                  <span className="section-label">Interests & Vibes:</span>
                  <div className="chips-flex-wrap mt-1">
                    {candidate.interests.map((tag, idx) => (
                      <span key={idx} className="chip-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Looking For Goals */}
              {candidate.lookingFor && candidate.lookingFor.length > 0 && (
                <div className="candidate-section">
                  <span className="section-label">Looking for on campus:</span>
                  <div className="chips-flex-wrap mt-1">
                    {candidate.lookingFor.map((goal, idx) => (
                      <span key={idx} className="chip-tag active">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Story Prompts if available */}
              {candidate.story?.perfectWeekend && (
                <div className="candidate-section story-prompt-mini">
                  <span className="prompt-q-mini">My perfect weekend:</span>
                  <p className="prompt-a-mini">{candidate.story.perfectWeekend}</p>
                </div>
              )}

              {candidate.story?.passionateAbout && (
                <div className="candidate-section story-prompt-mini">
                  <span className="prompt-q-mini">Something I&apos;m passionate about:</span>
                  <p className="prompt-a-mini">{candidate.story.passionateAbout}</p>
                </div>
              )}

              {/* Daily Lifestyle Tags */}
              {candidate.lifestyle && (
                <div className="candidate-section">
                  <span className="section-label">Lifestyle:</span>
                  <div className="chips-flex-wrap mt-1">
                    {candidate.lifestyle.foodPreference && (
                      <span className="chip-tag">🥗 {candidate.lifestyle.foodPreference}</span>
                    )}
                    {candidate.lifestyle.sleepSchedule && (
                      <span className="chip-tag">🌙 {candidate.lifestyle.sleepSchedule}</span>
                    )}
                    {candidate.lifestyle.fitness && (
                      <span className="chip-tag">🏋️ {candidate.lifestyle.fitness}</span>
                    )}
                    {candidate.lifestyle.pets && (
                      <span className="chip-tag">🐾 {candidate.lifestyle.pets}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="discover-action-controls">
              {/* Pass Button */}
              <button
                type="button"
                className="action-btn action-pass"
                onClick={() => handleSwipe('left')}
                title="Pass (Swipe Left)"
              >
                <X size={28} />
              </button>

              {/* Connect / Friendship Button */}
              <button
                type="button"
                className="action-btn action-connect"
                onClick={() => handleSwipe('connect')}
                title="Connect as Friends & Study Buddies"
              >
                <Users size={24} />
              </button>

              {/* Interested / Swipe Right Button */}
              <button
                type="button"
                className="action-btn action-like"
                onClick={() => handleSwipe('right')}
                title="Interested (Swipe Right)"
              >
                <Heart size={28} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mutual Match Modal Celebration */}
      {matchModalData && (
        <div className="match-modal-overlay anim-fade-in" role="dialog" aria-modal="true">
          <div className="match-modal-card anim-zoom-in">
            <div className="match-sparkle-header">
              <Sparkles size={48} className="text-amber-300 anim-pulse" />
            </div>

            <h1 className="match-title">It&apos;s a Match! ✨</h1>
            <p className="match-subtitle">
              You and <strong>{matchModalData.candidate.firstName}</strong> both connected!
            </p>

            {/* Mutual Photo Avatars */}
            <div className="match-avatars-stage">
              <img
                src={profile?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt="You"
                className="match-avatar left"
              />
              <div className="match-heart-center">
                <Heart size={24} className="text-white fill-current" />
              </div>
              <img
                src={matchModalData.candidate.photos?.[0] || matchModalData.candidate.avatar}
                alt={matchModalData.candidate.firstName}
                className="match-avatar right"
              />
            </div>

            <p className="text-sm text-muted text-center mt-3">
              💬 &ldquo;Say hi! You already have things in common.&rdquo;
            </p>

            <div className="match-modal-actions mt-6">
              <button
                type="button"
                className="btn btn-primary btn-block flex items-center justify-center gap-2"
                onClick={() => {
                  setMatchModalData(null);
                  navigate('/chat');
                }}
              >
                <MessageSquare size={18} /> Say Hello in Chat
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-block mt-2"
                onClick={() => setMatchModalData(null)}
              >
                Keep Discovering
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {reportingUser && (
        <ReportModal
          reportedUser={reportingUser}
          onClose={() => setReportingUser(null)}
          onSuccess={() => {
            setReportingUser(null);
            showToast('Report submitted for campus moderation review.', 'success');
            handleSwipe('left');
          }}
        />
      )}
    </div>
  );
}
