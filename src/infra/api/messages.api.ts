// src/infra/api/messages.api.ts

import { MediaType } from '@localloop/shared-types';
import { apiClient } from './api-client';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string | null;
  mediaUrl: string | null;
  mediaType: MediaType | null;
  createdAt: string;
}

export interface MessageHistoryResponse {
  data: ChatMessage[];
  next_cursor: string | null;
}

export interface GetHistoryParams {
  limit?: number;
  before?: string;
}

export const messagesApi = {
  /**
   * Fetch message history for a group, newest-first. `before` is the ISO
   * `next_cursor` returned by a prior call; omit for the first page.
   */
  getHistory: async (
    groupId: string,
    params: GetHistoryParams = {},
  ): Promise<MessageHistoryResponse> => {
    const query: Record<string, string | number> = { limit: params.limit ?? 50 };
    if (params.before) query.before = params.before;
    const { data } = await apiClient.get<MessageHistoryResponse>(
      `/groups/${groupId}/messages`,
      { params: query },
    );
    return data;
  },
};
