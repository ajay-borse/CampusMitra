import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both university email and password.');
      return;
    }

    if (!email.toLowerCase().endsWith('@mitwpu.edu.in')) {
      setError('CampusMitra requires an official university email (@mitwpu.edu.in).');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.profile && result.profile.isOnboarded === false) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError(result.message || 'Login failed. Please check credentials.');
    }
  };

  const prefillAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <GraduationCap size={28} className="text-primary" />
          </div>
          <h2 className="auth-title">Welcome Back to Campus</h2>
          <p className="auth-subtitle">
            Enter your university credentials to connect with peers.
          </p>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              University Email
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="firstname.lastname@mitwpu.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <span className="form-hint">Must end with @mitwpu.edu.in</span>
          </div>

          <div className="form-group">
            <div className="flex justify-between items-center mb-1">
              <label className="form-label mb-0" htmlFor="password">
                Password
              </label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block mt-4"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to CampusMitra'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Test Accounts Quick Fill */}
        <div className="demo-accounts-box">
          <div className="demo-accounts-title">
            <Sparkles size={14} className="text-secondary" />
            <span>Quick Test Accounts (Database Seed):</span>
          </div>
          <div className="demo-badges">
            <button
              type="button"
              className="demo-badge"
              onClick={() => prefillAccount('priya.test@mitwpu.edu.in', 'password123')}
            >
              👩‍💻 Priya Verma (B.Tech CSE)
            </button>
            <button
              type="button"
              className="demo-badge"
              onClick={() => prefillAccount('aditya.test@mitwpu.edu.in', 'password123')}
            >
              👨‍🎓 Aditya Kulkarni (MCA)
            </button>
            <button
              type="button"
              className="demo-badge"
              onClick={() => prefillAccount('admin.moderator@mitwpu.edu.in', 'adminpassword123')}
            >
              🛡️ Admin Moderator
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <span>Don't have an account yet? </span>
          <Link to="/register" className="auth-link">
            Register with @mitwpu.edu.in
          </Link>
        </div>
      </div>
    </div>
  );
}
