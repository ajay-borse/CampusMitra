import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  ShieldCheck,
  Sparkles,
  Heart,
  Users,
  BookOpen,
  Gamepad2,
  Music,
  Film,
  Code,
  Rocket,
  Coffee,
  Palette,
  Dumbbell,
  Search,
  Plus,
  Trash2,
  Camera,
  AlertCircle,
  Calendar,
  GraduationCap,
  Globe,
  Smile,
  Lock,
  ArrowRight,
  Check,
  Compass,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileApi } from '../api/profileApi';
import { verificationApi } from '../api/verificationApi';
import { interestApi } from '../api/interestApi';

// ============================================================================
// Constants & Catalogs
// ============================================================================
const LOOKING_FOR_OPTIONS = [
  { id: '🤝 New Friends', label: 'New Friends', icon: '🤝', desc: 'Expand your campus circle' },
  { id: '📚 Study Partners', label: 'Study Partners', icon: '📚', desc: 'Collaborate on exams & notes' },
  { id: '🏏 Activity Partners', label: 'Activity Partners', icon: '🏏', desc: 'Sports, gym & outdoors' },
  { id: '🎮 Gaming Buddies', label: 'Gaming Buddies', icon: '🎮', desc: 'Valorant, BGMI, FIFA sessions' },
  { id: '🎵 Music Friends', label: 'Music Friends', icon: '🎵', desc: 'Jamming & playlist swapping' },
  { id: '🎬 Movie Friends', label: 'Movie Friends', icon: '🎬', desc: 'Cinema trips & binge watches' },
  { id: '💻 Coding Buddies', label: 'Coding Buddies', icon: '💻', desc: 'Hackathons & project dev' },
  { id: '🚀 Startup / Entrepreneurship', label: 'Startups & Ventures', icon: '🚀', desc: 'Ideas, pitch decks & builds' },
  { id: '🌍 Travel Friends', label: 'Travel Friends', icon: '🌍', desc: 'Treks, road trips & wanderlust' },
  { id: '☕ Casual Hangouts', label: 'Casual Hangouts', icon: '☕', desc: 'Chai breaks & fountain talks' },
  { id: '🎨 Creative Friends', label: 'Creative Friends', icon: '🎨', desc: 'Design, art & photography' },
  { id: '🏋️ Fitness Partners', label: 'Fitness Partners', icon: '🏋️', desc: 'Gym bro/sis & yoga flow' },
  { id: '❤️ Dating', label: 'Dating (18+)', icon: '❤️', desc: 'Campus romance & meaningful dating', requiresAdult: true },
];

const GENDER_MEET_OPTIONS = [
  { id: 'Everyone', label: 'Everyone on Campus', emoji: '🌈', desc: 'Open to meeting all students' },
  { id: 'Women', label: 'Women', emoji: '👩', desc: 'Connect with female peers' },
  { id: 'Men', label: 'Men', emoji: '👨', desc: 'Connect with male peers' },
  { id: 'Non-binary people', label: 'Non-binary People', emoji: '✨', desc: 'Connect with non-binary peers' },
  { id: 'Prefer not to say', label: 'No Preference', emoji: '🤝', desc: 'Keep preferences neutral' },
];

const ACADEMIC_FIELDS = [
  'Computer Science', 'Information Technology', 'Artificial Intelligence', 'Data Science',
  'Machine Learning', 'Cybersecurity', 'Software Engineering', 'Electronics',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Architecture',
  'Design', 'UI/UX', 'Fashion Design', 'Psychology', 'Law', 'Business', 'Finance',
  'Marketing', 'Management', 'Economics', 'Commerce', 'Media', 'Journalism', 'Film',
  'Animation', 'Photography', 'Biotechnology', 'Pharmacy', 'Medicine', 'Science',
  'Mathematics', 'Research', 'Entrepreneurship', 'Startups', 'Social Sciences',
  'Languages', 'Literature', 'Arts', 'Music',
];

const LANGUAGES_CATALOG = [
  // Indian
  { name: 'Marathi', flag: '🇮🇳' }, { name: 'Hindi', flag: '🇮🇳' }, { name: 'English', flag: '🇬🇧' },
  { name: 'Gujarati', flag: '🇮🇳' }, { name: 'Bengali', flag: '🇮🇳' }, { name: 'Tamil', flag: '🇮🇳' },
  { name: 'Telugu', flag: '🇮🇳' }, { name: 'Kannada', flag: '🇮🇳' }, { name: 'Malayalam', flag: '🇮🇳' },
  { name: 'Punjabi', flag: '🇮🇳' }, { name: 'Urdu', flag: '🇮🇳' }, { name: 'Odia', flag: '🇮🇳' },
  { name: 'Assamese', flag: '🇮🇳' }, { name: 'Konkani', flag: '🇮🇳' }, { name: 'Sanskrit', flag: '🇮🇳' },
  // International
  { name: 'Spanish', flag: '🇪🇸' }, { name: 'French', flag: '🇫🇷' }, { name: 'German', flag: '🇩🇪' },
  { name: 'Japanese', flag: '🇯🇵' }, { name: 'Korean', flag: '🇰🇷' }, { name: 'Italian', flag: '🇮🇹' },
  { name: 'Russian', flag: '🇷🇺' }, { name: 'Arabic', flag: '🇸🇦' }, { name: 'Chinese', flag: '🇨🇳' },
];

const PERSONALITY_OPTIONS = [
  { id: 'Introvert', icon: '🎧', desc: 'Recharges with solo downtime' },
  { id: 'Extrovert', icon: '🎉', desc: 'Thrives on campus energy' },
  { id: 'Ambivert', icon: '⚖️', desc: 'Best of both worlds' },
  { id: 'Chill', icon: '🌿', desc: 'Easygoing & relaxed vibe' },
  { id: 'Adventurous', icon: '🧗', desc: 'Always up for spontaneous plans' },
  { id: 'Funny', icon: '😂', desc: 'Can make anyone crack up' },
  { id: 'Ambitious', icon: '🚀', desc: 'Big goals & side projects' },
  { id: 'Creative', icon: '🎨', desc: 'Artist, writer or designer soul' },
  { id: 'Bookworm', icon: '📚', desc: 'Forever reading something new' },
  { id: 'Techie', icon: '💻', desc: 'Codes, builds & tinkers' },
  { id: 'Sporty', icon: '🏏', desc: 'Always on the pitch or court' },
  { id: 'Social butterfly', icon: '🦋', desc: 'Knows everyone on campus' },
  { id: 'Deep thinker', icon: '🌌', desc: 'Late night existential talks' },
  { id: 'Night owl', icon: '🌙', desc: 'Most creative past midnight' },
  { id: 'Early bird', icon: '🌅', desc: 'Productive at the crack of dawn' },
  { id: 'Foodie', icon: '🍜', desc: 'Knows all Pune street food spots' },
  { id: 'Traveler', icon: '🎒', desc: 'Next trip is already booked' },
  { id: 'Music lover', icon: '🎵', desc: 'Headphones 24/7' },
  { id: 'Movie buff', icon: '🍿', desc: 'Seen every classic & indie gem' },
  { id: 'Fitness lover', icon: '🏋️', desc: 'Consistent gym or yoga routine' },
];

export default function OnboardingPage() {
  const { user, profile, refreshUser, updateCurrentProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 12 Functional Steps + 1 Celebration Screen
  const TOTAL_STEPS = 12;
  const [currentStep, setCurrentStep] = useState(() => {
    return profile?.onboardingStep && profile.onboardingStep <= 13 ? profile.onboardingStep : 1;
  });

  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState('forward'); // 'forward' or 'backward'

  // Master State Draft
  const [formData, setFormData] = useState({
    // Step 1: Verification
    studentIdFile: null,
    studentIdPreview: null,
    studentIdStatus: user?.studentIdVerificationStatus || 'NONE',
    studentIdUploaded: false,
    // Step 2: About You
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    gender: user?.gender || profile?.gender || 'Prefer not to say',
    pronouns: profile?.pronouns || '',
    city: profile?.city || 'Pune',
    program: profile?.program || 'MCA (Computer Applications)',
    department: profile?.department || 'School of Computer Science & Engineering',
    year: profile?.year || '1st Year',
    division: profile?.division || '',
    bio: profile?.bio || '',
    // Step 3: Looking for
    lookingFor: profile?.lookingFor || ['🤝 New Friends', '📚 Study Partners'],
    // Step 4: Looking for gender
    lookingForGender: profile?.lookingForGender || 'Everyone',
    // Step 5: Interests
    interests: profile?.interests || ['💻 Coding', '🎵 Music', '☕ Coffee'],
    // Step 6: Fields of Interest
    preferredFields: profile?.preferredFields || ['Computer Science', 'Artificial Intelligence'],
    // Step 7: Languages
    languages: profile?.languages?.length ? profile.languages : [{ language: 'English', proficiency: 'Fluent' }],
    // Step 8: Lifestyle
    lifestyle: {
      foodPreference: profile?.lifestyle?.foodPreference || 'Vegetarian',
      drinking: profile?.lifestyle?.drinking || 'Prefer not to say',
      smoking: profile?.lifestyle?.smoking || 'Prefer not to say',
      pets: profile?.lifestyle?.pets || 'Love pets',
      fitness: profile?.lifestyle?.fitness || 'Casual',
      sleepSchedule: profile?.lifestyle?.sleepSchedule || 'Night owl',
      socialStyle: profile?.lifestyle?.socialStyle || 'Ambivert',
    },
    // Step 9: Personality
    personality: profile?.personality || ['Techie', 'Chill', 'Creative'],
    vibeHeadline: profile?.vibeHeadline || '',
    // Step 10: Your Story
    story: {
      aboutMe: profile?.story?.aboutMe || profile?.bio || '',
      passionateAbout: profile?.story?.passionateAbout || '',
      perfectWeekend: profile?.story?.perfectWeekend || '',
      talkAboutForHours: profile?.story?.talkAboutForHours || '',
      randomFact: profile?.story?.randomFact || '',
    },
    // Step 11: Photos
    photos: profile?.photos || [],
    // Step 12: Matching Preferences & Privacy
    discoveryAudience: profile?.discoveryAudience || 'everyone',
    showInCategories: profile?.showInCategories || ['Friends', 'Study', 'Activities'],
    privacySettings: {
      profileVisibility: profile?.privacySettings?.profileVisibility !== false,
      showAge: profile?.privacySettings?.showAge !== false,
      showProgram: profile?.privacySettings?.showProgram !== false,
      showLifestyle: profile?.privacySettings?.showLifestyle !== false,
      showLanguages: profile?.privacySettings?.showLanguages !== false,
      discoveryVisibility: profile?.privacySettings?.discoveryVisibility !== false,
    },
  });

  // Calculate user age server/client sync
  const userAge = user?.dateOfBirth
    ? Math.floor((new Date() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
    : profile?.age || 18;
  const isAdult = userAge >= 18;

  // Interests catalog state
  const [interestCategories, setInterestCategories] = useState([]);
  const [availableInterests, setAvailableInterests] = useState([]);
  const [selectedInterestCategory, setSelectedInterestCategory] = useState('All');
  const [interestSearch, setInterestSearch] = useState('');
  const [customInterestInput, setCustomInterestInput] = useState('');

  // Fields and Languages search state
  const [fieldSearch, setFieldSearch] = useState('');
  const [customFieldInput, setCustomFieldInput] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [customLangInput, setCustomLangInput] = useState('');

  // Photos upload state
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState(null);
  const fileInputRef = useRef(null);
  const [activePhotoSlot, setActivePhotoSlot] = useState(null);

  // ID Card upload state
  const [idUploading, setIdUploading] = useState(false);
  const idInputRef = useRef(null);

  // Load interests from backend
  useEffect(() => {
    async function fetchInterests() {
      try {
        const res = await interestApi.getInterests();
        if (res?.success && res.data) {
          setAvailableInterests(res.data);
          setInterestCategories(res.categories || ['All']);
        }
      } catch {
        // Fallback gracefully to default catalog
      }
    }
    fetchInterests();
  }, []);

  // Fetch student ID verification status if any
  useEffect(() => {
    async function checkIdStatus() {
      try {
        const res = await verificationApi.getStatus();
        if (res?.success && res.data) {
          setFormData((prev) => ({
            ...prev,
            studentIdStatus: res.data.studentIdStatus || 'NONE',
            studentIdUploaded: res.data.studentIdStatus !== 'NONE',
          }));
        }
      } catch {
        // Continue with current state
      }
    }
    checkIdStatus();
  }, []);

  // Sync profile data when context changes
  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        bio: profile.bio || prev.bio,
        program: profile.program || prev.program,
        year: profile.year || prev.year,
        photos: profile.photos?.length ? profile.photos : prev.photos,
        interests: profile.interests?.length ? profile.interests : prev.interests,
        lookingFor: profile.lookingFor?.length ? profile.lookingFor : prev.lookingFor,
        languages: profile.languages?.length ? profile.languages : prev.languages,
        lifestyle: profile.lifestyle ? { ...prev.lifestyle, ...profile.lifestyle } : prev.lifestyle,
        personality: profile.personality?.length ? profile.personality : prev.personality,
        story: profile.story ? { ...prev.story, ...profile.story } : prev.story,
      }));
    }
  }, [profile]);

  // Autosave to backend helper
  const saveProgressToBackend = async (nextStepNumber, extraData = {}) => {
    try {
      setSaving(true);
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        pronouns: formData.pronouns,
        city: formData.city,
        division: formData.division,
        bio: formData.bio || formData.story.aboutMe,
        program: formData.program,
        department: formData.department,
        year: formData.year,
        interests: formData.interests,
        preferredFields: formData.preferredFields,
        languages: formData.languages,
        lookingFor: formData.lookingFor,
        lookingForGender: formData.lookingForGender,
        lifestyle: formData.lifestyle,
        personality: formData.personality,
        vibeHeadline: formData.vibeHeadline,
        story: formData.story,
        discoveryAudience: formData.discoveryAudience,
        showInCategories: formData.showInCategories,
        privacySettings: formData.privacySettings,
        onboardingStep: nextStepNumber,
        isOnboarded: nextStepNumber > TOTAL_STEPS,
        ...extraData,
      };

      const res = await profileApi.updateProfile(payload);
      if (res?.success && res.data) {
        updateCurrentProfile(res.data);
      }
    } catch {
      // Background save failure shouldn't block user
    } finally {
      setSaving(false);
    }
  };

  // Step Navigation Handlers
  const handleNext = async () => {
    // Step-specific validations
    if (currentStep === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        showToast('Please provide your first and last name', 'warning');
        return;
      }
      if (!formData.program.trim()) {
        showToast('Please select your degree/program', 'warning');
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.lookingFor.length) {
        showToast('Select at least one campus connection goal', 'warning');
        return;
      }
    }

    if (currentStep === 5) {
      if (formData.interests.length < 3) {
        showToast('Please pick at least 3 interests to match your vibe', 'warning');
        return;
      }
    }

    if (currentStep === 11) {
      if (formData.photos.length === 0) {
        showToast('Upload at least 1 profile cover photo to continue', 'warning');
        return;
      }
    }

    const nextStep = currentStep + 1;
    setDirection('forward');
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (nextStep === 13) {
      // Final Celebration Step! Fire Confetti!
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#ec4899', '#a855f7', '#3b82f6', '#10b981'],
        });
      } catch {
        // Confetti effect
      }
      await saveProgressToBackend(13, { isOnboarded: true });
    } else {
      await saveProgressToBackend(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('backward');
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ============================================================================
  // Step 1: ID Card Upload Handler
  // ============================================================================
  const handleIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please upload a JPG, PNG, or WebP student ID card', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size must be under 5MB', 'error');
      return;
    }

    try {
      setIdUploading(true);
      const fd = new FormData();
      fd.append('idCard', file);

      const res = await verificationApi.uploadStudentId(fd);
      if (res?.success) {
        setFormData((prev) => ({
          ...prev,
          studentIdFile: file,
          studentIdPreview: URL.createObjectURL(file),
          studentIdStatus: 'PENDING',
          studentIdUploaded: true,
        }));
        showToast('Student ID submitted! Campus moderation will review your card. 🪪', 'success');
        refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'ID upload failed. Please try again.', 'error');
    } finally {
      setIdUploading(false);
    }
  };

  // ============================================================================
  // Step 5: Interests Handlers
  // ============================================================================
  const toggleInterest = (item) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(item);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((i) => i !== item) };
      } else {
        if (prev.interests.length >= 20) {
          showToast('You can select up to 20 interests max', 'info');
          return prev;
        }
        return { ...prev, interests: [...prev.interests, item] };
      }
    });
  };

  const handleAddCustomInterest = async (e) => {
    e.preventDefault();
    if (!customInterestInput.trim()) return;

    const trimmed = customInterestInput.trim();
    if (formData.interests.includes(trimmed)) {
      showToast('Interest already selected', 'info');
      setCustomInterestInput('');
      return;
    }

    try {
      await interestApi.addCustomInterest({ name: trimmed, category: 'Other', emoji: '✨' });
    } catch {
      // Ignore if exists
    }

    setFormData((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
    setCustomInterestInput('');
    showToast(`Added custom interest: "${trimmed}" ✨`, 'success');
  };

  // ============================================================================
  // Step 6: Academic Field Handlers
  // ============================================================================
  const toggleField = (field) => {
    setFormData((prev) => {
      const exists = prev.preferredFields.includes(field);
      if (exists) {
        return { ...prev, preferredFields: prev.preferredFields.filter((f) => f !== field) };
      } else {
        return { ...prev, preferredFields: [...prev.preferredFields, field] };
      }
    });
  };

  const handleAddCustomField = (e) => {
    e.preventDefault();
    if (!customFieldInput.trim()) return;
    const f = customFieldInput.trim();
    if (!formData.preferredFields.includes(f)) {
      setFormData((prev) => ({ ...prev, preferredFields: [...prev.preferredFields, f] }));
    }
    setCustomFieldInput('');
  };

  // ============================================================================
  // Step 7: Language Handlers
  // ============================================================================
  const toggleLanguage = (langName) => {
    setFormData((prev) => {
      const index = prev.languages.findIndex((l) => l.language.toLowerCase() === langName.toLowerCase());
      if (index >= 0) {
        return { ...prev, languages: prev.languages.filter((_, i) => i !== index) };
      } else {
        return {
          ...prev,
          languages: [...prev.languages, { language: langName, proficiency: 'Fluent' }],
        };
      }
    });
  };

  const updateProficiency = (langName, proficiency) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.map((l) =>
        l.language.toLowerCase() === langName.toLowerCase() ? { ...l, proficiency } : l
      ),
    }));
  };

  const handleAddCustomLang = (e) => {
    e.preventDefault();
    if (!customLangInput.trim()) return;
    const l = customLangInput.trim();
    if (!formData.languages.some((x) => x.language.toLowerCase() === l.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, { language: l, proficiency: 'Fluent' }],
      }));
    }
    setCustomLangInput('');
  };

  // ============================================================================
  // Step 11: 6-Photo Gallery Handlers
  // ============================================================================
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Only JPEG, PNG, and WebP photos are permitted', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo size must be under 5MB', 'error');
      return;
    }

    try {
      setUploadingPhotoIndex(activePhotoSlot);
      const fd = new FormData();
      fd.append('photo', file);

      const res = await profileApi.uploadPhoto(fd);
      if (res?.success && res.data) {
        setFormData((prev) => ({ ...prev, photos: res.data.photos }));
        showToast('Photo uploaded successfully! 📸', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Photo upload failed', 'error');
    } finally {
      setUploadingPhotoIndex(null);
      setActivePhotoSlot(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    try {
      const res = await profileApi.deletePhoto(photoUrl);
      if (res?.success && res.data) {
        setFormData((prev) => ({ ...prev, photos: res.data.photos }));
        showToast('Photo removed', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Could not delete photo', 'error');
    }
  };

  const handleMakeCoverPhoto = async (index) => {
    if (index === 0) return;
    const reordered = [...formData.photos];
    const [selected] = reordered.splice(index, 1);
    reordered.unshift(selected);

    try {
      const res = await profileApi.reorderPhotos(reordered);
      if (res?.success) {
        setFormData((prev) => ({ ...prev, photos: reordered }));
        showToast('Primary cover photo updated ✨', 'success');
      }
    } catch {
      // Revert if error
    }
  };

  return (
    <div className="onboarding-page-container">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={idInputRef}
        onChange={handleIdUpload}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
      />

      <div className="onboarding-main-card">
        {/* Onboarding Header & Multi-Step Progress Tracker */}
        {currentStep <= TOTAL_STEPS && (
          <div className="onboarding-stepper-header">
            <div className="stepper-top-row">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || saving}
                className={`stepper-back-btn ${currentStep === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                title="Go to previous step"
              >
                <ChevronLeft size={20} /> Back
              </button>

              <div className="stepper-counter-pill">
                <span>Step {currentStep} of {TOTAL_STEPS}</span>
                <span className="stepper-percentage">
                  {Math.round((currentStep / TOTAL_STEPS) * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="stepper-next-btn"
              >
                {currentStep === TOTAL_STEPS ? 'Finish' : 'Continue'} <ChevronRight size={18} />
              </button>
            </div>

            {/* Visual Animated Progress Track */}
            <div className="stepper-track-bg">
              <div
                className="stepper-track-fill"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Dynamic Multi-Step Body */}
        <div className={`onboarding-step-body ${direction === 'forward' ? 'anim-slide-in-right' : 'anim-slide-in-left'}`}>

          {/* ================================================================ */}
          {/* STEP 1: REAL STUDENT VERIFICATION */}
          {/* ================================================================ */}
          {currentStep === 1 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">🎓</div>
              <h1 className="step-main-title">Let&apos;s verify you&apos;re really part of the campus 🎓</h1>
              <p className="step-main-subtitle">
                CampusMitra is built exclusively for students. Verify your student identity to unlock the full campus experience.
              </p>

              {/* Verified Domain Confirmation Pill */}
              <div className="verification-status-banner verified-email">
                <ShieldCheck size={20} className="text-emerald-400" />
                <div className="banner-text">
                  <span className="banner-title">University Mailbox Confirmed:</span>
                  <span className="banner-sub">{user?.email || 'student@mitwpu.edu.in'}</span>
                </div>
                <span className="badge badge-success text-xs">✓ Domain Verified</span>
              </div>

              {/* Upload MIT-WPU Student ID Card */}
              <div className="id-card-upload-section">
                <div className="id-card-label">UPLOAD MIT-WPU STUDENT ID</div>

                <div
                  className={`id-upload-dropzone ${formData.studentIdPreview || formData.studentIdUploaded ? 'has-preview' : ''}`}
                  onClick={() => idInputRef.current?.click()}
                >
                  {formData.studentIdPreview ? (
                    <div className="id-preview-box">
                      <img
                        src={formData.studentIdPreview}
                        alt="Student ID Preview"
                        className="id-preview-img"
                      />
                      <div className="id-overlay-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-glass btn-sm"
                          onClick={() => idInputRef.current?.click()}
                        >
                          <Camera size={14} /> Replace
                        </button>
                        <button
                          type="button"
                          className="btn-glass btn-sm text-rose-400"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              studentIdFile: null,
                              studentIdPreview: null,
                            }))
                          }
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  ) : formData.studentIdUploaded ? (
                    <div className="id-upload-placeholder uploaded-done">
                      <div className="id-emoji-icon">🪪</div>
                      <h3>Student ID Uploaded ✓</h3>
                      <p className="text-muted text-sm">
                        Current Status:{' '}
                        <strong className="text-amber-400">
                          {formData.studentIdStatus === 'APPROVED' ? 'Approved' : 'Pending Campus Moderation Review'}
                        </strong>
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm mt-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          idInputRef.current?.click();
                        }}
                      >
                        Upload Replacement Card
                      </button>
                    </div>
                  ) : (
                    <div className="id-upload-placeholder">
                      <div className="id-emoji-icon">🪪</div>
                      <h3>Upload Student ID</h3>
                      <p className="text-muted text-sm">JPG / PNG / WEBP up to 5MB</p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm mt-3"
                        disabled={idUploading}
                      >
                        <Upload size={16} /> {idUploading ? 'Uploading...' : 'Choose File'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Privacy & Safety Guarantee */}
                <div className="privacy-callout-card">
                  <Lock size={18} className="text-primary" />
                  <div className="callout-content">
                    <h4>Strict Privacy Protection</h4>
                    <p>
                      Student ID images are stored privately in encrypted campus storage. They are
                      <strong> NEVER shown on your public profile</strong> and can only be reviewed by
                      authorized campus verification administrators.
                    </p>
                  </div>
                </div>

                <div className="disclaimer-microtext">
                  CampusMitra is an independent student project and is not an official MIT-WPU service.
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 2: ABOUT YOU */}
          {/* ================================================================ */}
          {currentStep === 2 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">💫</div>
              <h1 className="step-main-title">Tell us about you 💫</h1>
              <p className="step-main-subtitle">
                Set up the basics so classmates can recognize you around campus.
              </p>

              <div className="onboarding-form-grid">
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.firstName}
                      onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="e.g. Aarav"
                      required
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.lastName}
                      onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="e.g. Joshi"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-control"
                      value={formData.gender}
                      onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">Pronouns (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.pronouns}
                      onChange={(e) => setFormData((p) => ({ ...p, pronouns: e.target.value }))}
                      placeholder="e.g. she/her, he/him, they/them"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Degree / Program *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.program}
                      onChange={(e) => setFormData((p) => ({ ...p, program: e.target.value }))}
                      placeholder="e.g. MCA, B.Tech CSE, B.Des, MBA"
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
                      <option value="1st Year">1st Year (Freshman)</option>
                      <option value="2nd Year">2nd Year (Sophomore)</option>
                      <option value="3rd Year">3rd Year (Junior)</option>
                      <option value="4th Year">4th Year (Senior)</option>
                      <option value="Postgraduate">Postgraduate / Masters</option>
                      <option value="PhD / Research">PhD / Research Scholar</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Current City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.city}
                      onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. Pune, Mumbai, Delhi"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">Division / Batch (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.division}
                      onChange={(e) => setFormData((p) => ({ ...p, division: e.target.value }))}
                      placeholder="e.g. Div A, Batch 2"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Short Campus Bio</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={formData.bio}
                    onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell campus peers what you love, what you're building, or what coffee spot you like..."
                    maxLength={300}
                  />
                  <div className="text-right text-xs text-muted mt-1">
                    {formData.bio.length} / 300 characters
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 3: WHAT ARE YOU LOOKING FOR? */}
          {/* ================================================================ */}
          {currentStep === 3 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">💜</div>
              <h1 className="step-main-title">What brings you here? 💜</h1>
              <p className="step-main-subtitle">
                Select everything you&apos;re open to exploring on campus. You can pick multiple!
              </p>

              <div className="cards-selection-grid">
                {LOOKING_FOR_OPTIONS.map((opt) => {
                  const isSelected = formData.lookingFor.includes(opt.id);
                  const isDatingDisabled = opt.requiresAdult && !isAdult;

                  return (
                    <div
                      key={opt.id}
                      className={`selection-card ${isSelected ? 'selected' : ''} ${isDatingDisabled ? 'disabled-card' : ''}`}
                      onClick={() => {
                        if (isDatingDisabled) {
                          showToast('Dating is available only for verified adults 18+.', 'warning');
                          return;
                        }
                        setFormData((prev) => {
                          const exists = prev.lookingFor.includes(opt.id);
                          return {
                            ...prev,
                            lookingFor: exists
                              ? prev.lookingFor.filter((g) => g !== opt.id)
                              : [...prev.lookingFor, opt.id],
                          };
                        });
                      }}
                    >
                      <div className="card-top-row">
                        <span className="card-icon">{opt.icon}</span>
                        {isSelected && (
                          <span className="card-check-pill">
                            <Check size={14} />
                          </span>
                        )}
                      </div>
                      <h3 className="card-title">{opt.label}</h3>
                      <p className="card-desc">{opt.desc}</p>
                      {isDatingDisabled && (
                        <div className="card-restriction-badge">
                          <Lock size={12} /> 18+ Only
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 4: WHO WOULD YOU LIKE TO MEET? */}
          {/* ================================================================ */}
          {currentStep === 4 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">🌈</div>
              <h1 className="step-main-title">Who would you like to meet? 🌈</h1>
              <p className="step-main-subtitle">
                Customize your social radar on campus. You can update this anytime.
              </p>

              <div className="cards-selection-grid max-w-xl mx-auto">
                {GENDER_MEET_OPTIONS.map((opt) => {
                  const isSelected = formData.lookingForGender === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`selection-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setFormData((p) => ({ ...p, lookingForGender: opt.id }))}
                    >
                      <div className="card-top-row">
                        <span className="card-icon">{opt.emoji}</span>
                        {isSelected && (
                          <span className="card-check-pill">
                            <Check size={14} />
                          </span>
                        )}
                      </div>
                      <h3 className="card-title">{opt.label}</h3>
                      <p className="card-desc">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="privacy-callout-card max-w-xl mx-auto mt-6">
                <Lock size={18} className="text-primary" />
                <div className="callout-content">
                  <p className="text-xs text-muted">
                    Your personal matching orientation is strictly private and never published publicly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 5: INTERESTS (RICH SEARCHABLE CHIPS) */}
          {/* ================================================================ */}
          {currentStep === 5 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">✨</div>
              <h1 className="step-main-title">What are you into? ✨</h1>
              <p className="step-main-subtitle">Pick the things that make you YOU.</p>

              {/* Selection Counter & Progress Badge */}
              <div className="interests-status-bar">
                <span className="counter-pill">
                  {formData.interests.length} / 20 selected
                  {formData.interests.length >= 3 ? ' (Great vibe!)' : ' (Min 3 required)'}
                </span>
                <span className="text-xs text-muted">Tap to select or remove</span>
              </div>

              {/* Search Bar & Custom Tag Adder */}
              <div className="interests-search-row">
                <div className="input-with-icon flex-1">
                  <Search size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search all campus interests (e.g. Anime, Coding, Valorant)..."
                    value={interestSearch}
                    onChange={(e) => setInterestSearch(e.target.value)}
                  />
                </div>

                <form onSubmit={handleAddCustomInterest} className="custom-interest-form">
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="+ Add your own..."
                    value={customInterestInput}
                    onChange={(e) => setCustomInterestInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Plus size={16} />
                  </button>
                </form>
              </div>

              {/* Category Pills Slider */}
              <div className="interest-category-pills">
                {interestCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`cat-pill ${selectedInterestCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedInterestCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Selected Interests Strip */}
              {formData.interests.length > 0 && (
                <div className="selected-chips-shelf">
                  <span className="shelf-label">Selected:</span>
                  <div className="chips-flex-wrap">
                    {formData.interests.map((item) => (
                      <span
                        key={item}
                        className="chip-tag active"
                        onClick={() => toggleInterest(item)}
                        title="Click to remove"
                      >
                        {item} <X size={14} className="ml-1" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests Library Grid */}
              <div className="interests-catalog-grid">
                {availableInterests
                  .filter((item) => {
                    const matchesCategory =
                      selectedInterestCategory === 'All' ||
                      item.category?.toLowerCase() === selectedInterestCategory.toLowerCase();
                    const matchesSearch =
                      !interestSearch ||
                      item.name.toLowerCase().includes(interestSearch.toLowerCase()) ||
                      item.category?.toLowerCase().includes(interestSearch.toLowerCase());
                    return matchesCategory && matchesSearch;
                  })
                  .slice(0, 60)
                  .map((item) => {
                    const isSelected = formData.interests.includes(item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        className={`interest-card-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleInterest(item.name)}
                      >
                        <span className="chip-emoji">{item.emoji || '✨'}</span>
                        <span className="chip-name">{item.name}</span>
                        {isSelected && <Check size={14} className="chip-check" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 6: WHAT DO YOU STUDY / WANT TO MEET? */}
          {/* ================================================================ */}
          {currentStep === 6 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">🎓</div>
              <h1 className="step-main-title">What kind of people would you like to meet? 🎓</h1>
              <p className="step-main-subtitle">
                Select academic domains and project fields you&apos;d love to connect with around campus.
              </p>

              {/* Search & Custom Field Row */}
              <div className="interests-search-row">
                <div className="input-with-icon flex-1">
                  <Search size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search academic fields (e.g. UI/UX, AI, Law)..."
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                  />
                </div>

                <form onSubmit={handleAddCustomField} className="custom-interest-form">
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="+ Add custom field..."
                    value={customFieldInput}
                    onChange={(e) => setCustomFieldInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Plus size={16} />
                  </button>
                </form>
              </div>

              {/* Academic Chips Grid */}
              <div className="chips-flex-wrap mt-4">
                {ACADEMIC_FIELDS.filter((f) =>
                  !fieldSearch || f.toLowerCase().includes(fieldSearch.toLowerCase())
                ).map((field) => {
                  const isSelected = formData.preferredFields.includes(field);
                  return (
                    <button
                      key={field}
                      type="button"
                      className={`chip-tag ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleField(field)}
                    >
                      {field}
                      {isSelected ? <Check size={14} className="ml-1" /> : <Plus size={14} className="ml-1 text-muted" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 7: LANGUAGES */}
          {/* ================================================================ */}
          {currentStep === 7 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">🌍</div>
              <h1 className="step-main-title">What languages do you speak? 🌍</h1>
              <p className="step-main-subtitle">
                Add the languages you feel comfortable chatting or collaborating in.
              </p>

              {/* Language Search & Custom Lang Input */}
              <div className="interests-search-row">
                <div className="input-with-icon flex-1">
                  <Search size={18} className="input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search languages (e.g. Marathi, Hindi, English, German)..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                  />
                </div>

                <form onSubmit={handleAddCustomLang} className="custom-interest-form">
                  <input
                    type="text"
                    className="form-control custom-input"
                    placeholder="+ Add custom language..."
                    value={customLangInput}
                    onChange={(e) => setCustomLangInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    <Plus size={16} />
                  </button>
                </form>
              </div>

              {/* Selected Languages with Proficiency Sliders */}
              <div className="selected-languages-stack">
                <h4 className="text-sm font-semibold text-muted mb-2">Selected Languages & Proficiency:</h4>
                {formData.languages.map((l) => (
                  <div key={l.language} className="language-proficiency-row">
                    <div className="lang-info">
                      <span className="lang-name font-medium">{l.language}</span>
                    </div>

                    <div className="proficiency-selector">
                      {['Basic', 'Intermediate', 'Fluent', 'Native'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          className={`level-btn ${l.proficiency === level ? 'active' : ''}`}
                          onClick={() => updateProficiency(l.language, level)}
                        >
                          {level}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn-icon-danger ml-2"
                      onClick={() => toggleLanguage(l.language)}
                      title="Remove language"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Available Languages Grid */}
              <div className="available-langs-shelf mt-4">
                <h4 className="text-sm font-semibold text-muted mb-2">Add more languages:</h4>
                <div className="chips-flex-wrap">
                  {LANGUAGES_CATALOG.filter((l) =>
                    !langSearch || l.name.toLowerCase().includes(langSearch.toLowerCase())
                  ).map((l) => {
                    const isSelected = formData.languages.some(
                      (x) => x.language.toLowerCase() === l.name.toLowerCase()
                    );
                    return (
                      <button
                        key={l.name}
                        type="button"
                        className={`chip-tag ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleLanguage(l.name)}
                      >
                        <span className="mr-1">{l.flag}</span>
                        {l.name}
                        {isSelected ? <Check size={14} className="ml-1" /> : <Plus size={14} className="ml-1 text-muted" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 8: LIFESTYLE */}
          {/* ================================================================ */}
          {currentStep === 8 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">🌱</div>
              <h1 className="step-main-title">Your lifestyle 🌱</h1>
              <p className="step-main-subtitle">
                Share your daily campus rhythm. These are completely optional and privacy-controlled.
              </p>

              <div className="lifestyle-cards-grid">
                {/* Food Preference */}
                <div className="lifestyle-group-card">
                  <label className="group-label">🥗 Food Preference</label>
                  <div className="option-pills-row">
                    {['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian', 'Other', 'Prefer not to say'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`lifestyle-pill ${formData.lifestyle.foodPreference === item ? 'selected' : ''}`}
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            lifestyle: { ...p.lifestyle, foodPreference: item },
                          }))
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sleep Schedule */}
                <div className="lifestyle-group-card">
                  <label className="group-label">🌙 Sleep Schedule</label>
                  <div className="option-pills-row">
                    {['Early bird', 'Night owl', 'Flexible', 'Prefer not to say'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`lifestyle-pill ${formData.lifestyle.sleepSchedule === item ? 'selected' : ''}`}
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            lifestyle: { ...p.lifestyle, sleepSchedule: item },
                          }))
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fitness Routine */}
                <div className="lifestyle-group-card">
                  <label className="group-label">🏋️ Fitness Routine</label>
                  <div className="option-pills-row">
                    {['Gym', 'Running', 'Sports', 'Yoga', 'Walking', 'Casual', 'Not interested'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`lifestyle-pill ${formData.lifestyle.fitness === item ? 'selected' : ''}`}
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            lifestyle: { ...p.lifestyle, fitness: item },
                          }))
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pets */}
                <div className="lifestyle-group-card">
                  <label className="group-label">🐾 Pets</label>
                  <div className="option-pills-row">
                    {['Love pets', 'Like pets', 'No preference', 'Not comfortable', 'Prefer not to say'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`lifestyle-pill ${formData.lifestyle.pets === item ? 'selected' : ''}`}
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            lifestyle: { ...p.lifestyle, pets: item },
                          }))
                        }
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drinking & Smoking */}
                <div className="lifestyle-group-card">
                  <label className="group-label">☕ Social Habits (Drinking & Smoking)</label>
                  <div className="form-row mt-2">
                    <div className="flex-1">
                      <span className="text-xs text-muted block mb-1">Drinking:</span>
                      <select
                        className="form-control"
                        value={formData.lifestyle.drinking}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            lifestyle: { ...p.lifestyle, drinking: e.target.value },
                          }))
                        }
                      >
                        <option value="Never">Never</option>
                        <option value="Occasionally">Occasionally</option>
                        <option value="Socially">Socially</option>
                        <option value="Frequently">Frequently</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <span className="text-xs text-muted block mb-1">Smoking:</span>
                      <select
                        className="form-control"
                        value={formData.lifestyle.smoking}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            lifestyle: { ...p.lifestyle, smoking: e.target.value },
                          }))
                        }
                      >
                        <option value="Never">Never</option>
                        <option value="Occasionally">Occasionally</option>
                        <option value="Socially">Socially</option>
                        <option value="Frequently">Frequently</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 9: PERSONALITY & VIBE */}
          {/* ================================================================ */}
          {currentStep === 9 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">🌈</div>
              <h1 className="step-main-title">What&apos;s your vibe? 🌈</h1>
              <p className="step-main-subtitle">
                Pick up to 5 traits that capture your campus personality.
              </p>

              {/* Vibe Headline Field */}
              <div className="vibe-headline-box mb-6">
                <label className="form-label font-semibold">Describe yourself in a few words ✨</label>
                <input
                  type="text"
                  className="form-control font-medium"
                  placeholder="e.g. Coffee + coding + cricket ☕💻🏏"
                  value={formData.vibeHeadline}
                  onChange={(e) => setFormData((p) => ({ ...p, vibeHeadline: e.target.value }))}
                  maxLength={120}
                />
                <span className="text-xs text-muted mt-1 block">
                  A catchy punchline shown on your discovery card.
                </span>
              </div>

              {/* Personality Cards Grid */}
              <div className="personality-selection-grid">
                {PERSONALITY_OPTIONS.map((trait) => {
                  const isSelected = formData.personality.includes(trait.id);
                  return (
                    <div
                      key={trait.id}
                      className={`personality-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData((prev) => {
                          const exists = prev.personality.includes(trait.id);
                          if (exists) {
                            return { ...prev, personality: prev.personality.filter((p) => p !== trait.id) };
                          } else {
                            if (prev.personality.length >= 6) {
                              showToast('Pick up to 6 personality vibes max', 'info');
                              return prev;
                            }
                            return { ...prev, personality: [...prev.personality, trait.id] };
                          }
                        });
                      }}
                    >
                      <span className="trait-icon">{trait.icon}</span>
                      <h4 className="trait-title">{trait.id}</h4>
                      <p className="trait-desc">{trait.desc}</p>
                      {isSelected && <Check size={14} className="trait-check" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 10: YOUR STORY (PROMPTS & TEXT AREAS) */}
          {/* ================================================================ */}
          {currentStep === 10 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">✍️</div>
              <h1 className="step-main-title">Tell people about you ✍️</h1>
              <p className="step-main-subtitle">
                Answer a few lighthearted prompts to make your profile stand out.
              </p>

              <div className="prompts-stack">
                <div className="prompt-card">
                  <label className="prompt-label">About me</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="A quick summary of who you are and what you care about..."
                    value={formData.story.aboutMe}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        story: { ...p.story, aboutMe: e.target.value },
                      }))
                    }
                    maxLength={300}
                  />
                  <div className="char-count">{formData.story.aboutMe.length} / 300</div>
                </div>

                <div className="prompt-card">
                  <label className="prompt-label">Something I&apos;m passionate about</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="e.g. Building open source AI tools, Indie game dev, or classical Bharatnatyam..."
                    value={formData.story.passionateAbout}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        story: { ...p.story, passionateAbout: e.target.value },
                      }))
                    }
                    maxLength={200}
                  />
                  <div className="char-count">{formData.story.passionateAbout.length} / 200</div>
                </div>

                <div className="prompt-card">
                  <label className="prompt-label">My perfect weekend</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="e.g. Trekking up Sinhagad Fort, then iced coffee with friends at FC Road..."
                    value={formData.story.perfectWeekend}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        story: { ...p.story, perfectWeekend: e.target.value },
                      }))
                    }
                    maxLength={200}
                  />
                  <div className="char-count">{formData.story.perfectWeekend.length} / 200</div>
                </div>

                <div className="prompt-card">
                  <label className="prompt-label">One random fact about me</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="e.g. I have memorized the entire script of 3 Idiots..."
                    value={formData.story.randomFact}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        story: { ...p.story, randomFact: e.target.value },
                      }))
                    }
                    maxLength={150}
                  />
                  <div className="char-count">{formData.story.randomFact.length} / 150</div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 11: PHOTOS (6-PHOTO GALLERY) */}
          {/* ================================================================ */}
          {currentStep === 11 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">📸</div>
              <h1 className="step-main-title">Show your world 📸</h1>
              <p className="step-main-subtitle">
                Upload up to 6 photos. Your first photo is your primary profile cover.
              </p>

              <div className="photo-slots-status">
                <span className="counter-pill">{formData.photos.length} / 6 photos uploaded</span>
                <span className="text-xs text-muted">Tap on photo to set as cover</span>
              </div>

              {/* 6 Photo Slots Grid */}
              <div className="six-photos-grid">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const photoUrl = formData.photos[index];
                  const isCover = index === 0 && Boolean(photoUrl);

                  return (
                    <div
                      key={index}
                      className={`photo-slot-card ${photoUrl ? 'has-image' : 'empty'} ${isCover ? 'is-cover' : ''}`}
                      onClick={() => {
                        if (!photoUrl) {
                          setActivePhotoSlot(index);
                          fileInputRef.current?.click();
                        }
                      }}
                    >
                      {photoUrl ? (
                        <div className="photo-wrapper">
                          <img
                            src={photoUrl.startsWith('/') ? photoUrl : photoUrl}
                            alt={`Profile ${index + 1}`}
                            className="slot-img"
                          />
                          {isCover && <span className="cover-badge">★ Profile Cover</span>}

                          <div className="photo-hover-overlay">
                            {!isCover && (
                              <button
                                type="button"
                                className="overlay-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMakeCoverPhoto(index);
                                }}
                                title="Make Primary Cover"
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
                              title="Delete Photo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="slot-empty-content">
                          <div className="slot-plus-icon">
                            {uploadingPhotoIndex === index ? (
                              <div className="spinner-border" />
                            ) : (
                              <Camera size={24} />
                            )}
                          </div>
                          <span className="slot-number">Photo {index + 1}</span>
                          {index === 0 && <span className="slot-primary-hint">Primary</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="privacy-callout-card mt-6">
                <Sparkles size={18} className="text-amber-400" />
                <div className="callout-content">
                  <p className="text-xs text-muted">
                    Profiles with clear smiling faces and campus activity photos get 3x more peer connections!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 12: MATCHING PREFERENCES & PRIVACY */}
          {/* ================================================================ */}
          {currentStep === 12 && (
            <div className="onboarding-step-panel">
              <div className="step-badge-icon">🛡️</div>
              <h1 className="step-main-title">Make CampusMitra work for you 💜</h1>
              <p className="step-main-subtitle">
                Control who can discover you and what information is visible on your profile card.
              </p>

              <div className="privacy-settings-stack">
                {/* Discovery Audience */}
                <div className="privacy-card">
                  <h3 className="setting-title font-semibold mb-2">Who can discover me?</h3>
                  <div className="option-pills-row">
                    {[
                      { id: 'everyone', label: 'Everyone eligible' },
                      { id: 'matching', label: 'Matching my vibe' },
                      { id: 'friends_only', label: 'Friends only' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`lifestyle-pill ${formData.discoveryAudience === opt.id ? 'selected' : ''}`}
                        onClick={() => setFormData((p) => ({ ...p, discoveryAudience: opt.id }))}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Show In Categories */}
                <div className="privacy-card">
                  <h3 className="setting-title font-semibold mb-2">Show me in:</h3>
                  <div className="chips-flex-wrap">
                    {['Friends', 'Study', 'Activities', ...(isAdult ? ['Dating'] : [])].map((cat) => {
                      const isSelected = formData.showInCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          className={`chip-tag ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setFormData((prev) => {
                              const exists = prev.showInCategories.includes(cat);
                              return {
                                ...prev,
                                showInCategories: exists
                                  ? prev.showInCategories.filter((c) => c !== cat)
                                  : [...prev.showInCategories, cat],
                              };
                            });
                          }}
                        >
                          {cat} {isSelected && <Check size={14} className="ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Granular Visibility Toggles */}
                <div className="privacy-card">
                  <h3 className="setting-title font-semibold mb-3">Profile Card Privacy Controls:</h3>
                  <div className="toggles-list">
                    <label className="toggle-row">
                      <span>Show my calculated age</span>
                      <input
                        type="checkbox"
                        checked={formData.privacySettings.showAge}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            privacySettings: { ...p.privacySettings, showAge: e.target.checked },
                          }))
                        }
                      />
                    </label>

                    <label className="toggle-row">
                      <span>Show degree & program name</span>
                      <input
                        type="checkbox"
                        checked={formData.privacySettings.showProgram}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            privacySettings: { ...p.privacySettings, showProgram: e.target.checked },
                          }))
                        }
                      />
                    </label>

                    <label className="toggle-row">
                      <span>Show lifestyle tags (food & habits)</span>
                      <input
                        type="checkbox"
                        checked={formData.privacySettings.showLifestyle}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            privacySettings: { ...p.privacySettings, showLifestyle: e.target.checked },
                          }))
                        }
                      />
                    </label>

                    <label className="toggle-row">
                      <span>Show languages spoken</span>
                      <input
                        type="checkbox"
                        checked={formData.privacySettings.showLanguages}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            privacySettings: { ...p.privacySettings, showLanguages: e.target.checked },
                          }))
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* FINAL STEP 13: CELEBRATION / PROFILE READY */}
          {/* ================================================================ */}
          {currentStep === 13 && (
            <div className="onboarding-completion-panel anim-zoom-in">
              <div className="celebration-sparkle-ring">
                <Sparkles size={56} className="text-amber-300 anim-pulse" />
              </div>

              <h1 className="completion-title">
                ✨ You&apos;re all set, {formData.firstName || user?.firstName}!
              </h1>
              <p className="completion-subtitle">
                Your CampusMitra profile is ready. Your campus community is waiting for you.
              </p>

              {/* 100% Completion Bar */}
              <div className="completion-meter-card">
                <div className="meter-label-row">
                  <span className="font-semibold text-white">Profile Completion</span>
                  <span className="font-bold text-emerald-400">100% Complete ✨</span>
                </div>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Ready Profile Summary Preview */}
              <div className="profile-mini-preview-card">
                <img
                  src={formData.photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt="Profile"
                  className="mini-preview-avatar"
                />
                <div className="mini-preview-info">
                  <h3 className="mini-name">
                    {formData.firstName} {formData.lastName}
                    {user?.isVerified && <span className="verified-badge-inline">✓ Verified</span>}
                  </h3>
                  <p className="mini-sub">{formData.program} • {formData.year}</p>
                  <p className="mini-headline">
                    {formData.vibeHeadline || 'Ready to connect on campus!'}
                  </p>
                </div>
              </div>

              {/* Animated CTA */}
              <button
                type="button"
                className="btn btn-primary btn-lg enter-campus-btn mt-6"
                onClick={() => navigate('/discover')}
              >
                <span>Enter CampusMitra ✨</span>
                <ArrowRight size={20} />
              </button>
            </div>
          )}

        </div>

        {/* Bottom Persistent Action Bar */}
        {currentStep <= TOTAL_STEPS && (
          <div className="onboarding-bottom-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleBack}
              disabled={currentStep === 1 || saving}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <button
              type="button"
              className="btn btn-primary btn-continue-main"
              onClick={handleNext}
              disabled={saving}
            >
              {saving ? 'Saving...' : currentStep === TOTAL_STEPS ? 'Complete Profile ✨' : 'Continue'}
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
