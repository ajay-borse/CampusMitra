import apiClient from './axiosClient';

export const adminApi = {
  getMetrics: () => apiClient.get('/api/admin/metrics'),
  getUsers: (search = '') => apiClient.get('/api/admin/users', { params: { search } }),
  updateUserStatus: (id, isBanned, reason) =>
    apiClient.put(`/api/admin/users/${id}/status`, { isBanned, reason }),
  getReports: () => apiClient.get('/api/admin/reports'),
  resolveReport: (id, status, adminNotes) =>
    apiClient.put(`/api/admin/reports/${id}`, { status, adminNotes }),
  getAuditLogs: () => apiClient.get('/api/admin/audit-logs'),
  getVerifications: (status) => apiClient.get('/api/admin/verifications', { params: { status } }),
  reviewVerification: (id, payload) => apiClient.put(`/api/admin/verifications/${id}`, payload),
  getVerificationDocumentUrl: (id) => {
    const token = localStorage.getItem('campusmitra_token') || '';
    return `/api/admin/verifications/${id}/document?token=${encodeURIComponent(token)}`;
  },
};
