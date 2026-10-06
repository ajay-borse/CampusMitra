import { useState } from 'react';

/**
 * ConnectionsView Component
 * Displays real accepted campus connections and mutual matches from MongoDB.
 * Filterable by All, Mutual Matches, and Study Buddies with Say Hello & Message actions.
 */
export default function ConnectionsView({
  connections = [],
  onStartChat,
  onShowFriendshipToast,
  onNavigate,
  isLoading = false,
}) {
  const [activeSubTab, setActiveSubTab] = useState('all');

  const filtered = connections.filter((c) => {
    if (activeSubTab === 'study') {
      const interests = (c.interests || []).join(' ').toLowerCase();
      const lookingFor = (c.lookingFor || '').toLowerCase();
      return (
        lookingFor.includes('study') ||
        interests.includes('study') ||
        interests.includes('hackathon') ||
        interests.includes('coding')
      );
    }
    return true;
  });

  return (
    <div className="page-view connections-view animate-fade-in">
      <div className="page-header-block">
        <div>
          <h1 className="page-main-title">💜 Campus Connections</h1>
          <p className="page-subtitle">Your verified circle of classmates, friends, study buddies, and matches</p>
        </div>

        {/* Filter Pills */}
        <div className="subtab-pills">
          <button
            type="button"
            className={`subtab-btn ${activeSubTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('all')}
          >
            <span>🤝 All Connections ({connections.length})</span>
          </button>
          <button
            type="button"
            className={`subtab-btn ${activeSubTab === 'study' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('study')}
          >
            <span>📚 Study Buddies</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="state-container loading-state">
          <div className="spinner" />
          <p>Loading your connections...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="connections-grid">
          {filtered.map((student) => {
            const avatarUrl =
              student.avatar ||
              (student.photos && student.photos[0]) ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

            return (
              <div key={student.id || student.userId} className="connection-card animate-scale-in">
                <div className="conn-header">
                  <div className="conn-avatar-wrap">
                    <img src={avatarUrl} alt={student.name} className="conn-avatar-img" />
                    <span className="conn-online-indicator" title="Active on campus" />
                  </div>
                  <div className="conn-info">
                    <h3 className="conn-name">{student.name}</h3>
                    <p className="conn-program">{student.program || 'Student'}</p>
                    {student.isVerified && (
                      <span className="campus-badge" style={{ marginTop: '0.25rem', display: 'inline-block' }}>
                        🛡️ MIT-WPU Verified
                      </span>
                    )}
                  </div>
                </div>

                <p className="conn-bio-excerpt">
                  {student.bio || 'Connected on CampusMitra'}
                </p>

                {student.interests && student.interests.length > 0 && (
                  <div className="conn-interests-wrap">
                    {student.interests.slice(0, 4).map((interest, idx) => (
                      <span key={idx} className="chip-micro">{interest}</span>
                    ))}
                  </div>
                )}

                <div className="conn-card-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onShowFriendshipToast(student.name)}
                    title="Send a quick wave"
                  >
                    <span>Say Hello 👋</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onStartChat(student)}
                  >
                    <span>💬 Message</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="state-container empty-state animate-scale-in">
          <span className="empty-icon">🤝</span>
          <h3>No connections yet</h3>
          <p>
            When you and another student both express interest in each other, they will appear here in your campus circle!
          </p>
          <button
            type="button"
            className="btn btn-primary btn-glow"
            onClick={() => onNavigate('discover')}
          >
            <span>✨ Explore Discover Deck</span>
          </button>
        </div>
      )}
    </div>
  );
}
