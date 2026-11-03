import apiClient from './axiosClient';

export const discoverApi = {
  getProfiles: (params = {}) => apiClient.get('/api/discover', { params }),
};
