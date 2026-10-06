import { useState, useEffect } from 'react';
import { adminApi } from '../services/campusApi';

/**
 * AdminView Component
 * Dedicated administration and safety console.
 * Displays real MongoDB metrics, user moderation, reports review, and audit logs.
 */
export default function AdminView({ onToast }) {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState('metrics'); // 'metrics' | 'users' | 'reports' | 'logs'
  const [isLoading, setIsLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, usersRes, reportsRes, logsRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getUsers(searchUser),
        adminApi.getReports(),
        adminApi.getAuditLogs(),
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (reportsRes.success) setReports(reportsRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      onToast(err.message || 'Failed to fetch administrative metrics.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [searchUser]);

  const handleToggleBan = async (user) => {
    const action = user.isBanned ? 'unban' : 'ban';
    const confirmMsg = `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await adminApi.updateUserStatus(
        user._id,
        !user.isBanned,
        'Moderator initiated status change'
      );
      if (res.success) {
        onToast(`User status updated to ${user.isBanned ? 'Active' : 'Suspended'}`, 'success');
        loadAdminData();
      }
    } catch (err) {
      onToast(err.message || 'Moderation action failed', 'error');
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      const res = await adminApi.resolveReport(reportId, status, 'Reviewed by administrator');
      if (res.success) {
        onToast(`Report marked as ${status}`, 'success');
        loadAdminData();
      }
    } catch (err) {
      onToast(err.message || 'Report update failed', 'error');
    }
  };

  return (
    <div className="page-view admin-view animate-fade-in">
      <div className="page-header-block">
        <div>
          <h1 className="page-main-title">🛡️ Campus Safety & Admin Console</h1>
          <p className="page-subtitle">Real-time database analytics, moderation, and security audit log</p>
        </div>

        <div className="subtab-pills">
          <button
            type="button"
            className={`subtab-btn ${activeAdminTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('metrics')}
          >
            📊 Live Metrics
          </button>
          <button
            type="button"
            className={`subtab-btn ${activeAdminTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('users')}
          >
            👥 User Accounts ({users.length})
          </button>
          <button
            type="button"
            className={`subtab-btn ${activeAdminTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('reports')}
          >
            ⚠️ Reports ({reports.length})
          </button>
          <button
            type="button"
            className={`subtab-btn ${activeAdminTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveAdminTab('logs')}
          >
            📋 Audit Logs
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="state-container loading-state">
          <div className="spinner" />
          <p>Querying real MongoDB records...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Real Aggregate Metrics */}
          {activeAdminTab === 'metrics' && metrics && (
            <div className="admin-metrics-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap icon-purple"><span>👥</span></div>
                <div className="stat-info">
                  <span className="stat-number">{metrics.totalUsers}</span>
                  <span className="stat-label">Total Registered Students</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-emerald"><span>✓</span></div>
                <div className="stat-info">
                  <span className="stat-number">{metrics.verifiedUsers}</span>
                  <span className="stat-label">Verified University Emails</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-pink"><span>💫</span></div>
                <div className="stat-info">
                  <span className="stat-number">{metrics.mutualMatches}</span>
                  <span className="stat-label">Mutual Matches Formed</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-blue"><span>💬</span></div>
                <div className="stat-info">
                  <span className="stat-number">{metrics.totalMessages}</span>
                  <span className="stat-label">Total Messages Sent</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-purple"><span>📷</span></div>
                <div className="stat-info">
                  <span className="stat-number">{metrics.completedProfiles}</span>
                  <span className="stat-label">Complete 6-Photo Profiles</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap icon-pink"><span>⚠️</span></div>
                <div className="stat-info">
                  <span className="stat-number">{metrics.pendingReports}</span>
                  <span className="stat-label">Pending Safety Reports</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Real Users Directory */}
          {activeAdminTab === 'users' && (
            <div className="card">
              <div className="list-toolbar">
                <h3 className="card-title">Registered Students (MongoDB)</h3>
                <div className="search-box">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name or email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-responsive">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Verified</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>{u.firstName} {u.lastName}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-neutral'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>{u.isVerified ? '✅ Yes' : '⏳ Pending'}</td>
                        <td>
                          <span className={`badge ${u.isBanned ? 'badge-danger' : 'badge-success'}`}>
                            {u.isBanned ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td>
                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              className={`btn-action ${u.isBanned ? 'btn-edit' : 'btn-delete'}`}
                              onClick={() => handleToggleBan(u)}
                            >
                              {u.isBanned ? 'Re-activate' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Real Reports */}
          {activeAdminTab === 'reports' && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>
                Safety & Moderation Reports
              </h3>
              {reports.length === 0 ? (
                <div className="state-container empty-state">
                  <span>🛡️</span>
                  <h3>No reports on file</h3>
                  <p>Campus safety queue is clear!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Reporter</th>
                        <th>Reported Student</th>
                        <th>Reason</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r._id}>
                          <td>{r.reporter ? `${r.reporter.firstName} (${r.reporter.email})` : 'Anonymous'}</td>
                          <td>{r.reportedUser ? `${r.reportedUser.firstName} (${r.reportedUser.email})` : 'N/A'}</td>
                          <td><strong>{r.reason}</strong></td>
                          <td>{r.description || 'No description provided'}</td>
                          <td>
                            <span className={`badge ${r.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            {r.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  className="btn-action btn-edit"
                                  onClick={() => handleResolveReport(r._id, 'resolved')}
                                >
                                  Resolve
                                </button>
                                <button
                                  type="button"
                                  className="btn-action btn-delete"
                                  onClick={() => handleResolveReport(r._id, 'dismissed')}
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Real Audit Logs */}
          {activeAdminTab === 'logs' && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>
                Security & Administrative Audit Log
              </h3>
              <div className="table-responsive">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id}>
                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                        <td>{log.admin ? `${log.admin.firstName} (${log.admin.email})` : 'System'}</td>
                        <td><code>{log.action}</code></td>
                        <td>{log.targetUser ? `${log.targetUser.firstName} (${log.targetUser.email})` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
