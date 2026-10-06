import { Link } from 'react-router-dom';
import {
  Compass,
  Users,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-secondary" />
            <span>Built Exclusively for MIT-WPU Students</span>
          </div>
          <h1 className="hero-title">
            Find Your People. <br />
            <span className="gradient-text">Find Your Vibe.</span>
          </h1>
          <p className="hero-lead">
            Connect with campus peers over shared hackathons, academic coding projects,
            study groups, and college life. Verified by university email.
          </p>

          <div className="hero-cta-group">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Campus Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Join CampusMitra <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  Student Log In
                </Link>
              </>
            )}
            <Link to="/directory" className="btn btn-ghost btn-lg">
              <BookOpen size={18} /> View Student Directory CRUD
            </Link>
          </div>

          <div className="hero-stats-row">
            <div className="stat-pill">
              <ShieldCheck size={16} className="text-success" />
              <span>Strict <strong>@mitwpu.edu.in</strong> Verification</span>
            </div>
            <div className="stat-pill">
              <Cpu size={16} className="text-accent" />
              <span>Real-Time <strong>Socket.IO</strong> Messenger</span>
            </div>
            <div className="stat-pill">
              <Database size={16} className="text-info" />
              <span>Live <strong>MongoDB & In-Memory</strong> Hybrid</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Built for Modern Campus Life</h2>
          <p className="section-subtitle">
            Zero fake profiles. Zero unsolicited spam. Real university connections.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon bg-violet">
              <Compass size={24} />
            </div>
            <h3 className="feature-title">Smart Academic Discovery</h3>
            <p className="feature-desc">
              Discover peers based on taxonomy-matched interests, programming languages,
              academic department, and graduation year with 0-100% compatibility.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-pink">
              <Users size={24} />
            </div>
            <h3 className="feature-title">Mutual Interest Matching</h3>
            <p className="feature-desc">
              No unsolicited messages. Conversations unlock only when both students express
              reciprocal interest in connecting or studying together.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-blue">
              <MessageSquare size={24} />
            </div>
            <h3 className="feature-title">Live Real-Time Messenger</h3>
            <p className="feature-desc">
              Lightning-fast Socket.IO chat with typing indicators, active presence,
              and quick campus prompts like "Chai break? ☕" or "Hackathon prep 🚀".
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-emerald">
              <BookOpen size={24} />
            </div>
            <h3 className="feature-title">Student Directory CRUD</h3>
            <p className="feature-desc">
              A comprehensive student registry with Create, Read, Update, Delete, live search,
              and instant in-memory fallback for technical viva demonstrations.
            </p>
          </div>
        </div>
      </section>

      {/* Direct Callout Banner */}
      <section className="callout-section">
        <div className="callout-card">
          <div className="callout-text">
            <h2>Ready to see who's building and studying on campus?</h2>
            <p>Join fellow B.Tech, MCA, and MBA tech students on CampusMitra today.</p>
          </div>
          <div className="callout-actions">
            <Link to="/register" className="btn btn-primary">
              Create Student Account
            </Link>
            <Link to="/directory" className="btn btn-secondary">
              Explore Directory First
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
