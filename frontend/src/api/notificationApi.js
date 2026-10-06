import apiClient from './axiosClient';

export const notificationApi = {
  getNotifications: () => apiClient.get('/api/notifications'),
  markAllRead: () => apiClient.put('/api/notifications/read-all'),
};
