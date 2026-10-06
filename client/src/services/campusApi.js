/**
 * CampusMitra Unified REST API Client
 * Manages JWT authorization tokens and communicates with all backend endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth headers
const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('campusmitra_token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic request wrapper
async function request(endpoint, options = {}) {
  const isMultipart = options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...getHeaders(isMultipart),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ==========================================
// Authentication APIs
// ==========================================
export const authApi = {
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request('/auth/me'),

  verifyEmail: (token) => request(`/auth/verify-email/${token}`),
};

// ==========================================
// Profile & 6 Photos APIs
// ==========================================
export const profileApi = {
  getMyProfile: () => request('/profiles/me'),

  updateProfile: (payload) =>
    request('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return request('/profiles/me/photos', {
      method: 'POST',
      body: formData,
    });
  },

  deletePhoto: (photoIndex) =>
    request('/profiles/me/photos', {
      method: 'DELETE',
      body: JSON.stringify({ photoIndex }),
    }),

  reorderPhotos: (photos) =>
    request('/profiles/me/photos/reorder', {
      method: 'PUT',
      body: JSON.stringify({ photos }),
    }),
};

// ==========================================
// Discover & Matching APIs
// ==========================================
export const discoverApi = {
  getProfiles: () => request('/discover'),
};

// ==========================================
// Connections & Swiping APIs
// ==========================================
export const connectionApi = {
  sendInterest: (targetUserId) =>
    request('/connections/interest', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),

  sendPass: (targetUserId) =>
    request('/connections/pass', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),

  getConnections: () => request('/connections'),
};

// ==========================================
// Conversations & Chat APIs
// ==========================================
export const chatApi = {
  getConversations: () => request('/conversations'),

  getMessages: (conversationId) =>
    request(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId, text) =>
    request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};

// ==========================================
// Notifications APIs
// ==========================================
export const notificationApi = {
  getNotifications: () => request('/notifications'),

  markAllRead: () =>
    request('/notifications/read-all', {
      method: 'PUT',
    }),
};

// ==========================================
// Moderation (Block & Report) APIs
// ==========================================
export const moderationApi = {
  blockUser: (targetUserId, reason) =>
    request('/moderation/blocks', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, reason }),
    }),

  reportUser: (reportedUserId, reason, description) =>
    request('/moderation/reports', {
      method: 'POST',
      body: JSON.stringify({ reportedUserId, reason, description }),
    }),
};

// ==========================================
// Admin APIs
// ==========================================
export const adminApi = {
  getMetrics: () => request('/admin/metrics'),

  getUsers: (search = '') => request(`/admin/users?search=${encodeURIComponent(search)}`),

  updateUserStatus: (userId, isBanned, reason) =>
    request(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isBanned, reason }),
    }),

  getReports: () => request('/admin/reports'),

  resolveReport: (reportId, status, adminNotes) =>
    request(`/admin/reports/${reportId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    }),

  getAuditLogs: () => request('/admin/audit-logs'),
};
