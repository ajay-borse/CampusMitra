import apiClient from './axiosClient';

export const interestApi = {
  getInterests: (params) => apiClient.get('/api/interests', { params }),
  addCustomInterest: (payload) => apiClient.post('/api/interests/custom', payload),
};
