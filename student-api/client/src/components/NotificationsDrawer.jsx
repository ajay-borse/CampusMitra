/**
 * NotificationsDrawer Component
 * Slide-out drawer displaying real MongoDB campus notifications:
 * - Mutual match alerts 💫
 * - Profile interest alerts 💜
 * - Message alerts 💬
 * - System updates 📢
 */
export default function NotificationsDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
  onNavigate,
}) {
  if (!isOpen) return null;

  const getIconForType = (type) => {
    switch (type) {
      case 'match':
        return '💫';
      case 'interest':
        return '💜';
      case 'message':
        return '💬';
      case 'system':
      default:
        return '🔔';
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  return (
    <div className="drawer-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="drawer-panel animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div className="drawer-title-row">
            <span className="drawer-bell-icon">🔔</span>
            <h2 className="drawer-title">Campus Notifications</h2>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="drawer-subhead">
          <span className="drawer-count">
            {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn-link-action"
              onClick={onMarkAllRead}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="drawer-list">
          {notifications.length > 0 ? (
            notifications.map((item) => {
              const isUnread = !item.isRead && !item.read;
              return (
                <div
                  key={item._id || item.id}
                  className={`notification-item ${isUnread ? 'is-unread' : 'is-read'} animate-scale-in`}
                  onClick={() => {
                    if (item.type === 'match' || item.type === 'interest') onNavigate('connections');
                    if (item.type === 'message') onNavigate('chat');
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="notif-icon-badge">{item.icon || getIconForType(item.type)}</span>
                  <div className="notif-body">
                    <h4 className="notif-title">{item.title}</h4>
                    <p className="notif-desc">{item.message || item.description}</p>
                    <span className="notif-time">{formatRelativeTime(item.createdAt || item.time)}</span>
                  </div>
                  {isUnread && <span className="notif-unread-dot" />}
                </div>
              );
            })
          ) : (
            <div className="empty-notif-state">
              <span className="empty-notif-icon">🔔</span>
              <h3>You're all caught up</h3>
              <p>No new campus alerts right now. Keep exploring profiles!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
