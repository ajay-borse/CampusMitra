import { useState } from 'react';
import { authApi } from '../services/campusApi';

/**
 * AuthModal Component
 * Full-featured Login & Registration dialog.
 * Enforces university email rules (@mitwpu.edu.in) and DOB inputs.
 */
export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '2004-01-01',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [devVerificationUrl, setDevVerificationUrl] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const isEmailUniversity = formData.email.trim().toLowerCase().endsWith('@mitwpu.edu.in');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!isEmailUniversity) {
          throw new Error('Email must end with @mitwpu.edu.in');
        }

        const res = await authApi.register({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          dateOfBirth: formData.dateOfBirth,
        });

        if (res.success && res.data) {
          localStorage.setItem('campusmitra_token', res.data.token);
          if (res.data.verificationUrl) {
            setDevVerificationUrl(res.data.verificationUrl);
          }
          onAuthSuccess(res.data.user, res.data.profile);
        }
      } else {
        const res = await authApi.login({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });

        if (res.success && res.data) {
          localStorage.setItem('campusmitra_token', res.data.token);
          onAuthSuccess(res.data.user, res.data.profile);
        }
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      setErrorMessage(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for development testing
  const handleQuickFill = (type) => {
    if (type === 'new') {
      const id = Math.floor(Math.random() * 900) + 100;
      setFormData({
        firstName: 'Ajay',
        lastName: 'Borse',
        email: `ajay.student${id}@mitwpu.edu.in`,
        password: 'password123',
        dateOfBirth: '2003-09-15',
      });
      setMode('register');
    } else if (type === 'testPriya') {
      setFormData({
        firstName: 'Priya',
        lastName: 'Verma',
        email: 'priya.test@mitwpu.edu.in',
        password: 'password123',
        dateOfBirth: '2004-05-14',
      });
      setMode('login');
    } else if (type === 'admin') {
      setFormData({
        firstName: 'Admin',
        lastName: 'Moderator',
        email: 'admin.moderator@mitwpu.edu.in',
        password: 'adminpassword123',
        dateOfBirth: '2000-01-01',
      });
      setMode('login');
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">🎓</span>
            <div>
              <h2 className="modal-title">
                {mode === 'login' ? 'Welcome Back to CampusMitra' : 'Create Student Account'}
              </h2>
              <p className="modal-subtitle">
                {mode === 'login'
                  ? 'Log in with your university credentials'
                  : 'Restricted to @mitwpu.edu.in student emails'}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMessage(''); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErrorMessage(''); }}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-error" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Dev Verification Callout */}
        {devVerificationUrl && (
          <div className="alert alert-info" role="status" style={{ margin: '1rem 1.5rem 0' }}>
            <span>
              ℹ️ Development Verification Link generated: <code>{devVerificationUrl}</code>
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {mode === 'register' && (
              <div className="form-grid" style={{ marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="auth-firstname">
                    First Name <span className="required">*</span>
                  </label>
                  <input
                    id="auth-firstname"
                    type="text"
                    name="firstName"
                    className="form-input"
                    placeholder="e.g. Ajay"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="auth-lastname">
                    Last Name <span className="required">*</span>
                  </label>
                  <input
                    id="auth-lastname"
                    type="text"
                    name="lastName"
                    className="form-input"
                    placeholder="e.g. Sharma"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label" htmlFor="auth-email">
                  University Email <span className="required">*</span>
                </label>
                {formData.email && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isEmailUniversity ? '#34d399' : '#f87171',
                    }}
                  >
                    {isEmailUniversity ? '✓ Valid @mitwpu.edu.in' : 'Must end with @mitwpu.edu.in'}
                  </span>
                )}
              </div>
              <input
                id="auth-email"
                type="email"
                name="email"
                className="form-input"
                placeholder="your.name@mitwpu.edu.in"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="auth-password">
                Password <span className="required">*</span>
              </label>
              <input
                id="auth-password"
                type="password"
                name="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Date of Birth for age safety calculations */}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-dob">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  id="auth-dob"
                  type="date"
                  name="dateOfBirth"
                  className="form-input"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Used to verify age eligibility (18+ required for romantic dating features).
                </span>
              </div>
            )}

            {/* Dev Quick-Fill Options */}
            <div className="auth-quick-fill-bar">
              <span className="quick-label">⚡ Dev Quick Fill:</span>
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleQuickFill('new')}
              >
                + New Student
              </button>
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleQuickFill('testPriya')}
              >
                Priya [Test]
              </button>
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleQuickFill('admin')}
              >
                Admin [Test]
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-glow"
              disabled={isLoading}
              id="auth-submit-btn"
            >
              {isLoading
                ? 'Processing...'
                : mode === 'login'
                ? 'Log In to Campus'
                : 'Create Account ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
