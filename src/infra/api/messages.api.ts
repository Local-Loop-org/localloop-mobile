import type { GroupMessageHistoryResponse } from '@localloop/shared-types';
import { apiClient } from './api-client';

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
  ): Promise<GroupMessageHistoryResponse> => {
    const query: Record<string, string | number> = { limit: params.limit ?? 50 };
    if (params.before) query.before = params.before;
    const { data } = await apiClient.get<GroupMessageHistoryResponse>(
      `/groups/${groupId}/messages`,
      { params: query },
    );
    return data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },

  editMessage: async (
    messageId: string,
    body: { content: string },
  ): Promise<void> => {
    await apiClient.patch(`/messages/${messageId}`, body);
  },
};
