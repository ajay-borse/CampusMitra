import apiClient from './axiosClient';

const API_BASE = '/api/pulse';

export const pulseApi = {
  // Get personalized or filtered feed
  getFeed: (params = {}) => apiClient.get(API_BASE, { params }),

  // Create post (text, media, category, optional poll, circleId, planId)
  createPost: (postData) => apiClient.post(API_BASE, postData),

  // Get single post by ID
  getPostById: (id) => apiClient.get(`${API_BASE}/${id}`),

  // Update post (Author only)
  updatePost: (id, data) => apiClient.put(`${API_BASE}/${id}`, data),

  // Delete post (Author or Mod)
  deletePost: (id) => apiClient.delete(`${API_BASE}/${id}`),

  // Toggle Like (Duplicate-safe)
  toggleLike: (id) => apiClient.post(`${API_BASE}/${id}/like`, {}),

  // Toggle Bookmark (Duplicate-safe)
  toggleBookmark: (id) => apiClient.post(`${API_BASE}/${id}/bookmark`, {}),

  // Vote in Poll (1-vote strict)
  votePoll: (id, optionIndex) =>
    apiClient.post(`${API_BASE}/${id}/vote`, { optionIndex }),

  // Add Comment
  addComment: (id, text) =>
    apiClient.post(`${API_BASE}/${id}/comments`, { text }),

  // Delete Comment
  deleteComment: (id, commentId) =>
    apiClient.delete(`${API_BASE}/${id}/comments/${commentId}`),
};
