import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Sparkles, MessageSquare, Clock } from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      if (res?.success) {
        setNotifications(res.data || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setMarking(true);
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to mark as read', 'error');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="notifications-page-container">
      <div className="page-header-row mb-4">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Bell className="text-primary" /> Campus Notifications
          </h2>
          <p className="page-subtitle">
            Stay updated with mutual matches, connection invites, and chat activity.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            className="btn btn-outline btn-sm flex items-center gap-2"
            onClick={handleMarkAllRead}
            disabled={marking}
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      <div className="notifications-card-box">
        {loading ? (
          <div className="p-4 space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="All Caught Up!"
            description="You have no notifications right now. When students match or interact with you, alerts will appear here."
          />
        ) : (
          <div className="notifications-list">
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
              >
                <div className="notification-icon">
                  {item.type === 'match' ? (
                    <Sparkles size={18} className="text-secondary" />
                  ) : (
                    <MessageSquare size={18} className="text-primary" />
                  )}
                </div>

                <div className="notification-body">
                  <div className="notification-title">{item.title}</div>
                  <p className="notification-message">{item.message}</p>
                  <div className="notification-time">
                    <Clock size={12} className="inline mr-1" />
                    {new Date(item.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {item.data?.conversationId && (
                  <Link
                    to={`/chat?conv=${item.data.conversationId}`}
                    className="btn btn-xs btn-outline self-center"
                  >
                    Open Chat
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
