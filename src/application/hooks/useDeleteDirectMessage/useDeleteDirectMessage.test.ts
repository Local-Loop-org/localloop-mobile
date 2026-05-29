import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import {
  QueryClient,
  QueryClientProvider,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  DirectMessage,
  DirectMessageHistoryResponse,
} from '@localloop/shared-types';
import { dmApi } from '@/infra/api/dm.api';
import { dmHistoryKey } from '../useDmHistory/dmHistoryQuery';
import {
  removeDirectMessageById,
  useDeleteDirectMessage,
} from './useDeleteDirectMessage';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: { deleteDirectMessage: jest.fn() },
}));

const mockedDelete = dmApi.deleteDirectMessage as jest.MockedFunction<
  typeof dmApi.deleteDirectMessage
>;

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client }, children),
  };
}

function buildMessage(id: string): DirectMessage {
  return {
    id,
    clientMessageId: null,
    senderId: 'me',
    senderName: 'Me',
    senderAvatarUrl: null,
    recipientId: 'peer-1',
    content: id,
    mediaUrl: null,
    mediaType: null,
    createdAt: '2026-05-28T10:00:00.000Z',
    replyTo: null,
    isDeleted: false,
    editedAt: null,
  };
}

function seedHistory(client: QueryClient, peerId: string, ids: string[]) {
  const cache: InfiniteData<DirectMessageHistoryResponse> = {
    pageParams: [undefined],
    pages: [
      {
        data: ids.map(buildMessage),
        lastReadAt: null,
        peerLastReadAt: null,
        next_cursor: null,
      },
    ],
  };
  client.setQueryData(dmHistoryKey(peerId), cache);
}

describe('removeDirectMessageById', () => {
  it('returns the same reference when the id is absent', () => {
    const cache: InfiniteData<DirectMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        {
          data: [buildMessage('a')],
          lastReadAt: null,
          peerLastReadAt: null,
          next_cursor: null,
        },
      ],
    };
    expect(removeDirectMessageById(cache, 'missing')).toBe(cache);
  });

  it('removes the message from the matching page', () => {
    const cache: InfiniteData<DirectMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        {
          data: [buildMessage('a'), buildMessage('b')],
          lastReadAt: null,
          peerLastReadAt: null,
          next_cursor: null,
        },
      ],
    };
    const next = removeDirectMessageById(cache, 'a');
    expect(next?.pages[0]?.data.map((m) => m.id)).toEqual(['b']);
  });
});

describe('useDeleteDirectMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('optimistically removes the message and confirms on success', async () => {
    mockedDelete.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();
    seedHistory(client, 'peer-1', ['dm-1', 'dm-2', 'dm-3']);

    const { result } = renderHook(() => useDeleteDirectMessage(), { wrapper });
    result.current.mutate({ peerId: 'peer-1', messageId: 'dm-2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cache = client.getQueryData<
      InfiniteData<DirectMessageHistoryResponse>
    >(dmHistoryKey('peer-1'));
    expect(cache?.pages[0]?.data.map((m) => m.id)).toEqual(['dm-1', 'dm-3']);
    expect(mockedDelete).toHaveBeenCalledWith('dm-2');
    client.clear();
  });

  it('rolls back to the snapshot when the API call fails', async () => {
    mockedDelete.mockRejectedValueOnce(new Error('boom'));
    const { client, wrapper } = makeWrapper();
    seedHistory(client, 'peer-1', ['dm-1', 'dm-2']);

    const { result } = renderHook(() => useDeleteDirectMessage(), { wrapper });
    result.current.mutate({ peerId: 'peer-1', messageId: 'dm-2' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cache = client.getQueryData<
      InfiniteData<DirectMessageHistoryResponse>
    >(dmHistoryKey('peer-1'));
    expect(cache?.pages[0]?.data.map((m) => m.id)).toEqual(['dm-1', 'dm-2']);
    client.clear();
  });
});
