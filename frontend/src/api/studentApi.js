import apiClient from './axiosClient';

export const studentApi = {
  getAll: (query = '') => apiClient.get(`/api/students${query ? `?search=${encodeURIComponent(query)}` : ''}`),
  getById: (id) => apiClient.get(`/api/students/${id}`),
  create: (data) => apiClient.post('/api/students', data),
  update: (id, data) => apiClient.put(`/api/students/${id}`, data),
  delete: (id) => apiClient.delete(`/api/students/${id}`),
};
