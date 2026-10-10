import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Users,
  MessageSquare,
  BookOpen,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { connectionApi } from '../api/connectionApi';
import { discoverApi } from '../api/discoverApi';
import { chatApi } from '../api/chatApi';
import { notificationApi } from '../api/notificationApi';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function DashboardPage() {
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    connectionsCount: 0,
    discoverCount: 0,
    conversationsCount: 0,
    notificationsCount: 0,
  });
  const [recentConnections, setRecentConnections] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [connRes, discRes, chatRes, notifRes] = await Promise.allSettled([
          connectionApi.getConnections(),
          discoverApi.getProfiles(),
          chatApi.getConversations(),
          notificationApi.getNotifications(),
        ]);

        if (isMounted) {
          const connections = connRes.status === 'fulfilled' && connRes.value?.success
            ? connRes.value.data || []
            : [];

          const discoverProfiles = discRes.status === 'fulfilled' && discRes.value?.success
            ? discRes.value.data || []
            : [];

          const conversations = chatRes.status === 'fulfilled' && chatRes.value?.success
            ? chatRes.value.data || []
            : [];

          const notifications = notifRes.status === 'fulfilled' && notifRes.value?.success
            ? notifRes.value.data || []
            : [];

          setStats({
            connectionsCount: connections.length,
            discoverCount: discoverProfiles.length,
            conversationsCount: conversations.length,
            notificationsCount: notifRes.status === 'fulfilled' ? notifRes.value.unreadCount || 0 : 0,
          });

          setRecentConnections(connections.slice(0, 4));
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute profile completion percentage and actionable tips
  const completionPercent = profile?.completionPercentage || 40;

  // Generate dynamic suggestions based on missing items
  const getCompletionSuggestions = () => {
    const tips = [];
    const photoCount = profile?.photos?.length || 0;
    const interestCount = profile?.interests?.length || 0;
    const langCount = profile?.languages?.length || 0;

    if (photoCount < 2) {
      tips.push('Add your second photo 📸');
    }
    if (interestCount < 5) {
      const needed = Math.max(1, 5 - interestCount);
      tips.push(`Add ${needed} more interest${needed > 1 ? 's' : ''} ✨`);
    }
    if (!profile?.story?.perfectWeekend) {
      tips.push('Tell us about your perfect weekend ☕');
    }
    if (langCount < 2) {
      tips.push('Add languages you speak 🌍');
    }
    if (!user?.isVerified && user?.studentIdVerificationStatus !== 'PENDING') {
      tips.push('Verify student ID for campus badge 🪪');
    }
    return tips;
  };

  const suggestions = getCompletionSuggestions();

  return (
    <div className="dashboard-container">
      {/* Top Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-info">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-accent">🎓 MIT-WPU Student</span>
            {user?.role === 'admin' && (
              <span className="badge badge-warning">🛡️ Campus Moderator</span>
            )}
            {user?.isVerified && (
              <span className="badge badge-success">✓ Verified Student</span>
            )}
          </div>
          <h1 className="welcome-title">
            Hey, {user?.firstName || 'Student'}! 👋
          </h1>
          <p className="welcome-sub">
            Here's what's happening around campus today. Explore new project collaborators
            or catch up with mutual connections.
          </p>
        </div>

        {/* Profile Completion Meter */}
        <div className="completion-card">
          <div className="completion-header">
            <span className="completion-label">Your profile is {completionPercent}% complete</span>
            <span className="completion-val font-bold text-accent-cyan">{completionPercent}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {suggestions.length > 0 && completionPercent < 100 && (
            <div className="completion-tip text-xs text-secondary mt-1 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" />
              <span>Suggestion: {suggestions[0]}</span>
            </div>
          )}
          <Link to="/profile/edit" className="completion-action mt-2 inline-flex items-center gap-1">
            {completionPercent === 100 ? (
              <span className="text-success flex items-center gap-1">
                <CheckCircle2 size={14} /> Profile 100% Complete ✨
              </span>
            ) : (
              <span>Boost your profile &rarr;</span>
            )}
          </Link>
        </div>
      </div>

      {/* Real Metric Counters Grid */}
      <div className="stats-grid">
        <Link to="/connections" className="stat-card">
          <div className="stat-card-icon icon-purple">
            <Users size={22} />
          </div>
          <div className="stat-card-meta">
            <div className="stat-card-value">
              {loading ? '...' : stats.connectionsCount}
            </div>
            <div className="stat-card-label">Mutual Connections</div>
          </div>
        </Link>

        <Link to="/discover" className="stat-card">
          <div className="stat-card-icon icon-pink">
            <Compass size={22} />
          </div>
          <div className="stat-card-meta">
            <div className="stat-card-value">
              {loading ? '...' : stats.discoverCount}
            </div>
            <div className="stat-card-label">Potential Peers in Feed</div>
          </div>
        </Link>

        <Link to="/chat" className="stat-card">
          <div className="stat-card-icon icon-blue">
            <MessageSquare size={22} />
          </div>
          <div className="stat-card-meta">
            <div className="stat-card-value">
              {loading ? '...' : stats.conversationsCount}
            </div>
            <div className="stat-card-label">Active Conversations</div>
          </div>
        </Link>

        <Link to="/directory" className="stat-card">
          <div className="stat-card-icon icon-emerald">
            <BookOpen size={22} />
          </div>
          <div className="stat-card-meta">
            <div className="stat-card-value">CRUD</div>
            <div className="stat-card-label">Student Directory</div>
          </div>
        </Link>
      </div>

      {/* Main Dashboard Layout */}
      <div className="dashboard-columns">
        {/* Left Column: Quick Actions & Recent Connections */}
        <div className="dashboard-left">
          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title flex items-center gap-2">
                <Sparkles size={18} className="text-secondary" /> Quick Campus Actions
              </h3>
            </div>
            <div className="action-buttons-grid">
              <Link to="/discover" className="action-tile">
                <Compass size={24} className="text-primary" />
                <div className="action-tile-title">Browse Discovery Deck</div>
                <div className="action-tile-sub">Find students with matching interests</div>
              </Link>

              <Link to="/chat" className="action-tile">
                <MessageSquare size={24} className="text-accent" />
                <div className="action-tile-title">Live Messenger</div>
                <div className="action-tile-sub">Real-time Socket.IO chat with matches</div>
              </Link>

              <Link to="/directory" className="action-tile">
                <BookOpen size={24} className="text-success" />
                <div className="action-tile-title">Student Directory</div>
                <div className="action-tile-sub">Full MERN CRUD student management</div>
              </Link>

              <Link to="/profile/edit" className="action-tile">
                <UserCheck size={24} className="text-warning" />
                <div className="action-tile-title">Manage 6-Slot Gallery</div>
                <div className="action-tile-sub">Upload photos & tag coding skills</div>
              </Link>
            </div>
          </div>

          {/* Recent Connections Grid */}
          <div className="section-card mt-4">
            <div className="section-card-header">
              <h3 className="section-card-title">Recent Connections</h3>
              <Link to="/connections" className="text-sm text-primary flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="py-4">
                <CardSkeleton />
              </div>
            ) : recentConnections.length === 0 ? (
              <div className="empty-mini">
                <p className="text-muted text-sm mb-3">
                  No mutual connections yet. Start browsing the Discovery Deck to connect!
                </p>
                <Link to="/discover" className="btn btn-sm btn-primary">
                  Start Discovering
                </Link>
              </div>
            ) : (
              <div className="connections-mini-grid">
                {recentConnections.map((conn) => {
                  const partner = conn.user;
                  const partnerProfile = conn.profile;
                  const photo = partnerProfile?.photos?.[0];

                  return (
                    <div key={conn._id || partner?._id} className="connection-mini-card">
                      <div className="connection-mini-avatar">
                        {photo ? (
                          <img src={photo} alt={partner?.firstName} />
                        ) : (
                          <span>{partner?.firstName?.[0] || 'S'}</span>
                        )}
                      </div>
                      <div className="connection-mini-info">
                        <div className="font-semibold text-sm">
                          {partner?.firstName} {partner?.lastName}
                        </div>
                        <div className="text-xs text-muted">
                          {partnerProfile?.program || 'MIT-WPU Student'}
                        </div>
                      </div>
                      <Link
                        to={`/chat?conv=${conn.conversationId || ''}`}
                        className="btn btn-xs btn-outline"
                      >
                        Chat
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Campus Pulse & Guidelines */}
        <div className="dashboard-right">
          <div className="section-card">
            <div className="section-card-header">
              <h3 className="section-card-title flex items-center gap-2">
                <TrendingUp size={18} className="text-info" /> Campus Pulse
              </h3>
            </div>
            <div className="pulse-items-list">
              <div className="pulse-item">
                <div className="pulse-emoji">🚀</div>
                <div className="pulse-content">
                  <div className="pulse-title">Hackathon Teammate Search</div>
                  <div className="pulse-desc">
                    Find React, Python, or Flutter developers for upcoming college hackathons.
                  </div>
                </div>
              </div>

              <div className="pulse-item">
                <div className="pulse-emoji">☕</div>
                <div className="pulse-content">
                  <div className="pulse-title">Campus Chai Breaks</div>
                  <div className="pulse-desc">
                    Connect with study partners around Kothrud & Paud Road campus cafes.
                  </div>
                </div>
              </div>

              <div className="pulse-item">
                <div className="pulse-emoji">📚</div>
                <div className="pulse-content">
                  <div className="pulse-title">Semester Exam Study Groups</div>
                  <div className="pulse-desc">
                    Form peer review circles for Data Structures, DBMS, and AI/ML.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-card mt-4 info-accent-card">
            <h4 className="font-semibold text-sm mb-1">Campus Safety & Guidelines</h4>
            <p className="text-xs text-muted mb-2">
              CampusMitra is built with age-gated dating protection, zero fake accounts, and 
              strict mutual matching. Please be respectful to all students.
            </p>
            <div className="text-xs text-secondary font-medium">
              Report violations anytime via the report flag on any profile.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
