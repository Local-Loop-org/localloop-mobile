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
  applyEditedToDirectMessage,
  useEditDirectMessage,
} from './useEditDirectMessage';

jest.mock('@/infra/api/dm.api', () => ({
  dmApi: { editDirectMessage: jest.fn() },
}));

const mockedEdit = dmApi.editDirectMessage as jest.MockedFunction<
  typeof dmApi.editDirectMessage
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

function buildMessage(id: string, content = id): DirectMessage {
  return {
    id,
    clientMessageId: null,
    senderId: 'me',
    senderName: 'Me',
    senderAvatarUrl: null,
    recipientId: 'peer-1',
    content,
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
        data: ids.map((id) => buildMessage(id)),
        lastReadAt: null,
        peerLastReadAt: null,
        next_cursor: null,
      },
    ],
  };
  client.setQueryData(dmHistoryKey(peerId), cache);
}

describe('applyEditedToDirectMessage', () => {
  it('returns the same reference when the id is absent', () => {
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
    expect(
      applyEditedToDirectMessage(cache, {
        messageId: 'missing',
        content: 'x',
        editedAt: '2026-05-30T10:00:00.000Z',
      }),
    ).toBe(cache);
  });

  it('returns the same reference when content and editedAt match exactly', () => {
    const cache: InfiniteData<DirectMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        {
          data: [
            { ...buildMessage('a'), content: 'hello', editedAt: '2026-05-30T10:00:00.000Z' },
          ],
          lastReadAt: null,
          peerLastReadAt: null,
          next_cursor: null,
        },
      ],
    };
    expect(
      applyEditedToDirectMessage(cache, {
        messageId: 'a',
        content: 'hello',
        editedAt: '2026-05-30T10:00:00.000Z',
      }),
    ).toBe(cache);
  });

  it('rewrites content + editedAt on the matching message', () => {
    const cache: InfiniteData<DirectMessageHistoryResponse> = {
      pageParams: [undefined],
      pages: [
        {
          data: [buildMessage('a', 'old'), buildMessage('b')],
          lastReadAt: null,
          peerLastReadAt: null,
          next_cursor: null,
        },
      ],
    };
    const next = applyEditedToDirectMessage(cache, {
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
});

describe('useEditDirectMessage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('optimistically rewrites the message and confirms on success', async () => {
    mockedEdit.mockResolvedValueOnce(undefined);
    const { client, wrapper } = makeWrapper();
    seedHistory(client, 'peer-1', ['dm-1', 'dm-2', 'dm-3']);

    const { result } = renderHook(() => useEditDirectMessage(), { wrapper });
    result.current.mutate({
      peerId: 'peer-1',
      messageId: 'dm-2',
      content: 'updated',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cache = client.getQueryData<
      InfiniteData<DirectMessageHistoryResponse>
    >(dmHistoryKey('peer-1'));
    expect(cache?.pages[0]?.data.map((m) => m.content)).toEqual([
      'dm-1',
      'updated',
      'dm-3',
    ]);
    expect(mockedEdit).toHaveBeenCalledWith('dm-2', { content: 'updated' });
    client.clear();
  });

  it('rolls back to the snapshot when the API call fails', async () => {
    mockedEdit.mockRejectedValueOnce(new Error('boom'));
    const { client, wrapper } = makeWrapper();
    seedHistory(client, 'peer-1', ['dm-1', 'dm-2']);

    const { result } = renderHook(() => useEditDirectMessage(), { wrapper });
    result.current.mutate({
      peerId: 'peer-1',
      messageId: 'dm-2',
      content: 'updated',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cache = client.getQueryData<
      InfiniteData<DirectMessageHistoryResponse>
    >(dmHistoryKey('peer-1'));
    expect(cache?.pages[0]?.data.map((m) => m.content)).toEqual(['dm-1', 'dm-2']);
    client.clear();
  });
});
