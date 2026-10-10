import apiClient from './axiosClient';

const API_BASE = '/api/plans';

export const planApi = {
  // Discover plans with filters
  getPlans: (params = {}) => apiClient.get(API_BASE, { params }),

  // Get plan details
  getPlanById: (id) => apiClient.get(`${API_BASE}/${id}`),

  // Create new plan
  createPlan: (planData) => apiClient.post(API_BASE, planData),

  // Join a plan
  joinPlan: (id) => apiClient.post(`${API_BASE}/${id}/join`, {}),

  // Leave a plan
  leavePlan: (id) => apiClient.post(`${API_BASE}/${id}/leave`, {}),

  // Update a plan (Creator only)
  updatePlan: (id, data) => apiClient.put(`${API_BASE}/${id}`, data),

  // Cancel a plan (Creator only)
  cancelPlan: (id) => apiClient.post(`${API_BASE}/${id}/cancel`, {}),

  // Remove participant (Creator only)
  removeParticipant: (id, targetUserId) =>
    apiClient.post(`${API_BASE}/${id}/remove-participant`, { targetUserId }),
};
