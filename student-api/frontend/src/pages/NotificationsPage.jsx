import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Sparkles,
  Heart,
  MessageSquare,
  Calendar,
  Users,
  Activity,
  ShieldCheck,
  Clock,
  Trash2,
  Check,
  ArrowRight,
  Filter,
  GraduationCap,
} from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications({ limit: 50 });
      if (res?.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotifications();

    const handleRealtimeNotif = () => {
      fetchNotifications();
    };
    window.addEventListener('campusmitra_notification', handleRealtimeNotif);
    return () => {
      window.removeEventListener('campusmitra_notification', handleRealtimeNotif);
    };
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      setMarking(true);
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read', 'success');
      window.dispatchEvent(new CustomEvent('campusmitra_notification'));
    } catch (err) {
      showToast(err.message || 'Failed to mark as read', 'error');
    } finally {
      setMarking(false);
    }
  };

  const handleMarkOneRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.markOneRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new CustomEvent('campusmitra_notification'));
    } catch (err) {
      showToast(err.message || 'Failed to mark notification as read', 'error');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      showToast('Notification removed', 'info');
      window.dispatchEvent(new CustomEvent('campusmitra_notification'));
    } catch (err) {
      showToast(err.message || 'Failed to delete notification', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match':
        return <Sparkles size={18} className="text-accent" />;
      case 'interest':
        return <Heart size={18} className="text-secondary" />;
      case 'message':
        return <MessageSquare size={18} className="text-primary" />;
      case 'plan':
        return <Calendar size={18} className="text-warning" />;
      case 'circle':
        return <Users size={18} className="text-info" />;
      case 'pulse':
        return <Activity size={18} className="text-success" />;
      case 'verification':
        return <ShieldCheck size={18} className="text-primary" />;
      default:
        return <Bell size={18} className="text-muted" />;
    }
  };

  const getActionLink = (item) => {
    if (item.data?.conversationId) {
      return {
        url: `/chat?conv=${item.data.conversationId}`,
        label: 'Open Chat',
      };
    }
    if (item.type === 'interest') {
      return {
        url: '/discover',
        label: 'Discover Students',
      };
    }
    if (item.type === 'plan' || item.data?.planId) {
      return {
        url: '/plans',
        label: 'View Plans',
      };
    }
    if (item.type === 'circle' || item.data?.circleId) {
      return {
        url: '/circles',
        label: 'View Circles',
      };
    }
    if (item.type === 'pulse' || item.data?.postId) {
      return {
        url: '/pulse',
        label: 'View Pulse',
      };
    }
    return null;
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'unread') return !item.isRead;
    if (activeFilter === 'matches') return item.type === 'match' || item.type === 'interest';
    if (activeFilter === 'messages') return item.type === 'message';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notifications-page-container">
      {/* Top Header */}
      <div className="page-header-row mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="page-title flex items-center gap-2">
              <Bell className="text-primary" /> Campus Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="badge badge-primary">{unreadCount} new</span>
            )}
          </div>
          <p className="page-subtitle">
            Real-time updates on student likes, mutual matches, chat activity, and campus events.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="btn btn-outline btn-sm flex items-center gap-2"
            onClick={handleMarkAllRead}
            disabled={marking}
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="notification-filter-tabs flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          className={`btn btn-xs ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`btn btn-xs ${activeFilter === 'unread' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`btn btn-xs ${activeFilter === 'matches' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('matches')}
        >
          Likes & Matches
        </button>
        <button
          className={`btn btn-xs ${activeFilter === 'messages' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveFilter('messages')}
        >
          Messages
        </button>
      </div>

      {/* Notification List Card */}
      <div className="notifications-card-box">
        {loading ? (
          <div className="p-4 space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={activeFilter === 'all' ? 'All Caught Up!' : 'No Notifications Here'}
            description={
              activeFilter === 'unread'
                ? 'You have read all of your notifications.'
                : 'When students like you, match, send messages, or interact with your campus activities, updates will appear here.'
            }
          />
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map((item) => {
              const action = getActionLink(item);
              const sender = item.sender;
              const senderAvatar = item.senderProfile?.avatar;

              return (
                <div
                  key={item._id}
                  className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
                  onClick={() => !item.isRead && handleMarkOneRead(item._id)}
                >
                  {/* Left Icon / Avatar */}
                  <div className="notification-icon-wrapper">
                    {senderAvatar ? (
                      <img
                        src={senderAvatar}
                        alt={sender?.firstName || 'Student'}
                        className="notification-avatar-img"
                      />
                    ) : (
                      <div className="notification-icon">
                        {getNotificationIcon(item.type)}
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="notification-body">
                    <div className="notification-header-line flex items-center justify-between gap-2">
                      <div className="notification-title flex items-center gap-2">
                        {item.title}
                        {!item.isRead && <span className="unread-dot" />}
                      </div>
                      <div className="notification-time text-xs text-muted">
                        <Clock size={11} className="inline mr-1" />
                        {new Date(item.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <p className="notification-message mt-1">{item.message}</p>

                    {item.senderProfile?.program && (
                      <span className="text-xs text-muted block mt-1">
                        <GraduationCap size={12} className="inline-block align-text-bottom mr-1" aria-hidden="true" />
                        {item.senderProfile.program}
                      </span>
                    )}

                    {/* Action Link & Item Controls */}
                    <div className="notification-actions-row flex items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                      <div>
                        {action && (
                          <Link
                            to={action.url}
                            className="btn btn-xs btn-primary inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {action.label} <ArrowRight size={12} />
                          </Link>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!item.isRead && (
                          <button
                            className="btn-icon-subtle text-xs"
                            title="Mark as read"
                            onClick={(e) => handleMarkOneRead(item._id, e)}
                          >
                            <Check size={14} className="text-primary" />
                          </button>
                        )}
                        <button
                          className="btn-icon-subtle text-xs"
                          title="Delete notification"
                          onClick={(e) => handleDelete(item._id, e)}
                        >
                          <Trash2 size={14} className="text-muted hover:text-danger" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
