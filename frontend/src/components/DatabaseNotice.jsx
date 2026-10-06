import { AlertTriangle, Database, RefreshCw } from 'lucide-react';

export default function DatabaseNotice({ onRetry }) {
  return (
    <div className="db-notice-banner">
      <div className="db-notice-content">
        <div className="db-notice-icon">
          <Database size={20} className="pulse-icon" />
        </div>
        <div className="db-notice-text">
          <strong>MongoDB Service Waiting for Connection:</strong> Social discovery & user authentication require an active database connection. 
          The <span className="highlight-pill">Student Directory CRUD</span> is operating smoothly via the in-memory fallback.
        </div>
      </div>
      <div className="db-notice-actions">
        {onRetry && (
          <button className="btn btn-sm btn-outline" onClick={onRetry}>
            <RefreshCw size={14} /> Retry Connection
          </button>
        )}
        <a 
          href="https://www.mongodb.com/atlas" 
          target="_blank" 
          rel="noreferrer" 
          className="btn btn-sm btn-ghost"
        >
          Setup MongoDB Atlas
        </a>
      </div>
    </div>
  );
}
