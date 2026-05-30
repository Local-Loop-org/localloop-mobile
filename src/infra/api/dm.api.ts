import type {
  DirectMessage,
  DirectMessageHistoryResponse,
  ListDmExceptionCandidatesResponse,
} from '@localloop/shared-types';
import type { GetHistoryParams } from './messages.api';
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
  lastReadAt?: string | null;
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

  acceptDmRequest: async (requestId: string): Promise<DirectMessage> => {
    const { data } = await apiClient.post<DirectMessage>(
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

  addDmException: async (peerId: string): Promise<void> => {
    await apiClient.put(`/users/me/dm-exceptions/${peerId}`);
  },

  removeDmException: async (peerId: string): Promise<void> => {
    await apiClient.delete(`/users/me/dm-exceptions/${peerId}`);
  },

  listDmExceptionCandidates: async (
    params: { limit?: number; cursor?: string; q?: string } = {},
  ): Promise<ListDmExceptionCandidatesResponse> => {
    const query: Record<string, string | number> = {
      limit: params.limit ?? 20,
    };
    if (params.cursor) query.cursor = params.cursor;
    if (params.q && params.q.trim().length > 0) query.q = params.q.trim();
    const { data } = await apiClient.get<ListDmExceptionCandidatesResponse>(
      '/users/me/dm-exception-candidates',
      { params: query },
    );
    return data;
  },

  archiveDmConversation: async (peerId: string): Promise<void> => {
    await apiClient.put(`/dm/${peerId}/archive`);
  },

  unarchiveDmConversation: async (peerId: string): Promise<void> => {
    await apiClient.delete(`/dm/${peerId}/archive`);
  },

  getDmHistory: async (
    peerId: string,
    params: GetHistoryParams = {},
  ): Promise<DirectMessageHistoryResponse> => {
    const query: Record<string, string | number> = { limit: params.limit ?? 50 };
    if (params.before) query.before = params.before;
    const { data } = await apiClient.get<DirectMessageHistoryResponse>(
      `/dm/${peerId}`,
      { params: query },
    );
    return data;
  },

  deleteDirectMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/dm/messages/${messageId}`);
  },

  editDirectMessage: async (
    messageId: string,
    body: { content: string },
  ): Promise<void> => {
    await apiClient.patch(`/dm/messages/${messageId}`, body);
  },
};
