export default function EmptyState({
  icon = '🔍',
  title = 'No records found',
  description = 'Try adjusting your search criteria or check back later.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">{icon}</div>
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
