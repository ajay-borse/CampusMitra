import apiClient from './axiosClient';

const API_BASE = '/api/radar';

export const radarApi = {
  // Fetch consolidated Campus Radar feed
  getFeed: (params = {}) => apiClient.get(`${API_BASE}/feed`, { params }),

  // Get current user availability
  getMyAvailability: () => apiClient.get(`${API_BASE}/availability/me`),

  // Enable or update current user availability
  updateAvailability: (data) => apiClient.put(`${API_BASE}/availability/me`, data),

  // Disable current user availability
  disableAvailability: () => apiClient.post(`${API_BASE}/availability/disable`, {}),
};
