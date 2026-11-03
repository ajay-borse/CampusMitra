import apiClient from './axiosClient';

export const connectionApi = {
  sendInterest: (targetUserId) =>
    apiClient.post('/api/connections/interest', { targetUserId }),
  sendPass: (targetUserId) =>
    apiClient.post('/api/connections/pass', { targetUserId }),
  getConnections: () => apiClient.get('/api/connections'),
};
