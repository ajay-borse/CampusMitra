import { useState } from 'react';
import { fireConfetti } from '../utils/confetti';
import { ALL_INTERESTS } from '../data/mockData';

/**
 * OnboardingModal Component
 * Multi-step interactive campus onboarding journey:
 * Step 1: University & Program verification
 * Step 2: Selecting campus vibe interests
 * Step 3: Profile picture preview
 * Step 4: Celebratory Welcome Animation with confetti ("Welcome to CampusMitra, Ajay!")
 */
export default function OnboardingModal({ isOpen, onClose, userName = 'Ajay' }) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [interests, setInterests] = useState(['💻 Coding', '🎵 Music', '☕ Coffee']);
  const [selectedProgram, setSelectedProgram] = useState('MCA (Computer Applications)');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 3) {
      setStep(4);
      fireConfetti(3000);
    } else if (step < 4) {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleToggle = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="onboarding-overlay animate-fade-in" role="dialog" aria-modal="true">
      <div className="onboarding-modal-card animate-zoom-in">
        {/* Progress Bar Header */}
        <div className="onboarding-header">
          <div className="onboarding-steps-label">
            <span>🎓 CampusMitra Onboarding Tour</span>
            <span className="step-counter">
              Step {step} of {totalSteps}
            </span>
          </div>

          <div className="onboarding-progress-track">
            <div
              className="onboarding-progress-fill"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="onboarding-body">
          {step === 1 && (
            <div className="step-content animate-slide-right">
              <span className="step-icon">🏛️</span>
              <h2 className="step-title">Welcome to MIT-WPU Network</h2>
              <p className="step-desc">
                Confirm your student details to ensure safe, verified peer networking.
              </p>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label className="form-label">Select Degree & Department</label>
                <select
                  className="form-input"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                >
                  <option>MCA (Computer Applications)</option>
                  <option>B.Tech Computer Science & Engineering</option>
                  <option>B.Tech Artificial Intelligence</option>
                  <option>B.Des User Experience</option>
                  <option>MBA Technology Management</option>
                </select>
              </div>

              <div className="verified-callout">
                <span>🛡️ Verified Campus Email: <strong>borseajy@mitwpu.edu.in</strong></span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-content animate-slide-right">
              <span className="step-icon">🎯</span>
              <h2 className="step-title">Pick Your Campus Vibes</h2>
              <p className="step-desc">
                Select 3 or more interests to match with classmates, study buddies, and project partners.
              </p>

              <div className="onboarding-interests-grid">
                {ALL_INTERESTS.slice(0, 10).map((int) => {
                  const isChecked = interests.includes(int.label);
                  return (
                    <button
                      key={int.id}
                      type="button"
                      className={`interest-selection-chip ${isChecked ? 'selected' : ''}`}
                      onClick={() => handleToggle(int.label)}
                    >
                      <span>{int.label}</span>
                      {isChecked && <span className="chip-check-badge">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content animate-slide-right">
              <span className="step-icon">📷</span>
              <h2 className="step-title">Profile Presentation</h2>
              <p className="step-desc">
                Profiles with genuine photos receive 4x more study partner & match invitations.
              </p>

              <div className="onboarding-photo-preview">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                  alt="Profile Preview"
                  className="onboarding-avatar-circle"
                />
                <div className="photo-preview-details">
                  <h4>{userName}, MCA</h4>
                  <p>MIT World Peace University</p>
                  <span className="badge badge-success">✓ Verified Student</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content welcome-step animate-zoom-in">
              <span className="welcome-emoji-big">✨</span>
              <h2 className="welcome-title">
                Welcome to CampusMitra, {userName}!
              </h2>
              <p className="welcome-motto">
                Your campus circle starts here. Connect with classmates, find hackathon buddies, and explore events.
              </p>

              <div className="welcome-features-list">
                <div className="feature-item">
                  <span>✨</span>
                  <span>Swipe & discover matching peers</span>
                </div>
                <div className="feature-item">
                  <span>💬</span>
                  <span>Instant student-to-student messaging</span>
                </div>
                <div className="feature-item">
                  <span>🎓</span>
                  <span>Direct integration with MERN REST API</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="onboarding-footer">
          {step > 1 && step < 4 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrev}
            >
              ← Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              className="btn btn-primary btn-glow"
              onClick={handleNext}
              style={{ marginLeft: 'auto' }}
            >
              <span>{step === 3 ? 'Finish & Celebrate 🎉' : 'Continue →'}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-glow btn-full"
              onClick={onClose}
            >
              <span>Discover Your People ✨</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
