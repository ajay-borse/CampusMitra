import { useState, useEffect } from 'react';

/**
 * HomeView Component
 * Dynamic campus dashboard using real authenticated user data, real MongoDB counters,
 * real peer recommendations, and campus trending topics.
 */
export default function HomeView({
  user,
  profile,
  onNavigate,
  onOpenMatch,
  discoverProfiles = [],
  connectionsCount = 0,
  unreadCount = 0,
}) {
  // Animated counters on mount using real database metrics
  const [counts, setCounts] = useState({
    connections: 0,
    messages: 0,
  });

  const completionScore = profile?.completionPercentage || 25;

  useEffect(() => {
    let currentStep = 0;
    const steps = 30;
    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(1, currentStep / steps);
      const eased = 1 - (1 - progress) * (1 - progress);

      setCounts({
        connections: Math.round(eased * connectionsCount),
        messages: Math.round(eased * unreadCount),
      });

      if (currentStep >= steps) clearInterval(timer);
    }, 30);

    return () => clearInterval(timer);
  }, [connectionsCount, unreadCount]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const trendingTopics = [
    { id: 't1', icon: '🚀', tag: '#Hackathon2026', title: 'MIT-WPU Innovation Fest', participants: 'Campus Hackathon' },
    { id: 't2', icon: '🏏', tag: '#InterCampusCricket', title: 'Inter-College Tournament', participants: 'Cricket Ground' },
    { id: 't3', icon: '🎮', tag: '#ValorantLAN', title: 'Campus Esports Night', participants: 'LAN Gaming Lab' },
    { id: 't4', icon: '🎵', tag: '#CampusAcoustic', title: 'Open Mic Night @ Amphitheater', participants: 'Student Council' },
  ];

  const topPeer = discoverProfiles[0];

  return (
    <div className="page-view home-view animate-fade-in">
      {/* Hero Welcome Banner */}
      <section className="home-hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="sparkle-icon">✨</span>
            <span>MIT-WPU Campus Network Active</span>
          </div>
          <h1 className="hero-greeting">
            {getGreeting()},{' '}
            <span className="gradient-text">{user?.firstName || 'Student'}</span> 👋
          </h1>
          <p className="hero-tagline">
            Find your people. Find your vibe. Connect with classmates across your department for study groups, projects, and campus life.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary btn-glow"
              onClick={() => onNavigate('discover')}
              id="home-discover-btn"
            >
              <span>✨ Explore Campus Discover</span>
            </button>
            <button
              type="button"
              className="btn btn-glass"
              onClick={() => onNavigate('records')}
            >
              <span>🎓 Student Directory API (CRUD)</span>
            </button>
          </div>
        </div>

        {/* Real Statistics Widget */}
        <div className="hero-stats-grid">
          <div className="stat-card" onClick={() => onNavigate('connections')}>
            <div className="stat-icon-wrap icon-purple">
              <span>💜</span>
            </div>
            <div className="stat-info">
              <span className="stat-number">{counts.connections}</span>
              <span className="stat-label">Active Connections</span>
            </div>
          </div>

          <div className="stat-card" onClick={() => onNavigate('chat')}>
            <div className="stat-icon-wrap icon-blue">
              <span>💬</span>
            </div>
            <div className="stat-info">
              <span className="stat-number">{counts.messages}</span>
              <span className="stat-label">Unread Messages</span>
            </div>
          </div>

          <div className="stat-card" onClick={() => onNavigate('profile')}>
            <div className="stat-icon-wrap icon-emerald">
              <span>🎯</span>
            </div>
            <div className="stat-info">
              <span className="stat-number">{completionScore}%</span>
              <span className="stat-label">Profile Strength</span>
            </div>
          </div>
        </div>
      </section>

      {/* Real Top Recommended Candidate Spotlight */}
      {topPeer && (
        <section className="match-spotlight-card">
          <div className="spotlight-left">
            <span className="spotlight-tag">🌟 High Compatibility Peer</span>
            <h3 className="spotlight-title">
              {topPeer.name} ({topPeer.compatibility}% Compatibility)
            </h3>
            <p className="spotlight-desc">
              {topPeer.program} &bull; Shared vibes:{' '}
              <strong>{topPeer.sharedInterests.join(', ') || 'Campus Life'}</strong>
            </p>
            <div className="spotlight-chips">
              {topPeer.sharedInterests.map((interest, idx) => (
                <span key={idx} className="chip-mini">{interest}</span>
              ))}
            </div>
          </div>
          <div className="spotlight-right">
            <button
              type="button"
              className="btn btn-secondary btn-pulse"
              onClick={() => onOpenMatch(topPeer)}
            >
              <span>💫 View Profile</span>
            </button>
          </div>
        </section>
      )}

      {/* Trending on Campus Section */}
      <section className="section-block">
        <div className="section-header">
          <div>
            <h2 className="section-title">🔥 Trending on Campus</h2>
            <p className="section-subtitle">Campus student activities and topic circles</p>
          </div>
          <span className="live-pulse-badge">
            <span className="live-dot" /> Live MIT-WPU
          </span>
        </div>

        <div className="trending-cards-carousel">
          {trendingTopics.map((trend) => (
            <div key={trend.id} className="trending-card">
              <span className="trend-icon">{trend.icon}</span>
              <span className="trend-tag">{trend.tag}</span>
              <h4 className="trend-title">{trend.title}</h4>
              <p className="trend-participants">{trend.participants}</p>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => onNavigate('discover')}
              >
                Explore Peers →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Peers from Real Database */}
      <section className="section-block">
        <div className="section-header">
          <div>
            <h2 className="section-title">✨ Recommended For You</h2>
            <p className="section-subtitle">Real students matching your academic program and interests</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('discover')}
          >
            View Discover Deck ✨
          </button>
        </div>

        {discoverProfiles.length > 0 ? (
          <div className="peers-grid">
            {discoverProfiles.slice(0, 4).map((p) => (
              <div key={p.id} className="peer-card">
                <div className="peer-photo-wrap">
                  <img
                    src={
                      p.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={p.name}
                    className="peer-img"
                  />
                  <span className="peer-compat-badge">
                    ✨ {p.compatibility}% Match
                  </span>
                  {p.isVerified && (
                    <span className="peer-online-pill">
                      <span className="status-dot-mini" /> Verified
                    </span>
                  )}
                </div>

                <div className="peer-body">
                  <div className="peer-name-row">
                    <h3 className="peer-name">{p.name}</h3>
                    {p.age && <span className="peer-dist">{p.age} yrs</span>}
                  </div>
                  <p className="peer-program">{p.program || 'Student'}</p>
                  <p className="peer-bio">{p.bio || 'Exploring campus connections.'}</p>

                  <div className="peer-interests-row">
                    {p.sharedInterests.slice(0, 3).map((interest, i) => (
                      <span key={i} className="interest-tag-micro">{interest}</span>
                    ))}
                  </div>

                  <div className="peer-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-full"
                      onClick={() => onNavigate('discover')}
                    >
                      <span>💜 Connect</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="state-container empty-state">
            <span className="empty-icon">🎓</span>
            <h3>You're one of the first students here!</h3>
            <p>
              Invite your university friends with their @mitwpu.edu.in emails to start discovering and matching!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
