import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate age for client-side feedback
  const computedAge = formData.dateOfBirth
    ? Math.floor(
        (new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.dateOfBirth
    ) {
      setError('All fields are required.');
      return;
    }

    if (!formData.email.toLowerCase().endsWith('@mitwpu.edu.in')) {
      setError('Registration is strictly restricted to university emails (@mitwpu.edu.in).');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const res = await register(formData);
    setLoading(false);

    if (res.success) {
      navigate('/onboarding');
    } else {
      setError(res.message || 'Registration failed. Please check form data.');
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card max-w-lg">
        <div className="auth-header">
          <div className="auth-icon-badge">
            <GraduationCap size={28} className="text-primary" />
          </div>
          <h2 className="auth-title">Join CampusMitra</h2>
          <p className="auth-subtitle">
            Create your student profile and find your university network.
          </p>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label" htmlFor="firstName">
                First Name
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Aarav"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group flex-1">
              <label className="form-label" htmlFor="lastName">
                Last Name
              </label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Joshi"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              University Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                placeholder="yourname.std@mitwpu.edu.in"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <span className="form-hint">Domain must be @mitwpu.edu.in</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dateOfBirth">
              Date of Birth (Campus Safety Requirement)
            </label>
            <div className="input-with-icon">
              <Calendar size={18} className="input-icon" />
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                className="form-control"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            {computedAge !== null && !isNaN(computedAge) && (
              <div className="mt-2">
                {computedAge >= 18 ? (
                  <span className="badge badge-success flex items-center gap-1">
                    <CheckCircle size={14} /> Age {computedAge}: Eligible for Dating & Study Circles
                  </span>
                ) : (
                  <span className="badge badge-warning flex items-center gap-1">
                    <ShieldAlert size={14} /> Age {computedAge}: Safeguarded to Study & Friendship Circles
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block mt-4"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer">
          <span>Already registered with your university email? </span>
          <Link to="/login" className="auth-link">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
