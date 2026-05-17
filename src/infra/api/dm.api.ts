import type { ChatMessage, MessageHistoryResponse, GetHistoryParams } from './messages.api';
import { apiClient } from './api-client';

export const dmApi = {
  getDmHistory: async (
    peerId: string,
    params: GetHistoryParams = {},
  ): Promise<MessageHistoryResponse> => {
    const query: Record<string, string | number> = { limit: params.limit ?? 50 };
    if (params.before) query.before = params.before;
    const { data } = await apiClient.get<MessageHistoryResponse>(
      `/dm/${peerId}`,
      { params: query },
    );
    return data;
  },
};
