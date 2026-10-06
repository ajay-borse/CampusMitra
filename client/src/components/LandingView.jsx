/**
 * LandingView Component
 * Premium welcome experience for unauthenticated campus students.
 * Outlines student discovery, verification, and campus community features.
 */
export default function LandingView({ onOpenAuth }) {
  return (
    <div className="landing-page-wrap animate-fade-in">
      <div className="landing-hero-section">
        <div className="landing-badge">
          <span>🎓 Independent Student Project &bull; MIT-WPU Network</span>
        </div>

        <h1 className="landing-main-title">
          CAMPUS<span className="gradient-text">MITRA</span> ✨
        </h1>

        <p className="landing-tagline">
          Find Your People. Find Your Vibe.
        </p>

        <p className="landing-description">
          The verified social, networking, and discovery platform built exclusively for students at MIT World Peace University. Connect over shared projects, find study buddies, explore hackathons, and discover genuine campus friends.
        </p>

        <div className="landing-cta-row">
          <button
            type="button"
            className="btn btn-primary btn-glow btn-lg"
            onClick={() => onOpenAuth('register')}
            id="landing-get-started-btn"
          >
            <span>✨ Start Your Journey</span>
          </button>

          <button
            type="button"
            className="btn btn-glass btn-lg"
            onClick={() => onOpenAuth('login')}
            id="landing-login-btn"
          >
            <span>Log In with Campus Email →</span>
          </button>
        </div>

        <div className="landing-trust-pills">
          <span className="trust-pill">🛡️ Strict @mitwpu.edu.in Verification</span>
          <span className="trust-pill">❤️ 18+ Safe Dating Restraints</span>
          <span className="trust-pill">📚 Real-Time Study & Project Matching</span>
          <span className="trust-pill">📷 6-Photo Complete Profiles</span>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="landing-features-grid">
        <div className="landing-feature-card">
          <span className="feat-icon">✨</span>
          <h3 className="feat-title">Tactile Peer Discovery</h3>
          <p className="feat-desc">
            Explore classmates by department, shared coding interests, anime, music, or sports with dynamic compatibility indicators.
          </p>
        </div>

        <div className="landing-feature-card">
          <span className="feat-icon">💫</span>
          <h3 className="feat-title">Real Mutual Connections</h3>
          <p className="feat-desc">
            No spam. You only connect and start messaging when both students independently choose to connect.
          </p>
        </div>

        <div className="landing-feature-card">
          <span className="feat-icon">💬</span>
          <h3 className="feat-title">Live Campus Messenger</h3>
          <p className="feat-desc">
            End-to-end real-time chat powered by Socket.IO with typing indicators, presence, and instant study meetups.
          </p>
        </div>

        <div className="landing-feature-card">
          <span className="feat-icon">🛡️</span>
          <h3 className="feat-title">Safety & Moderation First</h3>
          <p className="feat-desc">
            Built-in blocking, student reporting, administrative moderation, and strict university domain enforcement.
          </p>
        </div>
      </div>
    </div>
  );
}
