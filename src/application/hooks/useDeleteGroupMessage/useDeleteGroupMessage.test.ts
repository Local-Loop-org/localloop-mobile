import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import {
  QueryClient,
  QueryClientProvider,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  GroupMessage,
  GroupMessageHistoryResponse,
} from '@localloop/shared-types';
import { messagesApi } from '@/infra/api/messages.api';
import { chatHistoryKey } from '../useGroupChat/useGroupChat';
import {
  removeGroupMessageById,
  useDeleteGroupMessage,
} from './useDeleteGroupMessage';

jest.mock('@/infra/api/messages.api', () => ({
  messagesApi: { deleteMessage: jest.fn() },
}));

const mockedDelete = messagesApi.deleteMessage as jest.MockedFunction<
  typeof messagesApi.deleteMessage
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

function buildMessage(id: string): GroupMessage {
  return {
    id,
    senderId: 'u-1',
    senderName: 'Alice',
    senderAvatarUrl: null,
    content: id,
    mediaUrl: null,
    mediaType: null,
    createdAt: '2026-05-28T10:00:00.000Z',
    replyTo: null,
    isDeleted: false,
    editedAt: null,
  };
}

function seedHistory(client: QueryClient, groupId: string, ids: string[]) {
  const cache: InfiniteData<GroupMessageHistoryResponse> = {
    pageParams: [undefined],
    pages: [
      {
        data: ids.map(buildMessage),
        next_cursor: null,
      },
    ],
  };
  client.setQueryData(chatHistoryKey(groupId), cache);
}

describe('removeGroupMessageById', () => {
  it('returns the same reference when the id is absent', () => {
    const cache: InfiniteData<GroupMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        { data: [buildMessage('a'), buildMessage('b')], next_cursor: null },
      ],
    };
    expect(removeGroupMessageById(cache, 'missing')).toBe(cache);
  });

  it('removes the message from the matching page', () => {
    const cache: InfiniteData<GroupMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        { data: [buildMessage('a'), buildMessage('b')], next_cursor: null },
      ],
    };
    const next = removeGroupMessageById(cache, 'a');
    expect(next?.pages[0]?.data.map((m) => m.id)).toEqual(['b']);
  });

  it('returns undefined when given undefined', () => {
    expect(removeGroupMessageById(undefined, 'a')).toBeUndefined();
  });
});

describe('useDeleteGroupMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('optimistically removes the message and confirms on success', async () => {
    mockedDelete.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();
    seedHistory(client, 'g-1', ['m-1', 'm-2', 'm-3']);

    const { result } = renderHook(() => useDeleteGroupMessage(), { wrapper });
    result.current.mutate({ groupId: 'g-1', messageId: 'm-2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cache = client.getQueryData<
      InfiniteData<GroupMessageHistoryResponse>
    >(chatHistoryKey('g-1'));
    expect(cache?.pages[0]?.data.map((m) => m.id)).toEqual(['m-1', 'm-3']);
    expect(mockedDelete).toHaveBeenCalledWith('m-2');
    client.clear();
  });

  it('rolls back to the snapshot when the API call fails', async () => {
    mockedDelete.mockRejectedValueOnce(new Error('boom'));
    const { client, wrapper } = makeWrapper();
    seedHistory(client, 'g-1', ['m-1', 'm-2']);

    const { result } = renderHook(() => useDeleteGroupMessage(), { wrapper });
    result.current.mutate({ groupId: 'g-1', messageId: 'm-2' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cache = client.getQueryData<
      InfiniteData<GroupMessageHistoryResponse>
    >(chatHistoryKey('g-1'));
    expect(cache?.pages[0]?.data.map((m) => m.id)).toEqual(['m-1', 'm-2']);
    client.clear();
  });

  it('is a no-op on an empty cache', async () => {
    mockedDelete.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useDeleteGroupMessage(), { wrapper });
    result.current.mutate({ groupId: 'g-1', messageId: 'm-2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      client.getQueryData(chatHistoryKey('g-1')),
    ).toBeUndefined();
    client.clear();
  });
});
