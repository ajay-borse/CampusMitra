import apiClient from './axiosClient';

const API_BASE = '/api/circles';

export const circleApi = {
  // Discover and filter circles
  getCircles: (params = {}) => apiClient.get(API_BASE, { params }),

  // Get circle details by ID
  getCircleById: (id) => apiClient.get(`${API_BASE}/${id}`),

  // Create circle
  createCircle: (circleData) => apiClient.post(API_BASE, circleData),

  // Join circle
  joinCircle: (id) => apiClient.post(`${API_BASE}/${id}/join`, {}),

  // Leave circle
  leaveCircle: (id) => apiClient.post(`${API_BASE}/${id}/leave`, {}),

  // Update circle details
  updateCircle: (id, data) => apiClient.put(`${API_BASE}/${id}`, data),

  // Archive circle
  archiveCircle: (id) => apiClient.post(`${API_BASE}/${id}/archive`, {}),

  // Remove member
  removeMember: (id, targetUserId) =>
    apiClient.post(`${API_BASE}/${id}/remove-member`, { targetUserId }),

  // Feed: get posts
  getCirclePosts: (circleId, params = {}) =>
    apiClient.get(`${API_BASE}/${circleId}/posts`, { params }),

  // Feed: create post
  createCirclePost: (circleId, postData) =>
    apiClient.post(`${API_BASE}/${circleId}/posts`, postData),

  // Feed: edit post
  updateCirclePost: (circleId, postId, postData) =>
    apiClient.put(`${API_BASE}/${circleId}/posts/${postId}`, postData),

  // Feed: delete post
  deleteCirclePost: (circleId, postId) =>
    apiClient.delete(`${API_BASE}/${circleId}/posts/${postId}`),

  // Feed: toggle reaction
  toggleReaction: (circleId, postId) =>
    apiClient.post(`${API_BASE}/${circleId}/posts/${postId}/react`, {}),

  // Feed: add comment
  addComment: (circleId, postId, text) =>
    apiClient.post(`${API_BASE}/${circleId}/posts/${postId}/comments`, { text }),

  // Feed: delete comment
  deleteComment: (circleId, postId, commentId) =>
    apiClient.delete(`${API_BASE}/${circleId}/posts/${postId}/comments/${commentId}`),
};
