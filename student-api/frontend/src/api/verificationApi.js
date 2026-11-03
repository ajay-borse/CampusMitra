import apiClient from './axiosClient';

export const verificationApi = {
  uploadStudentId: (formData) =>
    apiClient.post('/api/verifications/student-id', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStatus: () => apiClient.get('/api/verifications/status'),
};
