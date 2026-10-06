import { useState, useRef } from 'react';

/**
 * DiscoverView Component
 * Real-time tactile profile discovery deck with swipe gestures and tactile buttons.
 * Communicates with backend endpoints:
 * POST /api/connections/interest
 * POST /api/connections/pass
 */
export default function DiscoverView({
  profiles = [],
  onSwipeRight,
  onSwipeLeft,
  onRefresh,
  isLoading = false,
}) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeStatus, setSwipeStatus] = useState(null); // 'pass' | 'interested' | null
  const [interestBurst, setInterestBurst] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const currentProfile = profiles[0];

  const handlePointerDown = (e) => {
    setIsDragging(true);
    startPos.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
      y: e.clientY || (e.touches && e.touches[0].clientY) || 0,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset.x > 110) {
      triggerSwipe('right');
    } else if (dragOffset.x < -110) {
      triggerSwipe('left');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const triggerSwipe = (direction) => {
    if (!currentProfile) return;

    if (direction === 'right') {
      setSwipeStatus('interested');
      setInterestBurst(true);
      onSwipeRight(currentProfile);
    } else {
      setSwipeStatus('pass');
      onSwipeLeft(currentProfile);
    }

    setTimeout(() => {
      setSwipeStatus(null);
      setDragOffset({ x: 0, y: 0 });
      setInterestBurst(false);
      setActivePhotoIndex(0);
    }, 380);
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    if (!currentProfile?.photos || currentProfile.photos.length === 0) return;
    setActivePhotoIndex((prev) => (prev + 1) % currentProfile.photos.length);
  };

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    if (!currentProfile?.photos || currentProfile.photos.length === 0) return;
    setActivePhotoIndex(
      (prev) => (prev - 1 + currentProfile.photos.length) % currentProfile.photos.length
    );
  };

  const rotation = dragOffset.x * 0.08;
  const cardTransform = isDragging
    ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`
    : swipeStatus === 'interested'
    ? 'translateX(130%) rotate(25deg)'
    : swipeStatus === 'pass'
    ? 'translateX(-130%) rotate(-25deg)'
    : 'translate(0, 0) rotate(0deg)';

  const photosList = currentProfile?.photos && currentProfile.photos.length > 0
    ? currentProfile.photos
    : [currentProfile?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'];

  return (
    <div className="page-view discover-view animate-fade-in">
      <div className="discover-deck-container">
        {isLoading ? (
          <div className="state-container loading-state">
            <div className="spinner" />
            <p>Loading real campus profiles...</p>
          </div>
        ) : currentProfile ? (
          <div
            className={`discover-card-wrap ${isDragging ? 'is-dragging' : ''}`}
            style={{
              transform: cardTransform,
              transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            {/* Dynamic Stamp Overlays */}
            {(dragOffset.x > 50 || swipeStatus === 'interested') && (
              <div className="swipe-stamp stamp-interested animate-stamp">
                <span>💜 INTERESTED</span>
              </div>
            )}
            {(dragOffset.x < -50 || swipeStatus === 'pass') && (
              <div className="swipe-stamp stamp-pass animate-stamp">
                <span>✕ PASS</span>
              </div>
            )}

            {/* Photo Slideshow Area */}
            <div className="card-photo-area">
              <img
                src={photosList[activePhotoIndex]}
                alt={currentProfile.name}
                className="card-main-image"
                draggable="false"
              />

              {photosList.length > 1 && (
                <div className="photo-indicators">
                  {photosList.map((_, idx) => (
                    <span
                      key={idx}
                      className={`photo-dot ${idx === activePhotoIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                className="photo-tap-left"
                onClick={handlePrevPhoto}
                aria-label="Previous photo"
              />
              <button
                type="button"
                className="photo-tap-right"
                onClick={handleNextPhoto}
                aria-label="Next photo"
              />

              <div className="floating-compat-pill">
                <span className="compat-glow-dot" />
                <span>✨ {currentProfile.compatibility}% Interest Match</span>
              </div>
            </div>

            {/* Profile Information */}
            <div className="card-info-area">
              <div className="card-header-row">
                <div>
                  <h2 className="card-person-name">
                    {currentProfile.name}
                    {currentProfile.age && (
                      <span className="card-age">, {currentProfile.age}</span>
                    )}
                  </h2>
                  <p className="card-program-line">
                    🎓 {currentProfile.program || 'Student'} &bull; {currentProfile.year || 'MIT-WPU'}
                  </p>
                </div>
                <span className="campus-badge">MIT-WPU</span>
              </div>

              <p className="card-bio-text">
                {currentProfile.bio || 'Exploring study partnerships and campus connections.'}
              </p>

              {currentProfile.sharedGoals && (
                <div className="shared-goals-pill">
                  <span className="goal-label">Looking for:</span>
                  <span className="goal-value">{currentProfile.sharedGoals}</span>
                </div>
              )}

              {currentProfile.sharedInterests && currentProfile.sharedInterests.length > 0 && (
                <div className="card-interests-group">
                  <span className="interests-heading">Shared Campus Vibes:</span>
                  <div className="chip-list">
                    {currentProfile.sharedInterests.map((interest, i) => (
                      <span key={i} className="chip-interest">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty Discovery State */
          <div className="empty-deck-state animate-scale-in">
            <span className="empty-deck-icon">🎓</span>
            <h3 className="empty-deck-title">You're one of the first students here! ✨</h3>
            <p className="empty-deck-subtitle">
              No new unswiped student profiles right now. Invite your classmates with their @mitwpu.edu.in emails to expand your campus circle!
            </p>
            <button
              type="button"
              className="btn btn-primary btn-glow"
              onClick={onRefresh}
            >
              <span>🔄 Check for New Peers</span>
            </button>
          </div>
        )}

        {/* Tactile Bottom Action Controls */}
        {currentProfile && (
          <div className="discover-action-dock">
            <button
              type="button"
              className="dock-btn btn-rewind"
              onClick={onRefresh}
              title="Refresh Deck"
            >
              <span>🔄</span>
            </button>

            <button
              type="button"
              className="dock-btn btn-pass"
              onClick={() => triggerSwipe('left')}
              title="Pass"
              id="discover-pass-btn"
            >
              <span>✕</span>
            </button>

            <button
              type="button"
              className="dock-btn btn-super"
              onClick={() => triggerSwipe('right')}
              title="Super Interest"
            >
              <span>⭐</span>
            </button>

            <button
              type="button"
              className={`dock-btn btn-interested ${interestBurst ? 'animate-heart-burst' : ''}`}
              onClick={() => triggerSwipe('right')}
              title="Send Interest"
              id="discover-interested-btn"
            >
              <span>{interestBurst ? '✨' : '💜'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
