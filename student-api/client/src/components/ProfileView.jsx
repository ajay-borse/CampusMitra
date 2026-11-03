import { useState, useRef } from 'react';
import { fireConfetti } from '../utils/confetti';
import { profileApi } from '../services/campusApi';

const TAXONOMY_INTERESTS = [
  '💻 Web Development',
  '🤖 AI & Machine Learning',
  '📱 App Development',
  '🔐 Cybersecurity',
  '☁️ Cloud & DevOps',
  '🎨 UI/UX Design',
  '📊 Data Science',
  '🚀 Startups & Entrepreneurship',
  '☕ Chai & Late Night Talks',
  '📚 Library Study Sessions',
  '🏸 Badminton',
  '🏏 Inter-College Cricket',
  '🎮 LAN & Esports',
  '🎸 Acoustic Guitar',
  '📸 Campus Photography',
  '🍕 Cafe Hopping',
  '⛺ Sahyadri Trekking',
  '🎭 Dramatics & Theatre',
];

const LOOKING_FOR_OPTIONS = [
  { value: 'study_partner', label: '📚 Study Partner' },
  { value: 'friendship', label: '🤝 Campus Friends' },
  { value: 'networking', label: '🚀 Project & Hackathons' },
  { value: 'dating', label: '💜 Dating (18+ only)', minAge: 18 },
  { value: 'roommate', label: '🏠 Flatmate / Roommate' },
];

/**
 * ProfileView Component
 * Complete student profile editor with:
 * - Real 6-slot photo upload & delete via Multer backend
 * - Server-persisted bio, program, batch, lookingFor, and interests
 * - Age-restricted dating options
 * - Dynamic profile completion score & confetti celebration
 */
export default function ProfileView({
  user,
  profile,
  onProfileUpdated,
  onNavigate,
  showToast,
}) {
  const [bio, setBio] = useState(profile?.bio || '');
  const [program, setProgram] = useState(profile?.program || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [graduationYear, setGraduationYear] = useState(profile?.graduationYear || 2026);
  const [lookingFor, setLookingFor] = useState(profile?.lookingFor || 'friendship');
  const [selectedInterests, setSelectedInterests] = useState(profile?.interests || []);
  const [photos, setPhotos] = useState(profile?.photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Check if user is eligible for dating (18+)
  const isEligibleForDating = user?.age >= 18;

  // Toggle interest
  const handleToggleInterest = (interestLabel) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interestLabel)) {
        return prev.filter((i) => i !== interestLabel);
      } else {
        if (prev.length >= 10) {
          showToast?.('Maximum 10 interests allowed', 'error');
          return prev;
        }
        return [...prev, interestLabel];
      }
    });
  };

  // Upload photo handler
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= 6) {
      showToast?.('Maximum 6 photos allowed', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const res = await profileApi.uploadPhoto(file);
      if (res.success && res.data) {
        setPhotos(res.data.photos);
        onProfileUpdated?.(res.data);
        showToast?.('Photo uploaded successfully! 📸', 'success');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      showToast?.(err.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete photo handler
  const handleDeletePhoto = async (index, e) => {
    e.stopPropagation();
    try {
      const res = await profileApi.deletePhoto(index);
      if (res.success && res.data) {
        setPhotos(res.data.photos);
        onProfileUpdated?.(res.data);
        showToast?.('Photo removed', 'info');
      }
    } catch (err) {
      console.error('Delete photo error:', err);
      showToast?.(err.message || 'Failed to delete photo', 'error');
    }
  };

  // Calculate dynamic completion score
  const filledPhotos = photos.length;
  const hasInterests = selectedInterests.length >= 3;
  const hasBio = bio.trim().length >= 20;
  const hasProgram = Boolean(program.trim());
  const completionScore = Math.min(
    100,
    20 + // baseline account
      filledPhotos * 8 + // up to 48%
      (hasInterests ? 16 : 6) +
      (hasBio ? 10 : 0) +
      (hasProgram ? 6 : 0)
  );

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload = {
        bio,
        program,
        department,
        graduationYear: Number(graduationYear),
        lookingFor,
        interests: selectedInterests,
      };

      const res = await profileApi.updateProfile(payload);
      if (res.success && res.data) {
        onProfileUpdated?.(res.data);
        showToast?.('Profile updated successfully! ✨', 'success');
        if (res.data.completionPercentage === 100 || completionScore >= 95) {
          fireConfetti(2500);
        }
      }
    } catch (err) {
      console.error('Save profile error:', err);
      showToast?.(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const primaryPhoto =
    photos[0] ||
    user?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="page-view profile-view animate-fade-in">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        style={{ display: 'none' }}
      />

      {/* Profile Header Hero Card */}
      <div className="profile-hero-card">
        <div className="profile-banner-bg" />

        <div className="profile-main-meta">
          <div className="profile-avatar-primary">
            <img src={primaryPhoto} alt={user?.firstName} className="avatar-img-large" />
            <span className="avatar-badge-star">✨</span>
          </div>

          <div className="profile-identity">
            <div className="identity-title-row">
              <h1 className="profile-name">
                {user?.firstName} {user?.lastName}
                {user?.age ? <span className="profile-age">, {user.age}</span> : null}
              </h1>
              <span className="badge badge-success">
                ✓ Verified MIT-WPU Student
              </span>
            </div>
            <p className="profile-university">
              🎓 {program || 'Add Program'} &bull; Class of {graduationYear}
            </p>
            <p className="profile-email-badge">
              🛡️ {user?.email}
            </p>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="completion-bar-box">
          <div className="completion-labels">
            <span className="comp-label">Profile Strength</span>
            <span className="comp-pct">{completionScore}% Complete</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${completionScore}%` }}
            />
          </div>
          {completionScore >= 95 ? (
            <p className="comp-congrats">
              🎉 Your profile is complete! You have maximum campus discoverability.
            </p>
          ) : (
            <p className="comp-hint">
              💡 Add up to 6 photos, a bio, and 3+ interests to reach 100% profile strength!
            </p>
          )}
        </div>
      </div>

      <div className="profile-grid-sections">
        {/* Photos 6-Grid */}
        <section className="profile-section-card">
          <div className="section-title-wrap">
            <h2 className="section-card-title">📷 Campus Photos (6 Slots)</h2>
            <span className="section-card-subtitle">
              Slot #1 is your primary photo shown in Discover cards. Upload real campus photos!
            </span>
          </div>

          <div className="photo-grid-six">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const photoUrl = photos[idx];
              return (
                <div
                  key={idx}
                  className={`photo-slot ${idx === 0 ? 'slot-primary' : ''} ${
                    photoUrl ? 'has-photo' : 'empty-slot'
                  }`}
                >
                  {photoUrl ? (
                    <>
                      <img src={photoUrl} alt={`Slot ${idx + 1}`} className="slot-img" />
                      {idx === 0 && <span className="primary-pill">Primary</span>}
                      <button
                        type="button"
                        className="slot-delete-btn"
                        onClick={(e) => handleDeletePhoto(idx, e)}
                        title="Delete photo"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="add-photo-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <span>{isUploading ? '⏳' : '+'}</span>
                      <span className="add-text">
                        {isUploading ? 'Uploading...' : `Slot ${idx + 1}`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Academic & Goal Information */}
        <section className="profile-section-card">
          <div className="section-title-wrap">
            <h2 className="section-card-title">🎓 Academic & Campus Goals</h2>
            <span className="section-card-subtitle">Help classmates find you for study groups and projects</span>
          </div>

          <div className="form-group-grid">
            <div className="form-group">
              <label className="field-label" htmlFor="profile-program-input">Degree & Program</label>
              <input
                id="profile-program-input"
                type="text"
                className="input-field"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="e.g. B.Tech Computer Science / MCA"
              />
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="profile-department-input">School / Faculty</label>
              <input
                id="profile-department-input"
                type="text"
                className="input-field"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. School of Computer Engineering & Tech"
              />
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="profile-batch-select">Graduation Year</label>
              <select
                id="profile-batch-select"
                className="input-field"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
                <option value={2029}>2029</option>
              </select>
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="profile-lookingfor-select">Looking For on Campus</label>
              <select
                id="profile-lookingfor-select"
                className="input-field"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
              >
                {LOOKING_FOR_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.minAge && !isEligibleForDating}
                  >
                    {opt.label} {!isEligibleForDating && opt.minAge ? '(Requires 18+)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Bio */}
        <section className="profile-section-card">
          <div className="section-title-wrap">
            <h2 className="section-card-title">📝 Campus Bio & Intro</h2>
            <span className="section-card-subtitle">Share your projects, courses, hobbies, or campus vibe</span>
          </div>

          <textarea
            className="bio-textarea"
            rows="4"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your fellow MIT-WPU students about your interests, current projects, or favorite campus spots..."
          />
        </section>

        {/* Interests Selection */}
        <section className="profile-section-card">
          <div className="section-title-wrap">
            <h2 className="section-card-title">🎯 Interests & Campus Vibes ({selectedInterests.length}/10)</h2>
            <span className="section-card-subtitle">
              Select what describes you best. We compute compatibility scores based on these!
            </span>
          </div>

          <div className="interests-selection-grid">
            {TAXONOMY_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  className={`interest-selection-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleToggleInterest(interest)}
                >
                  <span className="chip-label">{interest}</span>
                  {isSelected ? (
                    <span className="chip-check-badge">✓ Selected</span>
                  ) : (
                    <span className="chip-plus">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="profile-save-bar">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onNavigate?.('home')}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary btn-glow"
          onClick={handleSaveProfile}
          disabled={isSaving}
          id="save-profile-btn"
        >
          <span>{isSaving ? '⏳ Saving...' : '✓ Save Profile Changes'}</span>
        </button>
      </div>
    </div>
  );
}
