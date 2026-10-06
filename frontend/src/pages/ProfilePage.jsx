import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Settings,
  Mail,
  ShieldCheck,
  Sparkles,
  Camera,
  Heart,
  Globe,
  MapPin,
  Smile,
  Coffee,
  Check,
  Eye,
  EyeOff,
  Edit3,
  Award,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../api/profileApi';
import { verificationApi } from '../api/verificationApi';

export default function ProfilePage() {
  const { user, profile: authProfile, updateCurrentProfile } = useAuth();
  const [profile, setProfile] = useState(authProfile);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'interests' | 'lifestyle' | 'photos' | 'privacy'
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLatestProfile = async () => {
      try {
        setLoading(true);
        const res = await profileApi.getMyProfile();
        if (isMounted && res?.success && res.data) {
          setProfile(res.data);
          updateCurrentProfile(res.data);
        }
      } catch {
        // Fallback to auth profile
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchVerification = async () => {
      try {
        const vRes = await verificationApi.getStatus();
        if (isMounted && vRes?.success && vRes.data) {
          setVerificationData(vRes.data);
        }
      } catch {
        // Handled silently
      }
    };

    fetchLatestProfile();
    fetchVerification();
    return () => {
      isMounted = false;
    };
  }, []);

  const photos = profile?.photos || [];
  const completion = profile?.completionPercentage || 40;

  const verificationStatus =
    user?.studentIdVerificationStatus ||
    verificationData?.studentIdStatus ||
    'NONE';

  return (
    <div className="profile-page-container">
      {/* Profile Header Hero Card */}
      <div className="profile-hero-card">
        {/* Cover Photo / Background Gradient */}
        <div className="profile-cover-backdrop">
          {photos.length > 0 ? (
            <img src={photos[0]} alt="Cover" className="cover-backdrop-img" />
          ) : (
            <div className="cover-backdrop-gradient" />
          )}
          <div className="cover-overlay-shade" />
        </div>

        <div className="profile-hero-content">
          {/* Primary Photo Avatar */}
          <div className="profile-primary-avatar-wrap">
            {photos.length > 0 ? (
              <img src={photos[0]} alt={user?.firstName} className="profile-avatar-img" />
            ) : (
              <div className="avatar-placeholder-letter">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <Link to="/profile/edit" className="avatar-edit-badge" title="Change Photos">
              <Camera size={14} />
            </Link>
          </div>

          {/* Hero Meta Details */}
          <div className="profile-hero-meta">
            <div className="name-and-badges">
              <h1 className="profile-full-name">
                {user?.firstName} {user?.lastName}
                {profile?.pronouns && (
                  <span className="pronoun-tag">({profile.pronouns})</span>
                )}
              </h1>
              {profile?.privacySettings?.showAge !== false && profile?.age && (
                <span className="profile-age-tag">, {profile.age}</span>
              )}

              {/* Verified Status Pill */}
              {verificationStatus === 'APPROVED' ? (
                <span className="badge-verified">
                  <ShieldCheck size={14} /> Student Verified
                </span>
              ) : verificationStatus === 'PENDING' ? (
                <span className="badge-pending">
                  <Clock size={14} /> Verification Pending
                </span>
              ) : verificationStatus === 'RESUBMIT_REQUIRED' ? (
                <span className="badge-warning">
                  <AlertTriangle size={14} /> Resubmit ID Needed
                </span>
              ) : (
                <Link to="/onboarding" className="badge-unverified">
                  ⚡ Verify Student ID
                </Link>
              )}
            </div>

            {/* Vibe Punchline */}
            {profile?.vibeHeadline && (
              <div className="profile-vibe-headline">
                &ldquo;{profile.vibeHeadline}&rdquo;
              </div>
            )}

            {/* Meta Row: Program, City, Year */}
            <div className="profile-meta-row">
              <span className="meta-item">
                <GraduationCap size={16} />
                {profile?.program || 'MIT-WPU Student'}
                {profile?.year && ` • ${profile.year}`}
              </span>
              {profile?.city && (
                <span className="meta-item">
                  <MapPin size={15} />
                  {profile.city}
                </span>
              )}
              <span className="meta-item text-muted">
                <Mail size={15} />
                {user?.email}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="profile-hero-actions">
            <Link to="/profile/edit" className="btn btn-outline flex items-center gap-2">
              <Edit3 size={16} /> Edit Profile
            </Link>
            <Link to="/onboarding" className="btn btn-glass flex items-center gap-2" title="Retake Guided Setup">
              <Sparkles size={16} className="text-amber-400" /> Guided Tour
            </Link>
          </div>
        </div>

        {/* Profile Completion Bar */}
        <div className="profile-completion-meter-strip">
          <div className="completion-info">
            <span className="completion-label">
              <Award size={16} className="text-amber-400" />
              Your profile is <strong>{completion}% complete</strong>
            </span>
            <span className="completion-hint text-xs text-muted">
              {completion < 70
                ? 'Tip: Add more photos and answer weekend prompts to boost match synergy!'
                : 'Looking sharp! Your profile is highly visible on the discovery deck.'}
            </span>
          </div>
          <div className="meter-track-mini">
            <div className="meter-fill-mini" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="profile-tabs-header">
        {[
          { id: 'about', label: 'About & Story' },
          { id: 'interests', label: `Interests (${profile?.interests?.length || 0})` },
          { id: 'lifestyle', label: 'Lifestyle & Vibe' },
          { id: 'photos', label: `Photos (${photos.length}/6)` },
          { id: 'privacy', label: 'Privacy & Safety' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`profile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="profile-tab-content-area">

        {/* ================================================================ */}
        {/* TAB 1: ABOUT & STORY */}
        {/* ================================================================ */}
        {activeTab === 'about' && (
          <div className="tab-pane-content anim-fade-in">
            <div className="profile-two-col-grid">
              {/* Left Column: Bio & Story Prompts */}
              <div className="profile-card">
                <h3 className="card-section-title">About Me</h3>
                <p className="profile-bio-body">
                  {profile?.story?.aboutMe || profile?.bio || (
                    <span className="text-muted italic">
                      No bio added yet. Click &ldquo;Edit Profile&rdquo; to introduce yourself to campus peers!
                    </span>
                  )}
                </p>

                {/* Story Prompts Stack */}
                <div className="prompts-display-stack mt-5">
                  {profile?.story?.passionateAbout && (
                    <div className="story-prompt-item">
                      <span className="prompt-q">Something I&apos;m passionate about:</span>
                      <p className="prompt-a">{profile.story.passionateAbout}</p>
                    </div>
                  )}

                  {profile?.story?.perfectWeekend && (
                    <div className="story-prompt-item">
                      <span className="prompt-q">My perfect weekend:</span>
                      <p className="prompt-a">{profile.story.perfectWeekend}</p>
                    </div>
                  )}

                  {profile?.story?.talkAboutForHours && (
                    <div className="story-prompt-item">
                      <span className="prompt-q">What I can talk about for hours:</span>
                      <p className="prompt-a">{profile.story.talkAboutForHours}</p>
                    </div>
                  )}

                  {profile?.story?.randomFact && (
                    <div className="story-prompt-item">
                      <span className="prompt-q">One random fact about me:</span>
                      <p className="prompt-a">{profile.story.randomFact}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Academic Details & Languages */}
              <div className="profile-sidebar-stack">
                <div className="profile-card">
                  <h3 className="card-section-title">Academic Journey</h3>
                  <div className="info-list-rows">
                    <div className="info-row">
                      <span className="info-label">Degree & Program:</span>
                      <span className="info-val font-medium">{profile?.program || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Academic Year:</span>
                      <span className="info-val font-medium">{profile?.year || '1st Year'}</span>
                    </div>
                    {profile?.division && (
                      <div className="info-row">
                        <span className="info-label">Division / Batch:</span>
                        <span className="info-val font-medium">{profile.division}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">Campus:</span>
                      <span className="info-val font-medium">MIT-WPU Pune</span>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h3 className="card-section-title">Languages Spoken</h3>
                  {profile?.languages && profile.languages.length > 0 ? (
                    <div className="languages-tag-cloud">
                      {profile.languages.map((l, i) => (
                        <div key={i} className="lang-bubble">
                          <span className="lang-title">{typeof l === 'string' ? l : l.language}</span>
                          {l.proficiency && <span className="lang-prof">{l.proficiency}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-sm italic">English (Default)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: INTERESTS & LOOKING FOR */}
        {/* ================================================================ */}
        {activeTab === 'interests' && (
          <div className="tab-pane-content anim-fade-in">
            <div className="profile-card mb-6">
              <h3 className="card-section-title flex items-center justify-between">
                <span>Interests & Vibes ✨</span>
                <Link to="/profile/edit" className="text-xs text-primary">Edit Interests &rarr;</Link>
              </h3>
              {profile?.interests && profile.interests.length > 0 ? (
                <div className="chips-flex-wrap mt-3">
                  {profile.interests.map((item, idx) => (
                    <span key={idx} className="chip-tag active">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm italic">
                  No interests selected yet. Add interests to match with peers having similar passions.
                </p>
              )}
            </div>

            <div className="profile-card mb-6">
              <h3 className="card-section-title">What I&apos;m Looking For 💜</h3>
              {profile?.lookingFor && profile.lookingFor.length > 0 ? (
                <div className="chips-flex-wrap mt-3">
                  {profile.lookingFor.map((goal, idx) => (
                    <span key={idx} className="chip-tag active">
                      {goal}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm italic">Looking for friends and study partners.</p>
              )}
            </div>

            {profile?.preferredFields && profile.preferredFields.length > 0 && (
              <div className="profile-card">
                <h3 className="card-section-title">Interested Academic Fields 🎓</h3>
                <div className="chips-flex-wrap mt-3">
                  {profile.preferredFields.map((f, idx) => (
                    <span key={idx} className="chip-tag">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: LIFESTYLE & VIBE */}
        {/* ================================================================ */}
        {activeTab === 'lifestyle' && (
          <div className="tab-pane-content anim-fade-in">
            <div className="profile-two-col-grid">
              <div className="profile-card">
                <h3 className="card-section-title">Personality & Vibe</h3>
                {profile?.personality && profile.personality.length > 0 ? (
                  <div className="chips-flex-wrap mt-2">
                    {profile.personality.map((trait, idx) => (
                      <span key={idx} className="chip-tag active">
                        ✨ {trait}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm italic">No personality traits selected.</p>
                )}
              </div>

              <div className="profile-card">
                <h3 className="card-section-title">Daily Campus Habits</h3>
                <div className="lifestyle-read-rows">
                  <div className="habit-item">
                    <span className="habit-icon">🥗</span>
                    <div className="habit-text">
                      <span className="habit-label">Food Preference</span>
                      <span className="habit-val">{profile?.lifestyle?.foodPreference || 'Vegetarian'}</span>
                    </div>
                  </div>

                  <div className="habit-item">
                    <span className="habit-icon">🌙</span>
                    <div className="habit-text">
                      <span className="habit-label">Sleep Schedule</span>
                      <span className="habit-val">{profile?.lifestyle?.sleepSchedule || 'Flexible'}</span>
                    </div>
                  </div>

                  <div className="habit-item">
                    <span className="habit-icon">🏋️</span>
                    <div className="habit-text">
                      <span className="habit-label">Fitness</span>
                      <span className="habit-val">{profile?.lifestyle?.fitness || 'Casual'}</span>
                    </div>
                  </div>

                  <div className="habit-item">
                    <span className="habit-icon">🐾</span>
                    <div className="habit-text">
                      <span className="habit-label">Pets</span>
                      <span className="habit-val">{profile?.lifestyle?.pets || 'Love pets'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 4: 6-PHOTO GALLERY */}
        {/* ================================================================ */}
        {activeTab === 'photos' && (
          <div className="tab-pane-content anim-fade-in">
            <div className="profile-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="card-section-title">6-Slot Profile Gallery 📸</h3>
                  <p className="text-xs text-muted">
                    Photo 1 is your profile cover. You can upload up to 6 high-resolution campus photos.
                  </p>
                </div>
                <Link to="/profile/edit" className="btn btn-primary btn-sm">
                  Manage & Upload Photos
                </Link>
              </div>

              <div className="six-photos-grid">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const photoUrl = photos[index];
                  return (
                    <div
                      key={index}
                      className={`photo-slot-card ${photoUrl ? 'has-image' : 'empty'} ${index === 0 && photoUrl ? 'is-cover' : ''}`}
                    >
                      {photoUrl ? (
                        <div className="photo-wrapper">
                          <img src={photoUrl} alt={`Slot ${index + 1}`} className="slot-img" />
                          {index === 0 && <span className="cover-badge">★ Primary Cover</span>}
                        </div>
                      ) : (
                        <Link to="/profile/edit" className="slot-empty-content">
                          <Camera size={22} className="text-muted" />
                          <span className="slot-number">Slot {index + 1}</span>
                          {index === 0 && <span className="slot-primary-hint">Primary</span>}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 5: PRIVACY & SAFETY */}
        {/* ================================================================ */}
        {activeTab === 'privacy' && (
          <div className="tab-pane-content anim-fade-in">
            <div className="profile-card">
              <h3 className="card-section-title">Privacy & Discoverability Settings</h3>
              <p className="text-xs text-muted mb-4">
                CampusMitra lets you decide exactly what information is visible to other students.
              </p>

              <div className="info-list-rows">
                <div className="info-row">
                  <span className="info-label">Discovery Visibility:</span>
                  <span className="info-val font-semibold text-emerald-400">
                    {profile?.privacySettings?.discoveryVisibility !== false ? 'Active on Campus Deck' : 'Hidden'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Show Exact Age:</span>
                  <span className="info-val">
                    {profile?.privacySettings?.showAge !== false ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Show Degree & Program:</span>
                  <span className="info-val">
                    {profile?.privacySettings?.showProgram !== false ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Show Lifestyle:</span>
                  <span className="info-val">
                    {profile?.privacySettings?.showLifestyle !== false ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Student ID Verification:</span>
                  <span className="info-val font-semibold">
                    {verificationStatus === 'APPROVED'
                      ? '✓ Approved'
                      : verificationStatus === 'PENDING'
                      ? '⏳ Pending Review'
                      : 'Not Verified'}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <Link to="/settings" className="btn btn-outline btn-sm">
                  Modify Privacy Settings
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
