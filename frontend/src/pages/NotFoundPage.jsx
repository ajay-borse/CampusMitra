import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="not-found-container">
      <div className="not-found-card text-center">
        <div className="not-found-icon">🎓 404</div>
        <h2 className="not-found-title">Page Not Found</h2>
        <p className="not-found-desc">
          The campus path you're looking for doesn't exist or has moved.
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <Link to="/dashboard" className="btn btn-primary flex items-center gap-2">
            <Compass size={16} /> Campus Dashboard
          </Link>
          <Link to="/" className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
