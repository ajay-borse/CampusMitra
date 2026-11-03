import apiClient from './axiosClient';

export const chatApi = {
  getConversations: () => apiClient.get('/api/conversations'),
  getMessages: (conversationId) =>
    apiClient.get(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, text) =>
    apiClient.post(`/api/conversations/${conversationId}/messages`, { text }),
};
