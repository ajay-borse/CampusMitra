import { useEffect } from 'react';
import { fireConfetti } from '../utils/confetti';

/**
 * MatchModal Component
 * Full-screen celebratory animation when two students mutually connect!
 * Features dual photo slide-in, floating hearts, sparkles, and instant chat transition.
 */
export default function MatchModal({
  isOpen,
  matchedUser,
  currentUser,
  onStartChat,
  onClose,
}) {
  useEffect(() => {
    if (isOpen) {
      fireConfetti(3000);
    }
  }, [isOpen]);

  if (!isOpen || !matchedUser) return null;

  return (
    <div className="match-modal-overlay animate-fade-in" role="dialog" aria-modal="true">
      {/* Floating Sparkles & Hearts Background */}
      <div className="floating-elements-bg">
        <span className="float-particle fp-1">✨</span>
        <span className="float-particle fp-2">💜</span>
        <span className="float-particle fp-3">💫</span>
        <span className="float-particle fp-4">✨</span>
        <span className="float-particle fp-5">💜</span>
        <span className="float-particle fp-6">🎉</span>
      </div>

      <div className="match-card-content animate-zoom-in">
        <div className="match-header-sparkles">
          <span className="sparkle-bounce">✨</span>
          <span className="heart-pulse">💜</span>
          <span className="sparkle-bounce delay-1">✨</span>
        </div>

        <h1 className="match-title-gradient">IT'S A MATCH!</h1>
        <p className="match-subtitle">
          You and <strong>{matchedUser.name}</strong> both want to connect on campus!
        </p>

        {/* Dual Profile Photos Slide-in */}
        <div className="dual-photos-container">
          <div className="match-photo-wrap photo-left animate-slide-right">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="match-avatar"
            />
            <span className="photo-label">You</span>
          </div>

          <div className="match-heart-center animate-heart-beat">
            <span>💜</span>
          </div>

          <div className="match-photo-wrap photo-right animate-slide-left">
            <img
              src={matchedUser.avatar}
              alt={matchedUser.name}
              className="match-avatar"
            />
            <span className="photo-label">{matchedUser.name.split(' ')[0]}</span>
          </div>
        </div>

        {/* Shared Connection Hook */}
        <div className="match-shared-hook">
          <span className="hook-icon">🎯</span>
          <span>Shared Interests: <strong>Coding, Music & Weekend Hackathons</strong></span>
        </div>

        {/* Actions */}
        <div className="match-actions-row">
          <button
            type="button"
            className="btn btn-primary btn-match-chat btn-glow"
            onClick={() => onStartChat(matchedUser)}
            id="match-start-chat-btn"
          >
            <span>💬 Start Chat Now</span>
          </button>

          <button
            type="button"
            className="btn btn-glass btn-match-keep"
            onClick={onClose}
          >
            <span>Keep Discovering ✨</span>
          </button>
        </div>
      </div>
    </div>
  );
}
