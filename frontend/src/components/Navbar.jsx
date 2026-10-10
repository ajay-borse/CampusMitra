import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Compass,
  Users,
  MessageSquare,
  BookOpen,
  Bell,
  Shield,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Radio,
  Calendar,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { notificationApi } from '../api/notificationApi';

export default function Navbar() {
  const { user, profile, isAuthenticated, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Fetch unread notifications if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getNotifications();
        if (isMounted && res?.success) {
          setUnreadCount(res.unreadCount || 0);
        }
      } catch {
        // Notification service failure handled silently
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const primaryPhoto =
    profile?.photos && profile.photos.length > 0 ? profile.photos[0] : null;

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
          <div className="brand-logo-icon">
            <GraduationCap size={24} className="text-primary" />
          </div>
          <div className="brand-text-block">
            <span className="brand-name">CAMPUSMITRA ✨</span>
            <span className="brand-sub">Find Your People. Find Your Vibe.</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          {isAuthenticated && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/discover"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <Compass size={16} /> Discover
              </NavLink>
              <NavLink
                to="/connections"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <Users size={16} /> Connections
              </NavLink>
              <NavLink
                to="/radar"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <Radio size={16} className="text-pink-400" /> Radar
              </NavLink>
              <NavLink
                to="/plans"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <Calendar size={16} /> Campus Plans
              </NavLink>
              <NavLink
                to="/circles"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <Radio size={16} /> Campus Circles
              </NavLink>
              <NavLink
                to="/pulse"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <Flame size={16} className="text-pink-500" /> Pulse
              </NavLink>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <MessageSquare size={16} /> Chat
              </NavLink>
            </>
          )}

          {/* Directory is accessible both authenticated and unauthenticated */}
          <NavLink
            to="/directory"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            <BookOpen size={16} /> Student Directory
          </NavLink>

          {isAuthenticated && user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link nav-link-admin ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <Shield size={16} /> Admin Console
            </NavLink>
          )}
        </div>

        {/* Right Section: Socket Status, Notifications, Auth/Profile */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              {/* Real-time Status Dot */}
              <div
                className="status-pill"
                title={
                  isConnected
                    ? 'Connected to live Socket.IO campus network'
                    : 'Connecting to real-time network...'
                }
              >
                <span
                  className={`status-dot ${isConnected ? 'status-online' : 'status-offline'}`}
                />
                <span className="status-label text-xs">
                  {isConnected ? 'Live' : 'Syncing'}
                </span>
              </div>

              {/* Notifications Link */}
              <Link
                to="/notifications"
                className="icon-btn relative-box"
                aria-label="Notifications"
                title="Campus Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="badge-notification">{unreadCount}</span>
                )}
              </Link>

              {/* User Dropdown Pill */}
              <div className="relative-box">
                <button
                  className="user-pill-btn"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  aria-expanded={userDropdownOpen}
                >
                  <div className="avatar-micro">
                    {primaryPhoto ? (
                      <img src={primaryPhoto} alt={user?.firstName} />
                    ) : (
                      <span>{user?.firstName?.[0] || 'U'}</span>
                    )}
                  </div>
                  <span className="user-pill-name">{user?.firstName}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="dropdown-menu"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="dropdown-header">
                      <div className="font-semibold">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-xs text-muted truncate">{user?.email}</div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/profile" className="dropdown-item">
                      <User size={16} /> View Profile
                    </Link>
                    <Link to="/onboarding" className="dropdown-item">
                      <Sparkles size={16} className="text-amber-400" /> Onboarding Tour ✨
                    </Link>
                    <Link to="/profile/edit" className="dropdown-item">
                      <Settings size={16} /> Edit Profile & Photos
                    </Link>
                    <Link to="/settings" className="dropdown-item">
                      <Settings size={16} /> Settings
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="dropdown-item text-warning">
                        <Shield size={16} /> Admin Portal
                      </Link>
                    )}
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-btn-group">
              <Link to="/login" className="btn btn-sm btn-ghost">
                Log In
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Join Campus
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-links">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className="mobile-link">
                  Dashboard
                </NavLink>
                <NavLink to="/discover" className="mobile-link">
                  <Compass size={18} /> Discover Peers
                </NavLink>
                <NavLink to="/connections" className="mobile-link">
                  <Users size={18} /> Connections
                </NavLink>
                <NavLink to="/radar" className="mobile-link">
                  <Radio size={18} className="text-pink-400" /> Campus Radar
                </NavLink>
                <NavLink to="/plans" className="mobile-link">
                  <Calendar size={18} /> Campus Plans
                </NavLink>
                <NavLink to="/circles" className="mobile-link">
                  <Radio size={18} /> Campus Circles
                </NavLink>
                <NavLink to="/pulse" className="mobile-link">
                  <Flame size={18} className="text-pink-500" /> Campus Pulse
                </NavLink>
                <NavLink to="/chat" className="mobile-link">
                  <MessageSquare size={18} /> Messenger
                </NavLink>
                <NavLink to="/notifications" className="mobile-link">
                  <Bell size={18} /> Notifications
                  {unreadCount > 0 && (
                    <span className="badge-inline">{unreadCount}</span>
                  )}
                </NavLink>
                <NavLink to="/profile" className="mobile-link">
                  <User size={18} /> My Profile
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" className="mobile-link text-warning">
                    <Shield size={18} /> Admin Console
                  </NavLink>
                )}
              </>
            ) : null}

            <NavLink to="/directory" className="mobile-link">
              <BookOpen size={18} /> Student Directory CRUD
            </NavLink>

            <div className="mobile-drawer-divider" />

            {isAuthenticated ? (
              <button
                className="mobile-link text-danger w-full text-left"
                onClick={handleLogout}
              >
                <LogOut size={18} /> Log Out ({user?.firstName})
              </button>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                <Link to="/login" className="btn btn-outline w-full text-center">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary w-full text-center">
                  Join CampusMitra
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
