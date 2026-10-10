import apiClient from './axiosClient';

const API_BASE = '/api/vibe';

export const vibeApi = {
  // Get shared vibe, icebreakers, and conversation games for an active conversation
  getConversationVibe: (conversationId, offset = 0) =>
    apiClient.get(`${API_BASE}/conversation/${conversationId}`, {
      params: { offset },
    }),

  // Get shared vibe and icebreakers for a candidate or matched student profile
  getProfileVibe: (targetUserId, offset = 0) =>
    apiClient.get(`${API_BASE}/profile/${targetUserId}`, {
      params: { offset },
    }),

  // Send a conversation game prompt directly into an authorized conversation
  sendGamePrompt: (conversationId, gameData) =>
    apiClient.post(`${API_BASE}/conversation/${conversationId}/game-prompt`, gameData),
};
