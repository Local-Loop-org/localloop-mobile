import type {
  ChatMessage,
  GetHistoryParams,
  MessageHistoryResponse,
} from './messages.api';
import { apiClient } from './api-client';

export interface DmConversationDto {
  peerId: string;
  peerName: string;
  peerAvatarUrl: string | null;
  lastMessage: {
    content: string | null;
    senderName: string;
    createdAt: string;
  };
  unreadCount: number;
  archived: boolean;
}

export interface ListDmConversationsResponse {
  data: DmConversationDto[];
  next_cursor: string | null;
}

export interface DmRequestDto {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string | null;
  createdAt: string;
}

export interface ListDmRequestsResponse {
  data: DmRequestDto[];
  next_cursor: string | null;
}

export interface DmExceptionDto {
  peerId: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface ListDmExceptionsResponse {
  data: DmExceptionDto[];
  next_cursor: string | null;
}

export interface ListDmParams {
  limit?: number;
  cursor?: string;
}

function listParams(params: ListDmParams = {}): Record<string, string | number> {
  const query: Record<string, string | number> = {
    limit: params.limit ?? 20,
  };
  if (params.cursor) query.cursor = params.cursor;
  return query;
}

export const dmApi = {
  listDmConversations: async (
    params: ListDmParams = {},
  ): Promise<ListDmConversationsResponse> => {
    const { data } = await apiClient.get<ListDmConversationsResponse>('/dm', {
      params: listParams(params),
    });
    return data;
  },

  listDmRequests: async (
    params: ListDmParams = {},
  ): Promise<ListDmRequestsResponse> => {
    const { data } = await apiClient.get<ListDmRequestsResponse>(
      '/dm/requests',
      { params: listParams(params) },
    );
    return data;
  },

  acceptDmRequest: async (requestId: string): Promise<ChatMessage> => {
    const { data } = await apiClient.post<ChatMessage>(
      `/dm/requests/${requestId}/accept`,
    );
    return data;
  },

  declineDmRequest: async (requestId: string): Promise<void> => {
    await apiClient.post(`/dm/requests/${requestId}/decline`);
  },

  listDmExceptions: async (
    params: ListDmParams = {},
  ): Promise<ListDmExceptionsResponse> => {
    const { data } = await apiClient.get<ListDmExceptionsResponse>(
      '/users/me/dm-exceptions',
      { params: listParams(params) },
    );
    return data;
  },

  removeDmException: async (peerId: string): Promise<void> => {
    await apiClient.delete(`/users/me/dm-exceptions/${peerId}`);
  },

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
