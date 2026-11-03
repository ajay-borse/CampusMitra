import apiClient from './axiosClient';

export const notificationApi = {
  getNotifications: (params = {}) => apiClient.get('/api/notifications', { params }),
  markOneRead: (id) => apiClient.put(`/api/notifications/${id}/read`),
  markAllRead: () => apiClient.put('/api/notifications/read-all'),
  deleteNotification: (id) => apiClient.delete(`/api/notifications/${id}`),
};
