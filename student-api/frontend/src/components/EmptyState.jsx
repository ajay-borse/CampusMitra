import {
  Search,
  ShieldAlert,
  CreditCard,
  Sparkles,
  MessageCircle,
  Bell,
  GraduationCap,
  HeartHandshake,
  Inbox,
  Compass,
  Users,
} from 'lucide-react';

const ICON_MAP = {
  '🔍': Search,
  '🔎': Search,
  '🛡️': ShieldAlert,
  '🪪': CreditCard,
  '💫': Sparkles,
  '✨': Sparkles,
  '💬': MessageCircle,
  '🔔': Bell,
  '🎓': GraduationCap,
  '💜': HeartHandshake,
  '🤝': HeartHandshake,
  '🌈': Compass,
  '👥': Users,
};

export default function EmptyState({
  icon = '🔍',
  title = 'No records found',
  description = 'Try adjusting your search criteria or check back later.',
  actionLabel,
  onAction,
}) {
  const Icon = typeof icon === 'function' ? icon : ICON_MAP[icon] || Inbox;

  return (
    <div className="empty-state-box">
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={30} strokeWidth={1.8} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm mt-3" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
