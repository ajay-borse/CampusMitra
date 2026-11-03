import apiClient from './axiosClient';

export const moderationApi = {
  blockUser: (blockedUserId, reason) =>
    apiClient.post('/api/moderation/blocks', { blockedUserId, reason }),
  reportUser: (reportedUserId, reason, description) =>
    apiClient.post('/api/moderation/reports', { reportedUserId, reason, description }),
};
