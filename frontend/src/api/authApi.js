import apiClient from './axiosClient';

export const authApi = {
  register: (payload) => apiClient.post('/api/auth/register', payload),
  login: (payload) => apiClient.post('/api/auth/login', payload),
  getMe: () => apiClient.get('/api/auth/me'),
  verifyEmail: (token) => apiClient.get(`/api/auth/verify-email/${token}`),
};
