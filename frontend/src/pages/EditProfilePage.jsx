import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Save,
  Camera,
  Trash2,
  Plus,
  ArrowLeft,
  Upload,
  Check,
  Sparkles,
  X,
  Search,
} from 'lucide-react';
import { profileApi } from '../api/profileApi';
import { interestApi } from '../api/interestApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Postgraduate',
  'PhD / Research',
];

const LOOKING_FOR_OPTIONS = [
  '🤝 New Friends',
  '📚 Study Partners',
  '🏏 Activity Partners',
  '🎮 Gaming Buddies',
  '🎵 Music Friends',
  '🎬 Movie Friends',
  '💻 Coding Buddies',
  '🚀 Startup / Entrepreneurship',
  '🌍 Travel Friends',
  '☕ Casual Hangouts',
  '🎨 Creative Friends',
  '🏋️ Fitness Partners',
  '❤️ Dating',
];

const PERSONALITY_TRAITS = [
  'Introvert', 'Extrovert', 'Ambivert', 'Chill', 'Adventurous', 'Funny',
  'Ambitious', 'Creative', 'Bookworm', 'Techie', 'Sporty', 'Social butterfly',
  'Deep thinker', 'Night owl', 'Early bird', 'Foodie', 'Traveler', 'Music lover',
  'Movie buff', 'Fitness lover',
];

export default function EditProfilePage() {
  const { user, profile: authProfile, updateCurrentProfile, refreshUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    pronouns: authProfile?.pronouns || '',
    city: authProfile?.city || 'Pune',
    division: authProfile?.division || '',
    program: authProfile?.program || 'MCA (Computer Applications)',
    department: authProfile?.department || 'School of Computer Science & Engineering',
    year: authProfile?.year || '1st Year',
    bio: authProfile?.bio || '',
    vibeHeadline: authProfile?.vibeHeadline || '',
    lookingFor: authProfile?.lookingFor || ['🤝 New Friends', '📚 Study Partners'],
    interests: authProfile?.interests || ['💻 Coding', '🎵 Music', '☕ Coffee'],
    personality: authProfile?.personality || ['Techie', 'Chill'],
    lifestyle: {
      foodPreference: authProfile?.lifestyle?.foodPreference || 'Vegetarian',
      drinking: authProfile?.lifestyle?.drinking || 'Prefer not to say',
      smoking: authProfile?.lifestyle?.smoking || 'Prefer not to say',
      pets: authProfile?.lifestyle?.pets || 'Love pets',
      fitness: authProfile?.lifestyle?.fitness || 'Casual',
      sleepSchedule: authProfile?.lifestyle?.sleepSchedule || 'Night owl',
    },
    story: {
      aboutMe: authProfile?.story?.aboutMe || authProfile?.bio || '',
      passionateAbout: authProfile?.story?.passionateAbout || '',
      perfectWeekend: authProfile?.story?.perfectWeekend || '',
      talkAboutForHours: authProfile?.story?.talkAboutForHours || '',
      randomFact: authProfile?.story?.randomFact || '',
    },
  });

  const [photos, setPhotos] = useState(authProfile?.photos || []);
  const [loading, setLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [customInterest, setCustomInterest] = useState('');

  const fileInputRef = useRef(null);
  const [activeSlot, setActiveSlot] = useState(null);

  useEffect(() => {
    if (authProfile) {
      setFormData((prev) => ({
        ...prev,
        firstName: user?.firstName || prev.firstName,
        lastName: user?.lastName || prev.lastName,
        pronouns: authProfile.pronouns || prev.pronouns,
        city: authProfile.city || prev.city,
        division: authProfile.division || prev.division,
        program: authProfile.program || prev.program,
        year: authProfile.year || prev.year,
        bio: authProfile.bio || prev.bio,
        vibeHeadline: authProfile.vibeHeadline || prev.vibeHeadline,
        lookingFor: authProfile.lookingFor || prev.lookingFor,
        interests: authProfile.interests || prev.interests,
        personality: authProfile.personality || prev.personality,
        lifestyle: authProfile.lifestyle ? { ...prev.lifestyle, ...authProfile.lifestyle } : prev.lifestyle,
        story: authProfile.story ? { ...prev.story, ...authProfile.story } : prev.story,
      }));
      setPhotos(authProfile.photos || []);
    }
  }, [authProfile, user]);

  // Handle Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG, and WebP images are allowed', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be under 5MB', 'error');
      return;
    }

    try {
      setUploadingSlot(activeSlot);
      const fd = new FormData();
      fd.append('photo', file);

      const res = await profileApi.uploadPhoto(fd);
      if (res?.success && res.data) {
        setPhotos(res.data.photos);
        updateCurrentProfile({ ...authProfile, photos: res.data.photos });
        showToast('Photo uploaded successfully! 📸', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Photo upload failed', 'error');
    } finally {
      setUploadingSlot(null);
      setActiveSlot(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    try {
      const res = await profileApi.deletePhoto(photoUrl);
      if (res?.success && res.data) {
        setPhotos(res.data.photos);
        updateCurrentProfile({ ...authProfile, photos: res.data.photos });
        showToast('Photo removed', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Could not delete photo', 'error');
    }
  };

  const handleMakeCoverPhoto = async (index) => {
    if (index === 0) return;
    const reordered = [...photos];
    const [selected] = reordered.splice(index, 1);
    reordered.unshift(selected);

    try {
      const res = await profileApi.reorderPhotos(reordered);
      if (res?.success) {
        setPhotos(reordered);
        updateCurrentProfile({ ...authProfile, photos: reordered });
        showToast('Primary cover photo updated ✨', 'success');
      }
    } catch {
      // Revert if error
    }
  };

  const handleInterestToggle = (item) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(item);
      return {
        ...prev,
        interests: exists ? prev.interests.filter((i) => i !== item) : [...prev.interests, item],
      };
    });
  };

  const handleAddCustomInterest = (e) => {
    e.preventDefault();
    if (!customInterest.trim()) return;
    const trimmed = customInterest.trim();
    if (!formData.interests.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
    }
    setCustomInterest('');
  };

  const handleGoalToggle = (goal) => {
    setFormData((prev) => {
      const exists = prev.lookingFor.includes(goal);
      return {
        ...prev,
        lookingFor: exists ? prev.lookingFor.filter((g) => g !== goal) : [...prev.lookingFor, goal],
      };
    });
  };

  const handlePersonalityToggle = (trait) => {
    setFormData((prev) => {
      const exists = prev.personality.includes(trait);
      return {
        ...prev,
        personality: exists ? prev.personality.filter((p) => p !== trait) : [...prev.personality, trait],
      };
    });
  };

  // Submit all edits
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await profileApi.updateProfile(formData);
      if (res?.success && res.data) {
        updateCurrentProfile(res.data);
        showToast('Profile updated successfully! ✨', 'success');
        refreshUser();
        navigate('/profile');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-page-container">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      <div className="edit-profile-header">
        <Link to="/profile" className="btn btn-ghost btn-sm flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Profile
        </Link>
        <h1 className="page-title text-2xl font-bold">Edit Profile & Photos</h1>
        <p className="page-subtitle text-muted text-sm">
          Keep your campus details, vibes, and photos fresh.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="edit-profile-form">
        {/* ================================================================ */}
        {/* SECTION 1: 6-PHOTO GALLERY */}
        {/* ================================================================ */}
        <div className="profile-card mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-section-title flex items-center gap-2">
              <Camera size={18} className="text-primary" /> 6-Slot Profile Photo Gallery
            </h3>
            <span className="text-xs text-muted font-medium">{photos.length} / 6 Photos</span>
          </div>
          <p className="text-xs text-muted mb-4">
            Upload clear photos. Photo 1 is your primary cover shown on the discover deck.
          </p>

          <div className="six-photos-grid">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const photoUrl = photos[index];
              const isCover = index === 0 && Boolean(photoUrl);

              return (
                <div
                  key={index}
                  className={`photo-slot-card ${photoUrl ? 'has-image' : 'empty'} ${isCover ? 'is-cover' : ''}`}
                  onClick={() => {
                    if (!photoUrl) {
                      setActiveSlot(index);
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {photoUrl ? (
                    <div className="photo-wrapper">
                      <img src={photoUrl} alt={`Slot ${index + 1}`} className="slot-img" />
                      {isCover && <span className="cover-badge">★ Cover</span>}

                      <div className="photo-hover-overlay">
                        {!isCover && (
                          <button
                            type="button"
                            className="overlay-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMakeCoverPhoto(index);
                            }}
                          >
                            Set Cover
                          </button>
                        )}
                        <button
                          type="button"
                          className="overlay-btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photoUrl);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="slot-empty-content">
                      <div className="slot-plus-icon">
                        {uploadingSlot === index ? (
                          <div className="spinner-border" />
                        ) : (
                          <Plus size={22} />
                        )}
                      </div>
                      <span className="slot-number">Slot {index + 1}</span>
                      {index === 0 && <span className="slot-primary-hint">Primary</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 2: BASIC DETAILS */}
        {/* ================================================================ */}
        <div className="profile-card mb-6">
          <h3 className="card-section-title mb-4">Basic Information</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.firstName}
                onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.lastName}
                onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Pronouns</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. they/them, she/her, he/him"
                value={formData.pronouns}
                onChange={(e) => setFormData((p) => ({ ...p, pronouns: e.target.value }))}
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">City</label>
              <input
                type="text"
                className="form-control"
                value={formData.city}
                onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Degree / Program</label>
              <input
                type="text"
                className="form-control"
                value={formData.program}
                onChange={(e) => setFormData((p) => ({ ...p, program: e.target.value }))}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label className="form-label">Academic Year</label>
              <select
                className="form-control"
                value={formData.year}
                onChange={(e) => setFormData((p) => ({ ...p, year: e.target.value }))}
              >
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Campus Vibe Headline</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Coffee + coding + cricket ☕💻🏏"
              value={formData.vibeHeadline}
              onChange={(e) => setFormData((p) => ({ ...p, vibeHeadline: e.target.value }))}
              maxLength={120}
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 3: BIO & STORY PROMPTS */}
        {/* ================================================================ */}
        <div className="profile-card mb-6">
          <h3 className="card-section-title mb-4">Your Story & Prompts</h3>
          <div className="form-group">
            <label className="form-label">About Me (Bio)</label>
            <textarea
              rows={3}
              className="form-control"
              placeholder="Tell campus peers about your projects, studies and passions..."
              value={formData.story.aboutMe}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  story: { ...p.story, aboutMe: e.target.value },
                }))
              }
              maxLength={300}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Something I&apos;m passionate about</label>
            <textarea
              rows={2}
              className="form-control"
              value={formData.story.passionateAbout}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  story: { ...p.story, passionateAbout: e.target.value },
                }))
              }
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">My perfect weekend</label>
            <textarea
              rows={2}
              className="form-control"
              value={formData.story.perfectWeekend}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  story: { ...p.story, perfectWeekend: e.target.value },
                }))
              }
              maxLength={200}
            />
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 4: INTERESTS */}
        {/* ================================================================ */}
        <div className="profile-card mb-6">
          <h3 className="card-section-title mb-3">Interests & Vibes ✨</h3>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="+ Add custom interest..."
              value={customInterest}
              onChange={(e) => setCustomInterest(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm px-4"
              onClick={handleAddCustomInterest}
            >
              Add
            </button>
          </div>

          <div className="chips-flex-wrap">
            {formData.interests.map((item) => (
              <span
                key={item}
                className="chip-tag active"
                onClick={() => handleInterestToggle(item)}
                title="Click to remove"
              >
                {item} <X size={14} className="ml-1" />
              </span>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 5: WHAT ARE YOU LOOKING FOR */}
        {/* ================================================================ */}
        <div className="profile-card mb-6">
          <h3 className="card-section-title mb-3">Looking For on Campus 💜</h3>
          <div className="chips-flex-wrap">
            {LOOKING_FOR_OPTIONS.map((goal) => {
              const isSelected = formData.lookingFor.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  className={`chip-tag ${isSelected ? 'active' : ''}`}
                  onClick={() => handleGoalToggle(goal)}
                >
                  {goal} {isSelected && <Check size={14} className="ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================ */}
        {/* SECTION 6: LIFESTYLE & PERSONALITY */}
        {/* ================================================================ */}
        <div className="profile-card mb-6">
          <h3 className="card-section-title mb-3">Personality Traits</h3>
          <div className="chips-flex-wrap mb-4">
            {PERSONALITY_TRAITS.map((trait) => {
              const isSelected = formData.personality.includes(trait);
              return (
                <button
                  key={trait}
                  type="button"
                  className={`chip-tag ${isSelected ? 'active' : ''}`}
                  onClick={() => handlePersonalityToggle(trait)}
                >
                  {trait} {isSelected && <Check size={14} className="ml-1" />}
                </button>
              );
            })}
          </div>

          <h3 className="card-section-title mb-3 mt-5">Daily Lifestyle</h3>
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Food Preference</label>
              <select
                className="form-control"
                value={formData.lifestyle.foodPreference}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    lifestyle: { ...p.lifestyle, foodPreference: e.target.value },
                  }))
                }
              >
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-vegetarian">Non-vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Eggetarian">Eggetarian</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Sleep Schedule</label>
              <select
                className="form-control"
                value={formData.lifestyle.sleepSchedule}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    lifestyle: { ...p.lifestyle, sleepSchedule: e.target.value },
                  }))
                }
              >
                <option value="Early bird">Early bird</option>
                <option value="Night owl">Night owl</option>
                <option value="Flexible">Flexible</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="edit-save-sticky-bar">
          <button
            type="submit"
            className="btn btn-primary btn-lg flex items-center gap-2"
            disabled={loading}
          >
            <Save size={18} /> {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
