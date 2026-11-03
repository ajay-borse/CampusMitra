export function CardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-subtitle"></div>
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-chips">
          <div className="skeleton-chip"></div>
          <div className="skeleton-chip"></div>
          <div className="skeleton-chip"></div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="skeleton-row">
      <td><div className="skeleton-line w-40"></div></td>
      <td><div className="skeleton-line w-60"></div></td>
      <td><div className="skeleton-line w-30"></div></td>
      <td><div className="skeleton-line w-20"></div></td>
      <td><div className="skeleton-line w-20"></div></td>
    </tr>
  );
}

export function ChatListSkeleton() {
  return (
    <div className="skeleton-chat-list">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-chat-item">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-chat-meta">
            <div className="skeleton-line w-30"></div>
            <div className="skeleton-line w-60"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
