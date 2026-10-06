/**
 * CampusMitra Navbar Component
 * Sleek, glassmorphic header with active pill transitions, live badge counters,
 * and authentication state.
 */
export default function Navbar({
  activeTab,
  setActiveTab,
  unreadCount = 0,
  notificationCount = 0,
  onOpenNotifications,
  onLaunchOnboarding,
  user,
  onLogout,
  onOpenAuth,
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'discover', label: 'Discover', icon: '✨' },
    { id: 'connections', label: 'Connections', icon: '💜' },
    { id: 'chat', label: 'Chat', icon: '💬', badge: unreadCount },
    { id: 'records', label: 'Directory API', icon: '🎓', subtext: 'MERN CRUD' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: '🛡️' });
  }

  const avatarUrl =
    user?.profile?.photos?.[0] ||
    user?.avatar ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand / Logo */}
        <div
          className="brand-group"
          onClick={() => setActiveTab(user ? 'home' : 'landing')}
          role="button"
          tabIndex={0}
        >
          <div className="brand-logo-glow">
            <span className="brand-emoji">🎓</span>
          </div>
          <div>
            <div className="brand-title-wrap">
              <span className="brand-title">CampusMitra</span>
              <span className="brand-campus-pill">MIT-WPU</span>
            </div>
            <span className="brand-motto">Find Your People. Find Your Vibe.</span>
          </div>
        </div>

        {/* Navigation Tabs (if logged in) */}
        {user ? (
          <nav className="nav-tabs" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-${item.id}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.subtext && <span className="nav-subtag">{item.subtext}</span>}
                  {Boolean(item.badge) && item.badge > 0 && (
                    <span className="nav-badge animate-pulse">{item.badge}</span>
                  )}
                  {isActive && <span className="nav-active-indicator" />}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="nav-tabs">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
              Verified MIT-WPU Student Network
            </span>
          </div>
        )}

        {/* Right Action Icons */}
        <div className="navbar-actions">
          {user ? (
            <>
              {/* Onboarding Wizard Launcher */}
              <button
                type="button"
                className="btn-onboarding-launcher"
                onClick={onLaunchOnboarding}
                title="Launch Campus Onboarding Tour"
              >
                <span>🚀 Onboarding Tour</span>
              </button>

              {/* Notifications Bell */}
              <button
                type="button"
                className="btn-icon-nav"
                onClick={onOpenNotifications}
                title="Campus Notifications"
                id="nav-notifications-btn"
              >
                <span className="bell-emoji">🔔</span>
                {notificationCount > 0 && (
                  <span className="notification-dot">{notificationCount}</span>
                )}
              </button>

              {/* User Profile Thumbnail */}
              <button
                type="button"
                className="nav-user-avatar-btn"
                onClick={() => setActiveTab('profile')}
                title="View Profile"
              >
                <img src={avatarUrl} alt={user.firstName} className="nav-avatar-img" />
                <span className="nav-online-status" />
              </button>

              {/* Logout Button */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onLogout}
                title="Sign Out"
                style={{ padding: '0.4rem 0.75rem' }}
              >
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenAuth('login')}
              >
                Log In
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm btn-glow"
                onClick={() => onOpenAuth('register')}
              >
                Register ✨
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
