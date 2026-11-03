import apiClient from './axiosClient';

export const profileApi = {
  getMyProfile: () => apiClient.get('/api/profiles/me'),
  updateProfile: (data) => apiClient.put('/api/profiles/me', data),
  uploadPhoto: (formData) =>
    apiClient.post('/api/profiles/me/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deletePhoto: (photoUrl) =>
    apiClient.delete('/api/profiles/me/photos', { data: { photoUrl } }),
  reorderPhotos: (photos) =>
    apiClient.put('/api/profiles/me/photos/reorder', { photos }),
};
