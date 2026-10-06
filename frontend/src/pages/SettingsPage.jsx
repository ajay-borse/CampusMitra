import { useState } from 'react';
import { Settings, Shield, Database, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import apiClient from '../api/axiosClient';

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { isConnected } = useSocket();
  const { showToast } = useToast();

  const [backendHealth, setBackendHealth] = useState(null);
  const [testingHealth, setTestingHealth] = useState(false);

  const checkHealth = async () => {
    try {
      setTestingHealth(true);
      const res = await apiClient.get('/');
      setBackendHealth(res);
      showToast('Backend health check completed', 'info');
    } catch (err) {
      setBackendHealth({ status: 'Error', message: err.message });
      showToast('Backend check failed', 'error');
    } finally {
      setTestingHealth(false);
    }
  };

  return (
    <div className="settings-page-container">
      <div className="page-header-row mb-4">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Settings className="text-primary" /> Account & System Settings
          </h2>
          <p className="page-subtitle">
            Manage your account preferences, university verification, and system status.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Account Info */}
        <div className="section-card">
          <h3 className="section-card-title mb-3">University Profile Credentials</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-subtle">
              <span className="text-muted">Student Name</span>
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-subtle">
              <span className="text-muted">Institutional Email</span>
              <span className="font-mono text-xs">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-subtle">
              <span className="text-muted">Account Tier</span>
              <span className="badge badge-accent capitalize">{user?.role || 'student'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-subtle">
              <span className="text-muted">Domain Verification</span>
              <span className="text-success flex items-center gap-1 font-medium text-xs">
                <CheckCircle2 size={14} /> @mitwpu.edu.in Verified
              </span>
            </div>
          </div>
        </div>

        {/* System & Architecture Diagnostics */}
        <div className="section-card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="section-card-title flex items-center gap-2">
              <Database size={18} className="text-info" /> Platform Diagnostics
            </h3>
            <button
              className="btn btn-xs btn-outline"
              onClick={checkHealth}
              disabled={testingHealth}
            >
              <RefreshCw size={13} /> {testingHealth ? 'Pinging...' : 'Ping Backend'}
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-subtle">
              <span className="text-muted">Backend Service</span>
              <span className="font-mono text-xs text-primary">
                {import.meta.env.VITE_API_URL || 'http://localhost:5000'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-subtle">
              <span className="text-muted">Socket.IO State</span>
              <span className={isConnected ? 'text-success font-medium' : 'text-warning font-medium'}>
                {isConnected ? '🟢 Connected (Real-time)' : '⚪ Disconnected / Polling'}
              </span>
            </div>
            {backendHealth && (
              <div className="p-3 bg-subtle rounded text-xs font-mono">
                <div>Status: {backendHealth.status}</div>
                <div>Database: {backendHealth.database}</div>
                <div>Message: {backendHealth.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="section-card border-danger-subtle">
          <h3 className="section-card-title text-danger mb-2">Session Control</h3>
          <p className="text-xs text-muted mb-4">
            Sign out of your active session on this device.
          </p>
          <button
            className="btn btn-danger btn-sm flex items-center gap-2"
            onClick={logout}
          >
            <LogOut size={16} /> Sign Out of CampusMitra
          </button>
        </div>
      </div>
    </div>
  );
}
