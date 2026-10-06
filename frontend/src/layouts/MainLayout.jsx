import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DatabaseNotice from '../components/DatabaseNotice';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { isDBUnavailable, refreshUser } = useAuth();

  return (
    <div className="app-shell">
      <Navbar />
      {isDBUnavailable && <DatabaseNotice onRetry={refreshUser} />}
      <main className="main-viewport">
        <Outlet />
      </main>
      <footer className="footer-bar">
        <div className="footer-inner">
          <div className="footer-copy">
            <span>🎓 <strong>CampusMitra</strong> &mdash; Find Your People. Find Your Vibe.</span>
            <span className="text-muted text-xs ml-2">
              (Independent Student Project &bull; Not an official MIT-WPU service)
            </span>
          </div>
          <div className="footer-links">
            <span className="text-xs text-muted">Node.js Express &bull; MongoDB &bull; Socket.IO &bull; React 19</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
