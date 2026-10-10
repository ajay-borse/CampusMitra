import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CampusMitra ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">
              <AlertCircle size={36} className="text-danger" />
            </div>
            <h2 className="error-boundary-title">Something went wrong</h2>
            <p className="error-boundary-desc">
              CampusMitra ran into an unexpected rendering error. Your account data and progress remain safe.
            </p>
            <div className="error-boundary-actions">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary"
              >
                <RefreshCw size={16} className="mr-2" /> Reload Page
              </button>
              <a href="/dashboard" className="btn btn-secondary">
                <Home size={16} className="mr-2" /> Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
