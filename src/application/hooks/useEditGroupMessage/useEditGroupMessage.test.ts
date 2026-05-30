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
  applyEditedToGroupMessage,
  useEditGroupMessage,
} from './useEditGroupMessage';

jest.mock('@/infra/api/messages.api', () => ({
  messagesApi: { editMessage: jest.fn() },
}));

const mockedEdit = messagesApi.editMessage as jest.MockedFunction<
  typeof messagesApi.editMessage
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

function buildMessage(id: string, content = id): GroupMessage {
  return {
    id,
    clientMessageId: null,
    senderId: 'u-1',
    senderName: 'Alice',
    senderAvatarUrl: null,
    content,
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
    pages: [{ data: ids.map((id) => buildMessage(id)), next_cursor: null }],
  };
  client.setQueryData(chatHistoryKey(groupId), cache);
}

describe('applyEditedToGroupMessage', () => {
  it('returns the same reference when the id is absent', () => {
    const cache: InfiniteData<GroupMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        { data: [buildMessage('a'), buildMessage('b')], next_cursor: null },
      ],
    };
    expect(
      applyEditedToGroupMessage(cache, {
        messageId: 'missing',
        content: 'x',
        editedAt: '2026-05-30T10:00:00.000Z',
      }),
    ).toBe(cache);
  });

  it('returns the same reference when content and editedAt match exactly', () => {
    const cache: InfiniteData<GroupMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        {
          data: [
            { ...buildMessage('a'), content: 'hello', editedAt: '2026-05-30T10:00:00.000Z' },
          ],
          next_cursor: null,
        },
      ],
    };
    expect(
      applyEditedToGroupMessage(cache, {
        messageId: 'a',
        content: 'hello',
        editedAt: '2026-05-30T10:00:00.000Z',
      }),
    ).toBe(cache);
  });

  it('rewrites content + editedAt on the matching message', () => {
    const cache: InfiniteData<GroupMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        { data: [buildMessage('a', 'old'), buildMessage('b')], next_cursor: null },
      ],
    };
    const next = applyEditedToGroupMessage(cache, {
      messageId: 'a',
      content: 'new',
      editedAt: '2026-05-30T10:00:00.000Z',
    });
    expect(next).not.toBe(cache);
    expect(next?.pages[0]?.data[0]).toMatchObject({
      id: 'a',
      content: 'new',
      editedAt: '2026-05-30T10:00:00.000Z',
    });
    expect(next?.pages[0]?.data[1]).toBe(cache.pages[0]?.data[1]);
  });

  it('returns undefined when given undefined', () => {
    expect(
      applyEditedToGroupMessage(undefined, {
        messageId: 'a',
        content: 'x',
        editedAt: '2026-05-30T10:00:00.000Z',
      }),
    ).toBeUndefined();
  });
});

describe('useEditGroupMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('optimistically rewrites the message and confirms on success', async () => {
    mockedEdit.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();
    seedHistory(client, 'g-1', ['m-1', 'm-2', 'm-3']);

    const { result } = renderHook(() => useEditGroupMessage(), { wrapper });
    result.current.mutate({ groupId: 'g-1', messageId: 'm-2', content: 'updated' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cache = client.getQueryData<
      InfiniteData<GroupMessageHistoryResponse>
    >(chatHistoryKey('g-1'));
    expect(cache?.pages[0]?.data.map((m) => m.content)).toEqual([
      'm-1',
      'updated',
      'm-3',
    ]);
    expect(mockedEdit).toHaveBeenCalledWith('m-2', { content: 'updated' });
    client.clear();
  });

  it('rolls back to the snapshot when the API call fails', async () => {
    mockedEdit.mockRejectedValueOnce(new Error('boom'));
    const { client, wrapper } = makeWrapper();
    seedHistory(client, 'g-1', ['m-1', 'm-2']);

    const { result } = renderHook(() => useEditGroupMessage(), { wrapper });
    result.current.mutate({ groupId: 'g-1', messageId: 'm-2', content: 'updated' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cache = client.getQueryData<
      InfiniteData<GroupMessageHistoryResponse>
    >(chatHistoryKey('g-1'));
    expect(cache?.pages[0]?.data.map((m) => m.content)).toEqual(['m-1', 'm-2']);
    client.clear();
  });

  it('is a no-op on an empty cache', async () => {
    mockedEdit.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();

    const { result } = renderHook(() => useEditGroupMessage(), { wrapper });
    result.current.mutate({ groupId: 'g-1', messageId: 'm-2', content: 'updated' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(chatHistoryKey('g-1'))).toBeUndefined();
    client.clear();
  });
});
